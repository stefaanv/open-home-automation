import { ActuatorBaseClass } from './actuator-config.class'

export class SensorList<TUID extends number | string, TConfig> {
  private readonly _list: SensorBaseClass<TUID, TConfig>[] = []

  public push(args: SensorBaseClass<TUID, TConfig> | Array<SensorBaseClass<TUID, TConfig>>) {
    const array: SensorBaseClass<TUID, TConfig>[] = args.hasOwnProperty('name')
      ? [args as SensorBaseClass<TUID, TConfig>]
      : (args as SensorBaseClass<TUID, TConfig>[])
    array.forEach(element => {
      this._list.push(element)
    })
  }

  public get(uid: TUID): SensorBaseClass<TUID, TConfig> | undefined {
    return this._list.find(e => e.uid === uid)
  }

  public getAll(): SensorBaseClass<TUID, TConfig>[] {
    return this._list
  }
}
