import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { ChannelBase } from './channel-base.type'

export type ActuatorChannelTransformer<TOut = any> = (cmd: Command) => TOut

export class ActuatorChannel<TUID extends number | string, TOut = any> extends ChannelBase<
  TUID,
  CommandTypeEnum,
  ActuatorChannelTransformer<TOut>
> {
  constructor(uid: TUID, name: string, type: CommandTypeEnum, transformer: ActuatorChannelTransformer<TOut>) {
    super(uid, name, type, transformer)
  }
}
