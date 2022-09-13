import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ChannelBase } from './channel-base.type'

export class ChannelListBase<
  TUID extends string | number,
  T extends ChannelBase<MeasurementTypeEnum | CommandTypeEnum, TUID>,
> {
  private readonly _list: T[] = []

  public push(channel: T) {
    this._list.push(channel)
  }

  public get(uid: TUID): T {
    return this._list.find(e => e.uid === uid)
  }

  public getByName(name: string): T {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
