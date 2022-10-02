import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { SensorActuatorBase } from './sensor-actuator-base.class'

export class NewSensor<TUID, FTE extends string> extends SensorActuatorBase<TUID, FTE> {
  measurementType: MeasurementTypeEnum

  constructor(
    id: TUID,
    topic: string,
    foreignValueType: FTE,
    measurementType: MeasurementTypeEnum,
    state?: TimedSensorReadingValue,
  ) {
    super(id, topic, foreignValueType)
    this.measurementType = measurementType
    this.state = state
  }
  /*
  uit parent class `SensorActuatorBase<TUID>`
  public readonly id: TUID
  public readonly topicInfix: string
  public readonly interfaceSpecificType: FTE
  public state?: TimedSensorReadingValue
  */
}
