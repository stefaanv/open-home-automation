import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorActuatorBase } from './sensor-actuator-base.class'

export class NewSensor extends SensorActuatorBase {
  valueType: MeasurementTypeEnum
}
