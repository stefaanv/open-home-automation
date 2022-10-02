export interface ChannelConfigRaw<TType, TInstanceDef> {
  ignore: string
  discover: Array<{ filter: string; type: TType | undefined }> | undefined
  define: Array<TInstanceDef> | undefined
}

export interface InstanceDefine<TUID, TType, FTE> {
  uid: TUID
  name: string
  type: TType
  foreignType: FTE
}

export class ChannelConfigBase<TUID, TType extends string, FTE extends string> {
  public ignore: RegExp
  public discover: Array<{ filter: RegExp; type: TType | undefined }> | undefined
  public define: Array<InstanceDefine<TUID, TType, FTE>> | undefined
  constructor(config: ChannelConfigRaw<TType, InstanceDefine<TUID, TType, FTE>>) {
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
