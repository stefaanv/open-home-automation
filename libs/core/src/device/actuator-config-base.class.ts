import { DeviceBase } from "./device-base.class"

export class DeviceList<TUID extends number | string, T> {
  private readonly _list: DeviceBase<TUID, T>[] = []

  public push(args: DeviceBase<TUID, T> | Array<DeviceBase<TUID, T>>) {
    const array: DeviceBase<TUID, T>[] = args.hasOwnProperty('name') ? [args as DeviceBase<TUID, T>] : (args as DeviceBase<TUID, T>[])
    array.forEach(element => {
      this._list.push(element)
    })
  }

  public get(uid: TUID): DeviceBase<TUID, T> | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): DeviceBase<TUID, T>[] {
    return this._list
  }
}
