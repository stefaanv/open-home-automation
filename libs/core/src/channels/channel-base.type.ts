import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

//TODO: channel verantwoorelijk maken voor het maken van de measurement en de (externe) command
export type ChannelBase<E extends MeasurementTypeEnum | CommandTypeEnum, TUID extends number | string> = {
  uid: TUID
  name: string
  type: E
}
