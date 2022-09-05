import { CommandTypeEnum } from '@core/command-types/command-type.enum'

export class ActuatorConfigBase<T extends string | RegExp, TInstanceDef> {
  ignore: T
  discover: Array<{ filter: T; commandType: CommandTypeEnum | undefined }> | undefined
  define: Array<TInstanceDef> | undefined
}

export class ActuatorConfig<U> extends ActuatorConfigBase<RegExp, U> {
  constructor(config: ActuatorConfigBase<string, U>) {
    super()
    this.ignore = new RegExp(config.ignore)
    this.discover = !config.discover
      ? undefined
      : config.discover.map<{ filter: RegExp; commandType: CommandTypeEnum | undefined }>(d => ({
          filter: new RegExp(d.filter),
          commandType: d.commandType,
        }))
    this.define = config.define
  }
}
