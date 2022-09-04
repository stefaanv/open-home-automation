import { SensorReadingValueBaseType } from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'
import { DeviceBase } from './device-base.class'

export class DeviceList<TUID extends number | string, TConfig, TValueTypeIndicator extends string> {
  private readonly _list: DeviceBase<TUID, TConfig, TValueTypeIndicator>[] = []

  public push(
    args: DeviceBase<TUID, TConfig, TValueTypeIndicator> | Array<DeviceBase<TUID, TConfig, TValueTypeIndicator>>,
  ) {
    const array: DeviceBase<TUID, TConfig, TValueTypeIndicator>[] = args.hasOwnProperty('name')
      ? [args as DeviceBase<TUID, TConfig, TValueTypeIndicator>]
      : (args as DeviceBase<TUID, TConfig, TValueTypeIndicator>[])
    array.forEach(element => {
      this._list.push(element)
    })
  }

  public get(uid: TUID): DeviceBase<TUID, TConfig, TValueTypeIndicator> | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): DeviceBase<TUID, TConfig, TValueTypeIndicator>[] {
    return this._list
  }
}
