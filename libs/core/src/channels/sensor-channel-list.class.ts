import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ChannelBase } from './channel-base.type'
import { ChannelListBase } from './channel-list-base.class'
import { SensorChannel } from './sensor-channel.type'

export class SensorChannelList<
  TUID extends string | number,
  TTrans extends (state: any) => any,
> extends ChannelListBase<TUID, SensorChannel<TUID, TTrans>> {}
