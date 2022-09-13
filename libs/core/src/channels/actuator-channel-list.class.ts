import { ActuatorChannel } from './actuator-channel.type'
import { ChannelListBase } from './channel-list-base.class'

export class ActuatorChannelList<
  TUID extends string | number,
  TTrans extends (state: any) => any,
> extends ChannelListBase<TUID, ActuatorChannel<TUID, TTrans>> {}
/*
{
  private readonly _list: ActuatorChannel<TUID, TTrans>[] = []

  public push(channel: ActuatorChannel<TUID, TTrans>) {
    this._list.push(channel)
  }

  public get(uid: TUID): ActuatorChannel<TUID, TTrans> {
    return this._list.find(e => e.uid === uid)
  }

  public getByName(name: string): ActuatorChannel<TUID, TTrans> {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
*/
