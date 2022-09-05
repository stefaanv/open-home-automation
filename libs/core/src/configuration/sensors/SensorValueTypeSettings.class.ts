import { MeasurementTypeEnum } from '@core/measurement-types/measurement-type.enum'
import { ValueFormatter } from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'

export class SensorValueTypeSettings {
  constructor(
    readonly valueType: MeasurementTypeEnum,
    readonly unit: string,
    readonly formatter: undefined | number | ValueFormatter,
  ) {}
}
