export class DeviceBase<TUID extends number | string, TConfig> {
  constructor(readonly uid: TUID, readonly name: string, readonly config: TConfig) {}
}

export class Sensor<TConfig, TTransformerTarget> extends DeviceBase<TConfig> {
  public readonly transformer: (state: any) => TTransformerTarget
  constructor(uid: string, name: string, config: TConfig, transformer: (state: any) => TTransformerTarget) {
    super(uid, name, config)
    this.transformer = transformer
  }
}

export class Actuator<TConfig, TTransformerSource> extends DeviceBase<TConfig> {
  public readonly transformer: (state: any) => TTransformerSource
  constructor(uid: string, name: string, config: TConfig, transformer: (state: any) => TTransformerSource) {
    super(uid, name, config)
    this.transformer = transformer
  }
}
