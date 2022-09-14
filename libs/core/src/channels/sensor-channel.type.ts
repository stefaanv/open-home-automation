import { LoggingService } from '@core/logging.service'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'
import { SensorReading } from '@core/sensor-reading.type'
import { ChannelBase } from './channel-base.type'

export type SensorChannelTransformer<TIn = any> = (state: TIn) => SensorReadingValue

export class SensorChannel<TUID extends number | string, TIn = any> extends ChannelBase<
  TUID,
  MeasurementTypeEnum,
  SensorChannelTransformer<TIn>
> {
  constructor(uid: TUID, name: string, type: MeasurementTypeEnum, transformer: SensorChannelTransformer<TIn>) {
    super(uid, name, type, transformer)
  }

  getSensorReading(state: TIn, interfaceName: string, time: Date, log: LoggingService): SensorReading {
    if (!this.transformer) {
      log.warn(`Transformer not defined for mapper ${this.name}`)
    }
    const update = {
      name: this.name,
      origin: interfaceName,
      time,
      type: this.type,
      value: this.transformer(state),
    }
    console.log(JSON.stringify(update))
    return update
  }
}
