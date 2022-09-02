import { MeasurementType } from "@core/measurement-types/measurement-type.type"

export class DiscoverySensorConfigBase<T extends string | RegExp>{
  ignoreFilter: T
  discover: Array<{ filter: T, measurementType: MeasurementType | undefined }>
  define: Array<{ filter: T, measurementType: MeasurementType }>
}

export class DiscoverySensorConfig extends DiscoverySensorConfigBase<RegExp>{
  constructor(config: DiscoverySensorConfigBase<string>) {
    super()
    this.ignoreFilter = new RegExp(config.ignoreFilter)
    this.discover = config.discover.map<{ filter: RegExp, measurementType: MeasurementType | undefined }>
      (d => ({ filter: new RegExp(d.filter), measurementType: d.measurementType }))
    this.define = config.define.map<{ filter: RegExp, measurementType: MeasurementType }>
      (d => ({ filter: new RegExp(d.filter), measurementType: d.measurementType }))
  }
}