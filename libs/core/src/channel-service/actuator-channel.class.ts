import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { ActuatorChannelTransformer } from './channel.service'

export class ActuatorChannel<TUID extends number | string, TFC> {
  constructor(public readonly uid: TUID, public readonly type: CommandTypeEnum) {}

  // //TODO foutafhandeling en logging
  // //TODO te moven naar de Service
  // transformToForeignCommand(command: Command): any {
  //   return this.transformer(command)
  // }
}
