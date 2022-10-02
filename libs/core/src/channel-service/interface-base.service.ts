import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { InterfaceConfig } from './discovery-config.class'
import { DiscoveredActuator, ActuatorTypeMapper } from './types'
import { NewSensor } from '@core/sensors-actuators/sensor.class'
import { NewActuator } from '@core/sensors-actuators/actuator.class'

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - FTE : Foreign SENSOR-reading AND ACTUATOR-command Type Enum = litteral string type van de mogelijke externe inkomende sensor en actuator types
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export class InterfaceBase<TUID, FTE extends string> {
  protected _sensorIgnoreList: TUID[] = []
  protected _sensorChannels: NewSensor<TUID, FTE>[] = []
  protected _actuatorIgnoreList: TUID[] = []
  protected _actuatorChannels: NewActuator<TUID, FTE>[] = []
  protected readonly _interfaceConfig: InterfaceConfig<FTE>

  constructor(
    protected readonly _interfaceName: string,
    protected readonly _log: LoggingService,
    protected readonly _config: ConfigService,
    protected readonly _mqttDriver: MqttDriver,
  ) {
    this._interfaceConfig = new InterfaceConfig(this._config, _interfaceName)
  }

  protected discoverActuators(
    discoveredActuators: DiscoveredActuator<FTE>[],
    typeMappers: Record<FTE, ActuatorTypeMapper>,
  ) {
    /*
    this._actuatorIgnoreList = discoveredActuators
      .filter(ds => regexTest(ds.name, this._interfaceConfig.actuatorIgnore))
      .map(ds => ({ uid: ds.uid, name: ds.name }))

    // this._actuatorChannels
    const test = discoveredActuators
      .filter(da => !this._actuatorIgnoreList.some(da2 => da2.uid === da.uid))
      .map(da => {
        const typeMapper: ActuatorTypeMapper = typeMappers[da.foreignType]
        const matchingFilter = this._interfaceConfig.actuatorDiscover.find(f => regexTest(da.name, f.filter))
        const name = regexExtract(da.name, matchingFilter.filter, 'name') + typeMapper.nameExtension
        const type = (matchingFilter.type ?? typeMapper.actuatorType) as ActuatorTypeEnum
        const logMessage = `Found sensor "${name}", type=${type}, uid=${da.uid}`
        // (stateLogger && da.state ? `, state=${stateLogger(da.state)}` : '')
        this._log.log(logMessage)
        const result: ActuatorChannel = { uid: da.uid, name, type, transformer: typeMapper.transformer }
        return result
      })
    const definedSensors = this._discoveryConfig.sensorDefinition
      .map<SensorChannel<TFVS>>(s => {
        const transformer = this._sensorTypeMappers[s.foreignType].transformer
        return { ...s, transformer }
      })
      // Ignore discovered channels with the same unique ID
      .filter(s => {
        const eqCh = this._sensorChannels.find(ch => ch.uid === s.uid)
        if (eqCh) {
          if (eqCh.name === s.name && eqCh.type === s.type)
            this._log.warn(`Channel with equal UID ${s.uid} like ${s.name} already discovered`)
          else
            this._log.error(
              `Channel with equal UID ${s.uid} like ${s.name}) already discovered ` +
                `- ignoring the definition, discovery takes precedence`,
            )
        }
        return true
      })
    this._sensorChannels.push(...definedSensors)
    */
  }

  protected getSensorChannel(id: TUID): NewSensor<TUID, FTE> | undefined {
    const sensorChannel = this._sensorChannels.find(sc => sc.id === id)
    if (sensorChannel) return sensorChannel
    const actuatorChannel = this._actuatorChannels.find(sc => sc.id === id)
    return actuatorChannel
  }
}
