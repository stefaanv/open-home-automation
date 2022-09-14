import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'
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
}
