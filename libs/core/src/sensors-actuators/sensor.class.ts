import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { SensorActuatorBase } from './sensor-actuator-base.class'
import { UID } from './uid.type'

export class Sensor<FTE extends string> extends SensorActuatorBase<FTE> {
  measurementType: MeasurementTypeEnum

  constructor(
    id: UID,
    topic: string,
    foreignValueType: FTE,
    measurementType: MeasurementTypeEnum,
    state?: TimedSensorReadingValue,
  ) {
    super(id, topic, foreignValueType)
    this.measurementType = measurementType
    this.state = state
  }
}
