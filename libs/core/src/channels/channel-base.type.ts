import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

export type ChannelBase<E extends MeasurementTypeEnum | CommandTypeEnum, TUID extends number | string> = {
  uid: TUID
  name: string
  type: E
}
