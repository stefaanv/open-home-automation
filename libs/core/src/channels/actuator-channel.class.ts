import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { LoggingService } from '@core/logging.service'
import { ChannelBase } from './channel-base.class'

export type ActuatorChannelTransformer<TOut = any> = (cmd: Command) => TOut

export class ActuatorChannel<TUID extends number | string, TOut = any> extends ChannelBase<
  TUID,
  CommandTypeEnum,
  ActuatorChannelTransformer<TOut>
> {
  static log: LoggingService

  constructor(uid: TUID, name: string, type: CommandTypeEnum, transformer: ActuatorChannelTransformer<TOut>) {
    super(uid, name, type, transformer)
  }
  getCommand(command: Command): TOut {
    return this.transformer(command)
  }
}
