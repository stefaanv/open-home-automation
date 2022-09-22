import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { LoggingService } from '@core/logging.service'
import { ChannelBase } from './channel-base.class'

export type ActuatorChannelTransformer = (cmd: Command, channel: ActuatorChannel) => any

export class ActuatorChannel<TFC = any> extends ChannelBase<CommandTypeEnum> {
  static log: LoggingService

  constructor(uid: string, name: string, type: CommandTypeEnum, transformer: ActuatorChannelTransformer) {
    super(uid, name, type, transformer)
  }

  //TODO foutafhandeling en logging
  transformToForeignCommand(command: Command): any {
    return this.transformer(command, this)
  }
}
