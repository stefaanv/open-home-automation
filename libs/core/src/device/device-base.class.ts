import { SensorValueTypeSettings } from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'

/** specifieke sensor of actuator */
export class DeviceBase<TUID extends number | string> {
  readonly uid: TUID
  readonly type: 'sensor' | 'actuator'
  readonly name: string
}

export class SensorBase<TUID extends number | string, TValueTypeIndicator extends string> extends DeviceBase<TUID> {
  type: 'sensor' = 'sensor'
  constructor(readonly valueTypeSettings: SensorValueTypeSettings<TValueTypeIndicator>) {
    super()
  }
}

export class ActuatorBase<TUID extends number | string> {
  type: 'actuator' = 'actuator'
}

export class DeviceList<TUID extends number | string> {
  private readonly _list: DeviceBase<TUID>[] = []

  public push(args: DeviceBase<TUID> | Array<DeviceBase<TUID>>) {
    const array: DeviceBase<TUID>[] = args.hasOwnProperty('name') ? [args as DeviceBase<TUID>] : (args as DeviceBase<TUID>[])
    array.forEach(element => {
      this._list.push(element)
    })
  }

  public get(uid: TUID): DeviceBase<TUID> | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): DeviceBase<TUID>[] {
    return this._list
  }
}
