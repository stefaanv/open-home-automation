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
  private readonly list: Record<TUID, DeviceBase<TUID>> = {}
  public push(args: DeviceBase<TUID> | Array<DeviceBase<TUID>>) {
    const array: Array<DeviceBase<TUID>> = args.hasOwnProperty('name') ? [args] : args
    array.forEach(element => {
      this.list[element.uid] = element
    })
  }
}
