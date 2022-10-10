import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ConfigService } from '@nestjs/config'
import { compile } from 'handlebars'

export type NameTransformerString = { extractor: string; template: string }
export type NameTransformerRegex = { extractor: RegExp; template: HandlebarsTemplateDelegate }

export type DiscoveryConfigString = {
  filter: string
  nameTransformer: NameTransformerString | undefined
  type: MeasurementTypeEnum | ActuatorTypeEnum | undefined
}
export type DiscoveryConfigRegex = {
  filter: RegExp
  nameTransformer: NameTransformerRegex
  type: MeasurementTypeEnum | ActuatorTypeEnum | undefined
}

const defaultNameTransformerRegex = { extractor: new RegExp(/(?<all>.*)/), template: '{{all}}' }

export type SensorDefinitionConfig<FTE extends string> = {
  id: string
  topicInfix: string
  valuetype: MeasurementTypeEnum
  foreignType: FTE
}

export type ActuatorDefinitionConfig<FTE extends string> = {
  uid: string
  name: string
  type: ActuatorTypeEnum
  foreignType: FTE
}

function convertTransformer(value: NameTransformerString) {
  return {
    extractor: new RegExp(value.extractor),
    template: Handlebars.compile(value.template),
  } as NameTransformerRegex
}

export class InterfaceConfig<FTE extends string> {
  readonly sensorIgnore: RegExp
  readonly sensorDiscover: DiscoveryConfigRegex[]
  readonly sensorDefinition: SensorDefinitionConfig<FTE>[]
  readonly actuatorIgnore: RegExp
  readonly actuatorDiscover: DiscoveryConfigRegex[]
  readonly actuatorDefinition: ActuatorDefinitionConfig<FTE>[]

  constructor(config: ConfigService, interfaceName: string) {
    this.sensorIgnore = new RegExp(config.get<string>([interfaceName, 'sensors', 'ignore'].join('.'), ''))
    this.sensorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'sensors', 'discover'].join('.'), [])
      .map(e => ({ filter: new RegExp(e.filter), type: e.type }))
    this.sensorDefinition = config.get<SensorDefinitionConfig<FTE>[]>(
      [interfaceName, 'sensors', 'define'].join('.'),
      [],
    )

    this.actuatorIgnore = new RegExp(config.get<string>([interfaceName, 'actuators', 'ignore'].join('.'), ''))
    this.actuatorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'actuators', 'discover'].join('.'), [])
      .map(e => ({ filter: new RegExp(e.filter), type: e.type }))
    this.actuatorDefinition = config.get<ActuatorDefinitionConfig<FTE>[]>(
      [interfaceName, 'actuators', 'define'].join('.'),
      [],
    )
  }
}
