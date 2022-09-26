import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { ChannelBase } from './channel-base.class'

export type ActuatorChannelTransformer /*<FATE extends string>*/ = (
  cmd: Command /*, channel: ActuatorChannel<FATE>*/,
) => any

export class ActuatorChannel /*<FATE extends string>*/ extends ChannelBase<ActuatorTypeEnum> {
  constructor(
    uid: string,
    name: string,
    type: ActuatorTypeEnum,
    validator: any, //TODO!
    // private readonly foreignType: FATE,
    transformer: ActuatorChannelTransformer /*<FATE>*/,
  ) {
    super(uid, name, type, transformer)
  }
}
