export class DeviceBase<TUID extends number | string, TConfig> {
  constructor(readonly uid: TUID, readonly name: string, readonly config: TConfig) {}
}

export class Sensor<TUID extends number | string, TConfig, TTransformerTarget> extends DeviceBase<TUID, TConfig> {
  public readonly transformer: (state: any) => TTransformerTarget
  constructor(uid: TUID, name: string, config: TConfig, transformer: (state: any) => TTransformerTarget) {
    super(uid, name, config)
    this.transformer = transformer
  }
}

export class Actuator<TUID extends number | string, TConfig, TTransformerSource> extends DeviceBase<TUID, TConfig> {
  public readonly transformer: (state: any) => TTransformerSource
  constructor(uid: TUID, name: string, config: TConfig, transformer: (state: any) => TTransformerSource) {
    super(uid, name, config)
    this.transformer = transformer
  }
}
