import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { InterfaceConfig } from './discovery-config.class'
import { Sensor } from '@core/sensors-actuators/sensor.class'
import { Actuator } from '@core/sensors-actuators/actuator.class'
import { regexTest } from '@core/helpers/helpers'
import { UID } from '@core/sensors-actuators/uid.type'
import { ActuatorTypeMapper, SensorTypeMapper } from '@core/channel-service/types'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'

export type DiscoverableSensor<FTE extends string> = {
  name: string
  id: UID
  foreignType: FTE
  sensorIgnoreLogInfo: string
  state: any
  lastupdated: Date | undefined
  foreignConfig: any
}

export type DiscoverableActuator<FATE extends string> = {
  name: string
  id: UID
  foreignType: FATE
  actuatorIgnoreLogInfo: string
  foreignConfig: any
}

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - FTE : Foreign SENSOR-reading AND ACTUATOR-command Type Enum = litteral string type van de mogelijke externe inkomende sensor en actuator types
 * - FATE : Foreign ACTUATOR-command Type Enum = litteral string type van de mogelijke externe en actuator types
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export abstract class InterfaceBase<FTE extends string, FATE extends FTE> {
  protected _sensorIgnoreList: UID[] = []
  protected _sensorChannels: Sensor<FTE>[] = []
  protected _actuatorIgnoreList: UID[] = []
  protected _actuatorChannels: Actuator<FTE>[] = []
  protected readonly _interfaceConfig: InterfaceConfig<FTE, FATE>

  constructor(
    protected readonly _interfaceName: string,
    protected readonly _log: LoggingService,
    protected readonly _config: ConfigService,
    protected readonly _mqttDriver: MqttDriver,
  ) {
    this._interfaceConfig = new InterfaceConfig(this._config, _interfaceName, _log)
  }

  public discoverSensors(sensorList: DiscoverableSensor<FTE>[], typeMapper: SensorTypeMapper<FTE>) {
    const typeIndicators = this._interfaceConfig.sensorTypeIndicatorList
    // store the UID's of sensors to be ignored
    this._sensorIgnoreList = sensorList
      .filter(s => regexTest(s.name, this._interfaceConfig.sensorIgnore))
      .map(s => {
        this._log.debug(`Ignoring sensor ${s.sensorIgnoreLogInfo}`)
        return s
      })
      .map(ds => ds.id)

    // Transform received/discovereds - sensors
    sensorList
      .filter(s => !this._sensorIgnoreList.includes(s.id))
      // .filter(ds => ds.id !== '00:15:8d:00:02:f2:42:b6-01-0006')
      .forEach(s => {
        const mapperMeasurementType = typeMapper[s.foreignType]
        const discoveryConfig = this._interfaceConfig.findDiscoveryConfig(s.name, 'sensor')
        if (!discoveryConfig) return // no configuration that matches `name` and `type`, stop here
        const extractedInfo = discoveryConfig.filter.exec(s.name)!.groups
        if (!extractedInfo) {
          this._log.error(`Unable to extract name convertion information from "${s.name}"`)
          return
        }

        const nameCreateInfo = { ...extractedInfo, typeIndicator: typeIndicators?.[s.foreignType] ?? '' }
        const topic = discoveryConfig.template(nameCreateInfo)
        const measurementType = (discoveryConfig.type ?? mapperMeasurementType) as MeasurementTypeEnum | undefined
        if (!measurementType) {
          this._sensorIgnoreList.push(s.id)
          this._log.debug(`Unable to derive type of ${s.sensorIgnoreLogInfo}`)
          return
        }
        this.addSensor(s.name, new Sensor(s.id, topic, s.foreignType, measurementType, s.state))
      })

    // Transform defined sensors
    this._interfaceConfig.sensorDefinition
      // Ignore discovered channels with the same unique ID
      .filter(s => {
        //TODO warnen indien op ignore list
        const eqCh = this._sensorChannels.find(ch => ch.id === s.uid)
        if (eqCh) {
          const prefix = `Channel with equal UID ${s.uid} like ${s.topic} already discovered`
          if (eqCh.topic === s.topic && eqCh.measurementType === s.type) this._log.warn(prefix)
          else this._log.error(prefix + `- ignoring the definition, discovery takes precedence`)
          return false
        }
        return true
      })
      .forEach(s => this.addSensor('defined sensor', new Sensor(s.uid as UID, s.topic, s.foreignType, s.type)))
  }

  private addSensor(originalName: string, sensor: Sensor<FTE>, lastupdated?: Date): void {
    this._log.log(
      `Found sensor "${originalName}" => "${sensor.topic}", type=${sensor.measurementType}, ` +
        `id=${sensor.id}${!sensor.state ? '' : ', state=' + JSON.stringify(sensor.state).replace(/\\"/, `"`)} `,
    )

    // push new sensor to channel list
    this._sensorChannels.push(sensor)

    // send the initial state to the hub
    if (sensor.state) this.sendSensorStateUpdate(sensor.id, sensor.state, lastupdated)
  }

  public discoverActuators(actuatorList: DiscoverableActuator<FATE>[], typeMapper: ActuatorTypeMapper<FATE>) {
    const typeIndicators = this._interfaceConfig.sensorTypeIndicatorList
    // store the UID's of sensors to be ignored
    this._actuatorIgnoreList = actuatorList
      .filter(a => regexTest(a.name, this._interfaceConfig.actuatorIgnore))
      .map(a => {
        this._log.debug(`Ignoring actuator ${a.actuatorIgnoreLogInfo}`)
        return a
      })
      .map(da => da.id)

    actuatorList
      .filter(a => !this._actuatorIgnoreList.includes(a.id))
      .forEach(a => {
        const mapperActuatorType = typeMapper[a.foreignType]
        const discoveryConfig = this._interfaceConfig.findDiscoveryConfig(a.name, 'actuator')
        if (!discoveryConfig) return // no configuration that matches `name` and `type`, stop here
        const extractedInfo = discoveryConfig.filter.exec(a.name)!.groups
        if (!extractedInfo) {
          this._log.error(`Unable to extract name convertion information from "${a.name}"`)
          return
        }

        const nameCreateInfo = { ...extractedInfo, typeIndicator: typeIndicators?.[a.foreignType] ?? '' }
        const topic = discoveryConfig.template(nameCreateInfo)
        const actuatorType = (discoveryConfig.type ?? mapperActuatorType) as ActuatorTypeEnum | undefined
        if (!actuatorType) {
          this._sensorIgnoreList.push(a.id)
          this._log.debug(`Unable to derive type of ${a.actuatorIgnoreLogInfo}`)
          return
        }

        // push new sensor to channel list
        const actuator = new Actuator(a.id, topic, a.foreignType, actuatorType)
        this.addActuator(a.name, actuator)
      })

    //TODO Defined actuators nog toevoegen
  }

  private addActuator(originalName: string, actuator: Actuator<FATE>): void {
    const logMessage = `Found actuator "${originalName}" => "${actuator.topic}", type=${actuator.actuatorType}, id=${actuator.id}`
    this._log.log(logMessage)

    // push new sensor to channel list
    this._actuatorChannels.push(actuator)
  }

  protected abstract sendSensorStateUpdate(id: UID, state: any, lastupdated?: Date): void
}
