import { ActuatorChannel } from './actuator-channel.class'
import { SensorChannel } from './sensor-channel.class'

export class ChannelListBase<
  TUID extends string | number,
  TChannel extends SensorChannel<TUID> | ActuatorChannel<TUID>,
> {
  private readonly _list: TChannel[] = []
  private readonly _ignoreList: TUID[] = []

  public add(channel: TChannel) {
    this._list.push(channel)
  }

  public addIgnore(arg: TUID | TUID[]) {
    if (typeof arg === 'object') {
      this._ignoreList.push(...arg)
    } else {
      this._ignoreList.push(arg)
    }
  }

  public get(uid: TUID): TChannel {
    return this._list.find(e => e.uid === uid)
  }

  public toIgnore(uid: TUID): boolean {
    return this._ignoreList.includes(uid)
  }

  public getByName(name: string): TChannel {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
