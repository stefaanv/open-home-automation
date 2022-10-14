import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ConfigService } from '@nestjs/config'
import { compile } from 'handlebars'
import { IsNotEmpty, IsString, validate } from 'class-validator'
import { LoggingService } from '@core/logging.service'
import { regexTest } from '@core/helpers/helpers'
import { ActuatorTypeMapper, SensorTypeMapper } from './types'

export class DiscoveryConfigString {
  @IsNotEmpty()
  @IsString()
  filter!: string

  @IsNotEmpty()
  @IsString()
  template!: string

  type: MeasurementTypeEnum | ActuatorTypeEnum | undefined
}
export type DiscoveryConfigRegex = {
  filter: RegExp
  template: HandlebarsTemplateDelegate
  type: MeasurementTypeEnum | ActuatorTypeEnum | undefined
}

export type SensorDefinitionConfig<FTE extends string> = {
  uid: string
  topic: string
  type: MeasurementTypeEnum
  foreignType: FTE
}

export type ActuatorDefinitionConfig<FTE extends string> = {
  uid: string
  topic: string
  type: ActuatorTypeEnum
  foreignType: FTE
}

async function validateOrLog(discoveryConfigElement: DiscoveryConfigString, logger: LoggingService) {
  const errors = await validate(discoveryConfigElement)
  if (errors.length / 0) {
    const msg = `${JSON.stringify(discoveryConfigElement)} is not an valid discovery configuration element : ${errors
      .map(toString)
      .join('; ')}`
    logger.warn(msg)
  }
  if (!discoveryConfigElement.template) {
    const msg = `${discoveryConfigElement.template} is not an valid handlebars template`
    logger.warn(msg)
  }
  return true
}

export class InterfaceConfig<FTE extends string, FATE extends FTE> {
  readonly sensorTypeIndicatorList: SensorTypeMapper<FTE> | undefined
  readonly sensorIgnore: RegExp
  readonly sensorDiscover: DiscoveryConfigRegex[]
  readonly sensorDefinition: SensorDefinitionConfig<FTE>[]
  readonly actuatorTypeIndicatorList: ActuatorTypeMapper<FATE> | undefined
  readonly actuatorIgnore: RegExp
  readonly actuatorDiscover: DiscoveryConfigRegex[]
  readonly actuatorDefinition: ActuatorDefinitionConfig<FATE>[]

  constructor(config: ConfigService, interfaceName: string, private readonly _log: LoggingService) {
    this.sensorTypeIndicatorList = config.get<Record<FTE, MeasurementTypeEnum>>(
      [interfaceName, 'sensors', 'typeIndicatorList'].join('.'),
    )
    this.sensorIgnore = new RegExp(config.get<string>([interfaceName, 'sensors', 'ignore'].join('.'), ''))
    this.sensorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'sensors', 'discover'].join('.'), [])
      .filter(async e => await validateOrLog(e, this._log))
      .map(e => ({ filter: new RegExp(e.filter), template: compile(e.template), type: e.type }))
    this.sensorDefinition = config.get<SensorDefinitionConfig<FTE>[]>(
      [interfaceName, 'sensors', 'define'].join('.'),
      [],
    )

    this.actuatorTypeIndicatorList = config.get<Record<FTE, ActuatorTypeEnum>>(
      [interfaceName, 'actuators', 'typeIndicatorList'].join('.'),
    )
    this.actuatorIgnore = new RegExp(config.get<string>([interfaceName, 'actuators', 'ignore'].join('.'), ''))
    this.actuatorDiscover = config
      .get<DiscoveryConfigString[]>([interfaceName, 'actuators', 'discover'].join('.'), [])
      .map(e => ({ filter: new RegExp(e.filter), template: compile(e.template), type: e.type }))
    this.actuatorDefinition = config.get<ActuatorDefinitionConfig<FATE>[]>(
      [interfaceName, 'actuators', 'define'].join('.'),
      [],
    )
  }

  findDiscoveryConfig(name: string, type: 'sensor' | 'actuator') {
    const discoverConfig: DiscoveryConfigRegex[] = type === 'sensor' ? this.sensorDiscover : this.actuatorDiscover
    const matchingFilter = discoverConfig.find(f => regexTest(name, f.filter))
    if (!matchingFilter) {
      const msg =
        `this is no matching filter for ${type} ${name} and the name does not match the ignore filter` +
        ` this is probably not what you intended, please update the configuration`
      this._log.warn(msg)
      return undefined
    }
    return matchingFilter
  }
}
