import { ActuatorCommandBaseClass } from './actuator-command.type'

export abstract class ActuatorBaseClass<TUID extends number | string, TConfig> {
  constructor(
    readonly uid: TUID,
    readonly name: string,
    readonly config: TConfig,
    readonly parser: (mqttData: any) => ActuatorCommandBaseClass,
  ) {}
  public parse(mqttData: any) {}
}
