import { TimedSensorReadingValue } from '@core/sensor-reading-values'
import { UID } from './uid.type'

export class SensorActuatorBase<FTE extends string> {
  public readonly id: UID
  public readonly topic: string
  public readonly foreignType: FTE
  public foreignConfig?: any | undefined

  constructor(id: UID, topic: string, foreignType: FTE, foreignConfig: any = undefined) {
    this.id = id
    this.topic = topic
    this.foreignType = foreignType
    this.foreignConfig = foreignConfig
  }
}
