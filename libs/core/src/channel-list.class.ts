import { CommandType as Command } from '@core/command-types/actuator-command.type'
import { CommandTypeEnum } from '@core/command-types/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

export type Channel<
  TUID extends number | string,
  TType extends MeasurementTypeEnum | CommandTypeEnum,
  TTransformerTarget extends SensorReadingValue | Command,
> = {
  uid: TUID
  name: string
  type: TType
  discoveredConfig: any
  transformer: (state: any) => TTransformerTarget
}

export class ChannelList<TUID extends string | number, T extends { uid: TUID; name: string }> {
  private readonly _list: T[] = []

  public push(channel: T) {
    this._list.push(channel)
  }

  public get(uid: TUID) {
    return this._list.find(e => e.uid === uid)
  }

  public getConfigByName(name: string) {
    return this._list.find(e => e.name === name)
  }

  public get all() {
    return this._list
  }
}
