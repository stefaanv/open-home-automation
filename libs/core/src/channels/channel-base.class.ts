import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

//TODO: channel verantwoorelijk maken voor het maken van de measurement en de (externe) command
export class ChannelBase<
  TUID extends number | string,
  E extends MeasurementTypeEnum | CommandTypeEnum,
  TTrans extends (x: any) => any,
> {
  constructor(
    public readonly uid: TUID,
    public readonly name: string,
    public readonly type: E,
    public readonly transformer: TTrans,
  ) {}
}
