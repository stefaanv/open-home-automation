import { MeasurementTypeEnum } from '@core/measurement-type.enum'

export class SensorConfigBase<T extends string | RegExp, TInstanceDef> {
  ignore: T
  discover: Array<{ filter: T; measurementType: MeasurementTypeEnum | undefined }> | undefined
  define: Array<TInstanceDef> | undefined
}

export class SensorConfig<U> extends SensorConfigBase<RegExp, U> {
  constructor(config: SensorConfigBase<string, U>) {
    super()
    this.ignore = new RegExp(config.ignore)
    this.discover = !config.discover
      ? undefined
      : config.discover.map<{ filter: RegExp; measurementType: MeasurementTypeEnum | undefined }>(d => ({
          filter: new RegExp(d.filter),
          measurementType: d.measurementType,
        }))
    this.define = config.define
  }
}
