import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorChannel } from './sensor-channel.class'
import { ActuatorChannel } from './actuator-channel.class'
import { SensorReadingValue } from '@core/sensor-reading-data-types'
import { Command } from '@core/commands/command.type'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { ACTUATOR_TYPE_MAPPERS_TOKEN, INTERFACE_NAME_TOKEN, SENSOR_TYPE_MAPPERS_TOKEN } from '../core.module'
import { DiscoveryConfig } from './discovery-config.class'
import { regexTest } from '@core/helpers/helpers'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { type } from 'os'

export type SensorChannelTransformer<TFVS> = (state: TFVS) => SensorReadingValue
export type ActuatorChannelTransformer<TFC> = (cmd: Command) => TFC
export type SensorTypeMapper<TFVS> = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: SensorChannelTransformer<TFVS>
}
// export type ActuatorTypeMapper =
export type DiscoveredSensor<TUID extends string | number, TFITE> = {
  key: TUID
  name: string
  foreignTypeName: TFITE
}

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TUID: uid type (nummer of string)
 * - TFVS : Foreign Value State - vorm van de status die van de externe interface kant komt
 * - TFITE : Foreign Incoming Type Enum = litteral string type van de mogelijke externe inkomende sensor types
 * - TFC : Foreign Command - vorm van de commando's die naar de externe interface kant gestuurd worden
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export class ChannelService<TUID extends string | number, TFVS, TFC, TFITE extends string> {
  private _sensorChannels: SensorChannel<TUID, TFVS>[] = []
  private _sensorIgnoreList: TUID[]
  private _actuatorChannels: ActuatorChannel<TUID, TFC>[] = []
  private readonly _discoveryConfig: DiscoveryConfig

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) private readonly _interfaceName: string,
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
    @Inject(SENSOR_TYPE_MAPPERS_TOKEN)
    private readonly _sensorTypeMappers: Record<TFITE, SensorTypeMapper<TFVS>>, // @Inject(ACTUATOR_TYPE_MAPPERS_TOKEN) // private readonly _actuatorTypeMappers: Record<CommandTypeEnum, ActuatorTypeMapper<TFC>>,
  ) {
    console.log(`application name injected in ChannelService is '${_interfaceName}'`)
    this._discoveryConfig = new DiscoveryConfig(this._config, this._interfaceName)
  }

  public discoverSensors(discoveredSensor: DiscoveredSensor<TUID, TFITE>[]) {
    this._sensorIgnoreList = discoveredSensor
      .filter(ds => regexTest(ds.name, this._discoveryConfig.sensorIgnore))
      .map(ds => ds.key)
    this._sensorChannels = discoveredSensor
      .filter(ds => !this._sensorIgnoreList.includes(ds.key))
      .map(ds => {
        const typeMapper: SensorTypeMapper<TFVS> = this._sensorTypeMappers[ds.foreignTypeName]
        return {
          uid: ds.key,
          name: ds.name,
          type: typeMapper.measurementType,
          transformer: typeMapper.transformer,
        } as SensorChannel<TUID, TFVS>
      })
    debugger
  }

  public discoverActuators() {}
}
