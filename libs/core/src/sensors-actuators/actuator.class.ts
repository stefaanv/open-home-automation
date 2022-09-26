import { SensorActuatorBase } from './sensor-actuator-base.class'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'

export class NewActuator extends SensorActuatorBase {
  commandType: ActuatorTypeEnum
}
