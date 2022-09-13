import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'
import { ChannelBase } from './channel-base.type'

export type SensorChannel<
  TUID extends number | string,
  TTrans extends (state: any) => SensorReadingValue,
> = ChannelBase<MeasurementTypeEnum, TUID> & {
  transformer: TTrans
}
