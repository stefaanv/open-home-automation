import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorChannel } from './sensor-channel.class'
import { InterfaceConfig } from './discovery-config.class'
import { regexExtract, regexTest } from '@core/helpers/helpers'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { DiscoveredActuator, DiscoveredSensor, SensorTypeMapper, ActuatorTypeMapper } from './types'
import { SensorReading } from '@core/sensor-reading.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ActuatorTypeEnum } from '@core/commands/command-type.enum'

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - FSTE : Foreign SENSOR-reading Type Enum = litteral string type van de mogelijke externe inkomende sensor types
 * - FATE : Foreign ACTUATOR-command Type Enum
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export class InterfaceBase<TFVS, FSTE extends string, FATE extends string> {
  protected _sensorIgnoreList: { name: string; uid: string }[] = []
  protected _sensorChannels: SensorChannel<TFVS>[] = []
  protected _actuatorIgnoreList: { name: string; uid: string }[] = []
  protected _actuatorChannels: ActuatorChannel[] = []
  protected readonly _interfaceConfig: InterfaceConfig<FSTE, FATE>

  constructor(
    protected readonly _interfaceName: string,
    protected readonly _log: LoggingService,
    protected readonly _config: ConfigService,
    protected readonly _mqttDriver: MqttDriver,
  ) {
    this._interfaceConfig = new InterfaceConfig(this._config, _interfaceName)
  }

  protected discoverSensors(
    discoveredSensors: DiscoveredSensor<FSTE, TFVS>[],
    typeMappers: Record<FSTE, SensorTypeMapper<TFVS>>,
    stateLogger: ((state: TFVS) => string) | undefined = undefined,
  ) {
    this._sensorIgnoreList = discoveredSensors
      .filter(ds => regexTest(ds.name, this._interfaceConfig.sensorIgnore))
      .map(ds => ({ uid: ds.uid, name: ds.name }))
    this._sensorChannels = discoveredSensors
      .filter(ds => !this._sensorIgnoreList.some(s => s.uid === ds.uid))
      // .filter(ds => ds.uid !== '00:15:8d:00:02:f2:42:b6-01-0006')
      .map(ds => {
        const typeMapper = typeMappers[ds.foreignType]
        const matchingFilter = this._interfaceConfig.sensorDiscover.find(f => regexTest(ds.name, f.filter))
        const name = regexExtract(ds.name, matchingFilter.filter, 'name') + typeMapper.nameExtension
        const type = (matchingFilter.type ?? typeMapper.measurementType) as MeasurementTypeEnum
        const logMessage =
          `Found sensor "${name}", type=${type}, uid=${ds.uid}` +
          (stateLogger && ds.state ? `, state=${stateLogger(ds.state)}` : '')
        this._log.log(logMessage)
        return { uid: ds.uid, name, type, transformer: typeMapper.transformer }
      })
    const definedSensors = this._interfaceConfig.sensorDefinition
      .map<SensorChannel<TFVS>>(s => {
        const transformer = typeMappers[s.foreignType].transformer
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
  }

  protected discoverActuators(
    discoveredActuators: DiscoveredActuator<FATE>[],
    typeMappers: Record<FATE, ActuatorTypeMapper>,
    stateLogger: ((state: TFVS) => string) | undefined = undefined,
  ) {
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
    /*
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

  protected sendSensorStateUpdate(uid: string, foreignState: TFVS, timestamp = new Date()) {
    const channel = this.getSensorChannel(uid)
    if (!channel) {
      this._log.error(`channel ${uid} not found at sendSensorStateUpdate - unable to send update`)
      return
    }
    if (!channel.transformer) {
      this._log.error(`channel ${uid} has np transformer - unable to send update`)
      return
    }
    const value = channel.transformer(foreignState)
    delete value.type // type will be duplicated due to type branding

    const update: SensorReading = {
      origin: this._interfaceName,
      time: timestamp,
      type: channel.type,
      value,
    }

    this._mqttDriver.sendSensorStateUpdate(channel.name, update)
  }

  getSensorChannel(uid: string): SensorChannel<TFVS> {
    return this._sensorChannels.find(sc => sc.uid === uid)
  }

  sensorToBeIgnored(uid: string): boolean {
    return this._sensorIgnoreList.some(i => i.uid === uid)
  }
}
