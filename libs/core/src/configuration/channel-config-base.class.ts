export class ChannelConfigBase<T extends string | RegExp, TType, TInstanceDef> {
  ignore: T
  discover: Array<{ filter: T; type: TType | undefined }> | undefined
  define: Array<TInstanceDef> | undefined
}

export class ChannelConfig<TType, TInstanceDef> extends ChannelConfigBase<RegExp, TType, TInstanceDef> {
  constructor(config: ChannelConfigBase<string, TType, TInstanceDef>) {
    super()
    this.ignore = new RegExp(config.ignore)
    this.discover = !config.discover
      ? undefined
      : config.discover.map<{ filter: RegExp; type: TType | undefined }>(d => ({
          filter: new RegExp(d.filter),
          type: d.type,
        }))
    this.define = config.define
  }
}
