import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ChannelBase } from './channel-base.type'
import { ChannelListBase } from './channel-list-base.class'
import { SensorChannel } from './sensor-channel.type'

export class SensorChannelList<
  TUID extends string | number,
  TTrans extends (state: any) => any,
> extends ChannelListBase<TUID, SensorChannel<TUID, TTrans>> {}
/*
    private readonly _list: SensorChannel<TUID, TTrans>[] = []

  public push(channel: SensorChannel<TUID, TTrans>) {
    this._list.push(channel)
  }

  public get(uid: TUID): SensorChannel<TUID, TTrans> {
    return this._list.find(e => e.uid === uid)
  }

  public getByName(name: string): SensorChannel<TUID, TTrans> {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
*/
