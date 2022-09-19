import { Command } from '@core/commands/command.type'
import { LoggingService } from '@core/logging.service'
import { ActuatorChannel } from './actuator-channel.class'
import { ChannelListBase } from './channel-list-base.class'

export class ActuatorChannelList extends ChannelListBase<ActuatorChannel> {
  static log: LoggingService

  public add(channel: ActuatorChannel) {
    super.add(channel)
  }

  public toForeign(name: string, command: Command): [ActuatorChannel, any] {
    const channel = this.getByName(name)
    if (channel) {
      return [channel, channel.transformToForeignCommand(command)]
    } else {
      const msg = `command for unknown actuator ${channel.uid} : ${JSON.stringify(command)}`
      ActuatorChannelList.log.warn(msg)
      return undefined
    }
  }
}
