import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { UID } from './uid.type'

export class SensorActuatorBase<FTE extends string> {
  public readonly id: UID
  public readonly topic: string
  public readonly foreignType: FTE
  public state?: TimedSensorReadingValue

  constructor(id: UID, topic: string, foreignType: FTE) {
    this.id = id
    this.topic = topic
    this.foreignType = foreignType
  }
}
