export interface ChannelConfigRaw<TType, TInstanceDef> {
  ignore: string
  discover: Array<{ filter: string; type: TType | undefined }> | undefined
  define: Array<TInstanceDef> | undefined
}

export interface InstanceDefine<TType, FSTE> {
  uid: string
  name: string
  type: TType
  foreignType: FSTE
}

export class ChannelConfig<TType extends string, FSTE extends string> {
  public ignore: RegExp
  public discover: Array<{ filter: RegExp; type: TType | undefined }> | undefined
  public define: Array<InstanceDefine<TType, FSTE>> | undefined
  constructor(config: ChannelConfigRaw<TType, InstanceDefine<TType, FSTE>>) {
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
