import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { LoggingService } from '@core/logging.service'
import { ChannelBase } from './channel-base.class'

export type ActuatorChannelTransformer = (cmd: Command) => unknown

export class ActuatorChannel<TUID extends number | string> extends ChannelBase<TUID, CommandTypeEnum> {
  static log: LoggingService

  constructor(uid: TUID, name: string, type: CommandTypeEnum, transformer: ActuatorChannelTransformer) {
    super(uid, name, type, transformer)
  }
  transformToForeignCommand(command: Command): any {
    return this.transformer(command)
  }
}
