import { ActuatorChannel } from './actuator-channel.type'
import { SensorChannel } from './sensor-channel.type'

export class ChannelListBase<
  TUID extends string | number,
  TChannel extends SensorChannel<TUID> | ActuatorChannel<TUID>,
> {
  private readonly _list: TChannel[] = []

  public push(channel: TChannel) {
    this._list.push(channel)
  }

  public get(uid: TUID): TChannel {
    return this._list.find(e => e.uid === uid)
  }

  public getByName(name: string): TChannel {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
