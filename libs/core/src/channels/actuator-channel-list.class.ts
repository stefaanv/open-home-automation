import { ActuatorChannel } from './actuator-channel.class'
import { ChannelListBase } from './channel-list-base.class'

export class ActuatorChannelList<TUID extends string | number> extends ChannelListBase<TUID, ActuatorChannel<TUID>> {}
