import { SensorBaseClass } from './sensor-base.class'

export class DeviceList<TUID extends number | string, TConfig extends { uid: TUID; name: string }> {
  private readonly _list: TConfig[] = []

  public push(args: TConfig | TConfig[]) {
    const array: TConfig[] = args.hasOwnProperty('name') ? [args as TConfig] : (args as TConfig[])
    array.forEach(e => this._list.push(e))
  }

  public get(uid: TUID): TConfig | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): TConfig[] {
    return this._list
  }
}
