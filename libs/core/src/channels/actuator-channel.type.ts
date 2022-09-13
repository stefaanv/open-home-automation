import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { ChannelBase } from './channel-base.type'

export type ActuatorChannel<TUID extends number | string, TTrans extends (command: Command) => any> = ChannelBase<
  CommandTypeEnum,
  TUID
> & {
  transformer: TTrans
}
