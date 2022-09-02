import { CommandType } from "@core/command-types/actuator-command.type"
import { MeasurementType } from "@core/measurement-types/measurement-type.type"

export class SensorConfigBase<T extends string | RegExp>{
  ignore: T
  discover: Array<{ filter: T, measurementType: MeasurementType | undefined }> | undefined
  define: Array<{ filter: T, measurementType: MeasurementType }> | undefined
}

export class SensorConfig extends SensorConfigBase<RegExp>{
  constructor(config: SensorConfigBase<string>) {
    super()
    this.ignore = new RegExp(config.ignore)
    this.discover = !config.discover ? undefined : config.discover.map<{ filter: RegExp, measurementType: MeasurementType | undefined }>
      (d => ({ filter: new RegExp(d.filter), measurementType: d.measurementType }))
    this.define = !config.define ? undefined : config.define.map<{ filter: RegExp, measurementType: MeasurementType }>
      (d => ({ filter: new RegExp(d.filter), measurementType: d.measurementType }))
  }
}

export class ActuatorConfigBase<T extends string | RegExp>{
  ignore: T
  discover: Array<{ filter: T, commandType: CommandType | undefined }>
  define: Array<{ filter: T, commandType: CommandType }>
}

export class ActuatorConfig extends ActuatorConfigBase<RegExp>{
  constructor(config: ActuatorConfigBase<string>) {
    super()
    this.ignore = new RegExp(config.ignore)
    this.discover = !config.discover ? undefined : config.discover.map<{ filter: RegExp, commandType: CommandType | undefined }>
      (d => ({ filter: new RegExp(d.filter), commandType: d.commandType }))
    this.define = !config.define ? undefined : config.define.map<{ filter: RegExp, commandType: CommandType }>
      (d => ({ filter: new RegExp(d.filter), commandType: d.commandType }))
  }
}