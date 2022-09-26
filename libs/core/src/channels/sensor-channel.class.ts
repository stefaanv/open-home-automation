import { LoggingService } from '@core/logging.service'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-values'
import { SensorReading } from '@core/sensor-reading.type'
import { ChannelBase } from './channel-base.class'

export type SensorChannelTransformer = (state: any) => SensorReadingValue

export class SensorChannel extends ChannelBase<MeasurementTypeEnum> {
  static log: LoggingService

  constructor(uid: string, name: string, type: MeasurementTypeEnum, transformer: SensorChannelTransformer) {
    super(uid, name, type, transformer)
  }

  transformToSensorReading(state: any, interfaceName: string, time: Date): SensorReading {
    if (!this.transformer) {
      SensorChannel.log.warn(`Transformer not defined for mapper ${this.name}`)
    }
    const value = this.transformer(state, undefined)
    if (typeof value === 'object') {
      delete value.type
    }
    const update = {
      name: this.name,
      origin: interfaceName,
      time,
      type: this.type,
      value,
    }
    console.log(JSON.stringify(update))
    return update
  }
}
