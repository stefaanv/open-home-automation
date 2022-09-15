import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ConfigService } from '@nestjs/config'

export type SensorDiscoveryConfigString = { filter: string; type: MeasurementTypeEnum | undefined }
export type SensorDiscoveryConfigRegex = { filter: RegExp; type: MeasurementTypeEnum | undefined }

export class DiscoveryConfig {
  readonly sensorIgnore: RegExp
  readonly sensorDiscover: SensorDiscoveryConfigRegex[]

  constructor(config: ConfigService, interfaceName: string) {
    this.sensorIgnore = new RegExp(config.get<string>([interfaceName, 'sensors', 'ignore'].join('.')))
    this.sensorDiscover = config
      .get<SensorDiscoveryConfigString[]>([interfaceName, 'sensors', 'discover'].join('.'))
      .map(e => ({ filter: new RegExp(e.filter), type: e.type }))
  }
}
