import { SensorReadingValueBaseType } from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'
import { DeviceBase } from './device-base.class'

export class DeviceList<
  TUID extends number | string,
  TConfig,
  TState,
  TValue extends SensorReadingValueBaseType,
  TValueTypeIndicator extends string,
> {
  private readonly _list: DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>[] = []

  public push(
    args:
      | DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>
      | Array<DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>>,
  ) {
    const array: DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>[] = args.hasOwnProperty('name')
      ? [args as DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>]
      : (args as DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>[])
    array.forEach(element => {
      this._list.push(element)
    })
  }

  public get(uid: TUID): DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator> | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): DeviceBase<TUID, TConfig, TValue, TValueTypeIndicator>[] {
    return this._list
  }
}
