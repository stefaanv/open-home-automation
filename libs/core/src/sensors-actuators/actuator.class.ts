import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { SensorActuatorBase } from './sensor-actuator-base.class'
import { UID } from './uid.type'

export class Actuator<FATE extends string> extends SensorActuatorBase<FATE> {
  public readonly actuatorType: ActuatorTypeEnum

  constructor(
    id: UID,
    topic: string,
    foreignType: FATE,
    actuatorType: ActuatorTypeEnum,
    foreignConfig: any = undefined,
  ) {
    super(id, topic, foreignType, foreignConfig)
    this.actuatorType = actuatorType
  }
}
