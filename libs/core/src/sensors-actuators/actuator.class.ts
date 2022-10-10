import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { Sensor } from './sensor.class'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { UID } from './uid.type'

export class Actuator<FTE extends string> extends Sensor<FTE> {
  public readonly actuatorType: ActuatorTypeEnum

  constructor(
    id: UID,
    topic: string,
    foreignType: FTE,
    measurementType: MeasurementTypeEnum,
    actuatorType: ActuatorTypeEnum,
    state?: TimedSensorReadingValue,
  ) {
    super(id, topic, foreignType, measurementType, state)
    this.actuatorType = actuatorType
  }
}
