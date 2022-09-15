import { ChannelListBase } from './channel-list-base.class'
import { SensorChannel } from './sensor-channel.class'

export class SensorChannelList<TUID extends string | number, TIn> extends ChannelListBase<
  TUID,
  SensorChannel<TUID, TIn>
> {}
