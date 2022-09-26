import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ConfigService } from '@nestjs/config'

export type DiscoveryConfigString = { filter: string; type: MeasurementTypeEnum | ActuatorTypeEnum | undefined }
export type DiscoveryConfigRegex = { filter: RegExp; type: MeasurementTypeEnum | ActuatorTypeEnum | undefined }

export type SensorDefinitionConfig<FSTE extends string> = {
  uid: string
  name: string
  type: MeasurementTypeEnum
  foreignType: FSTE
}

export type ActuatorDefinitionConfig<FATE extends string> = {
  uid: string
  name: string
  type: ActuatorTypeEnum
  foreignType: FATE
}

export class InterfaceConfig<FSTE extends string, FATE extends string> {
  readonly sensorIgnore: RegExp
  readonly sensorDiscover: DiscoveryConfigRegex[]
  readonly sensorDefinition: SensorDefinitionConfig<FSTE>[]
  readonly actuatorIgnore: RegExp
  readonly actuatorDiscover: DiscoveryConfigRegex[]
  readonly actuatorDefinition: ActuatorDefinitionConfig<FATE>[]

  constructor(config: ConfigService, interfaceName: string) {
    this.sensorIgnore = new RegExp(config.get<string>([interfaceName, 'sensors', 'ignore'].join('.')))
    this.sensorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'sensors', 'discover'].join('.'))
      .map(e => ({ filter: new RegExp(e.filter), type: e.type }))
    this.sensorDefinition = config.get<SensorDefinitionConfig<FSTE>[]>([interfaceName, 'sensors', 'define'].join('.'))

    this.actuatorIgnore = new RegExp(config.get<string>([interfaceName, 'actuators', 'ignore'].join('.')))
    this.actuatorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'actuators', 'discover'].join('.'))
      .map(e => ({ filter: new RegExp(e.filter), type: e.type }))
    this.actuatorDefinition = config.get<ActuatorDefinitionConfig<FATE>[]>(
      [interfaceName, 'actuators', 'define'].join('.'),
    )
  }
}
