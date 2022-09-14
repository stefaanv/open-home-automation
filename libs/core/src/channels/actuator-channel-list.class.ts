import { ActuatorChannel } from './actuator-channel.type'
import { ChannelListBase } from './channel-list-base.class'

export class ActuatorChannelList<
  TUID extends string | number,
  TTrans extends (state: any) => any,
> extends ChannelListBase<TUID, ActuatorChannel<TUID, TTrans>> {}
