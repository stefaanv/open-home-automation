import { TimedSensorReadingValue } from '@core/sensor-reading-values'

export class SensorActuatorBase {
  public readonly id: string
  public readonly topicInfix: string
  public readonly interfaceSpecificType: string
  public readonly state?: TimedSensorReadingValue
}
