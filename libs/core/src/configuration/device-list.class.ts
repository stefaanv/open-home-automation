import { Actuator, DeviceBase } from './device-base.class'

export class DeviceList<T extends Sensor | Actuator> {
  private readonly _list: DeviceBase<TOutType, TConfig, TTransformerTarget>[] = []

  public push(
    uid: string,
    name: string,
    type: TOutType,
    discoveredConfig: TConfig,
    transformer: (state: any) => TTransformerTarget,
  ) {
    this._list.push(new DeviceBase(uid, name, type, discoveredConfig, transformer))
  }

  public getConfig(uid: string) {
    return this._list.find(e => e.uid === uid)?.config
  }

  public getConfigByName(name: string) {
    return this._list.find(e => e.name === name)?.config
  }

  public get allConfig() {
    return this._list.map<TConfig>(i => i.config)
  }

  public get all() {
    return this._list
  }
}
