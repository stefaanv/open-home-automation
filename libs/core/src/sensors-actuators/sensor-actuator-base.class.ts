import { TimedSensorReadingValue } from '@core/sensor-reading-values'

export class SensorActuatorBase<TUID, FTE extends string> {
  public readonly id: TUID
  public readonly topic: string
  public readonly foreignType: FTE
  public state?: TimedSensorReadingValue

  constructor(id: TUID, topic: string, foreignType: FTE) {
    this.id = id
    this.topic = topic
    this.foreignType = foreignType
  }
}
