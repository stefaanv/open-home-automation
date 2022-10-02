import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { ChannelBase } from './channel-base.class'

export type ActuatorChannelTransformer /*<FTE extends string>*/ = (
  cmd: Command /*, channel: ActuatorChannel<FTE>*/,
) => any

export class ActuatorChannel /*<FTE extends string>*/ extends ChannelBase<ActuatorTypeEnum> {
  constructor(
    uid: string,
    name: string,
    type: ActuatorTypeEnum,
    validator: any, //TODO!
    // private readonly foreignType: FTE,
    transformer: ActuatorChannelTransformer /*<FTE>*/,
  ) {
    super(uid, name, type, transformer)
  }
}
