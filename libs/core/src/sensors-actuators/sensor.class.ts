import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { SensorActuatorBase } from './sensor-actuator-base.class'
import { UID } from './uid.type'

export class Sensor<FTE extends string> extends SensorActuatorBase<FTE> {
  measurementType: MeasurementTypeEnum
  public state: TimedSensorReadingValue | undefined

  constructor(
    id: UID,
    topic: string,
    foreignValueType: FTE,
    measurementType: MeasurementTypeEnum,
    state: TimedSensorReadingValue | undefined = undefined,
    foreignConfig: any = undefined,
  ) {
    super(id, topic, foreignValueType, foreignConfig)
    this.measurementType = measurementType
    this.state = state
  }
}
