import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { NewSensor } from './sensor.class'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

export class NewActuator<TUID, FTE extends string> extends NewSensor<TUID, FTE> {
  public readonly commandType: ActuatorTypeEnum

  constructor(
    id: TUID,
    topic: string,
    foreignType: FTE,
    measurementType: MeasurementTypeEnum,
    commandType: ActuatorTypeEnum,
    state?: TimedSensorReadingValue,
  ) {
    super(id, topic, foreignType, measurementType, state)
    this.commandType = commandType
  }
}
