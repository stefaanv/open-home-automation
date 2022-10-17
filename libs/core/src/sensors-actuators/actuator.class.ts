import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { SensorActuatorBase } from './sensor-actuator-base.class'
import { UID } from './uid.type'
import { Sensor } from './sensor.class'

export class Actuator<FATE extends string> extends SensorActuatorBase<FATE> {
  public readonly actuatorType: ActuatorTypeEnum
  public readonly sensor?: Sensor<FATE>

  constructor(
    id: UID,
    topic: string,
    foreignType: FATE,
    actuatorType: ActuatorTypeEnum,
    sensor?: Sensor<FATE>,
    foreignConfig: any = undefined,
  ) {
    super(id, topic, foreignType, foreignConfig)
    this.actuatorType = actuatorType
    this.sensor = sensor
  }
}
