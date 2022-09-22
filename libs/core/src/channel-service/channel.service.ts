import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorChannel } from './sensor-channel.class'
import { INTERFACE_NAME_TOKEN, SENSOR_TYPE_MAPPERS_TOKEN } from '../core.module'
import { DiscoveryConfig } from './discovery-config.class'
import { regexExtract, regexTest } from '@core/helpers/helpers'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { DiscoveredSensor, SensorTypeMapper } from './types'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - TFITE : Foreign Incoming SENSOR Type Enum = litteral string type van de mogelijke externe inkomende sensor types
 * - TFC : Foreign Command - vorm van de commando's die naar de externe interface kant gestuurd worden
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export class ChannelService<TFVS, TFITE extends string, TFC = any> {
  private _sensorChannels: SensorChannel<TFVS>[] = []
  private _sensorIgnoreList: { name: string; uid: string }[] = []
  private _actuatorChannels: ActuatorChannel<TFC>[] = []
  private readonly _discoveryConfig: DiscoveryConfig

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) private readonly _interfaceName: string,
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
    @Inject(SENSOR_TYPE_MAPPERS_TOKEN)
    private readonly _sensorTypeMappers: Record<TFITE, SensorTypeMapper<TFVS>>, // @Inject(ACTUATOR_TYPE_MAPPERS_TOKEN) // private readonly _actuatorTypeMappers: Record<CommandTypeEnum, ActuatorTypeMapper<TFC>>,
  ) {
    this._discoveryConfig = new DiscoveryConfig(this._config, this._interfaceName)
  }

  public sensorDiscovery(
    discoveredSensors: DiscoveredSensor<TFITE, TFVS>[],
    initialStateProcessor: ((state: TFVS, channel: SensorChannel<TFVS>) => void) | undefined = undefined,
    stateLogger: ((state: TFVS) => string) | undefined = undefined,
  ) {
    this._sensorIgnoreList = discoveredSensors
      .filter(ds => regexTest(ds.name, this._discoveryConfig.sensorIgnore))
      .map(ds => ({ uid: ds.uid, name: ds.name }))
    this._sensorChannels = discoveredSensors
      .filter(ds => !this._sensorIgnoreList.some(s => s.uid === ds.uid))
      .map(ds => {
        const typeMapper: SensorTypeMapper<TFVS> = this._sensorTypeMappers[ds.foreignTypeName]
        const matchingFilter = this._discoveryConfig.sensorDiscover.find(f => regexTest(ds.name, f.filter))
        const name = regexExtract(ds.name, matchingFilter.filter, 'name') + typeMapper.nameExtension
        const type = matchingFilter.type ?? typeMapper.measurementType
        const logMessage =
          `Found sensor "${name}", type=${type}, uid=${ds.uid}` +
          (stateLogger && ds.state ? `, state=${stateLogger(ds.state)}` : '')
        this._log.log(logMessage)
        return { uid: ds.uid, name, type, transformer: typeMapper.transformer }
      })
    discoveredSensors.forEach(ds => initialStateProcessor(ds.state, this.getSensor(ds.uid)))
  }

  getSensor(uid: string): SensorChannel<TFVS> {
    return this._sensorChannels.find(sc => sc.uid === uid)
  }

  public discoverActuators() {}
}
