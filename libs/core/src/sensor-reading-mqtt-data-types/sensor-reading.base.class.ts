import { MeasurementType } from '@core/measurement-types/measurement-type.type'
import { SensorReading } from '@core/sensor-reading.type'

export type SensorReadingValueBaseType = object | string | number | boolean | null
export type ValueFormatter = (value: SensorReadingValueBaseType, unit: string) => string

export class SensorValueTypeSettings {
  constructor(
    readonly valueType: MeasurementType,
    readonly unit: string,
    readonly formatter: undefined | number | ValueFormatter,
  ) {}
}

export class SensorReadingMqttData_base_class<TValueTypeIndicator extends string> {
  type: TValueTypeIndicator
  origin: string
  time: Date
  name: string
  formattedValue: string
  value: SensorReadingValueBaseType
  valueTypeSettings: SensorValueTypeSettings

  constructor(type: TValueTypeIndicator, name: string, origin: string, valueTypeSettings: SensorValueTypeSettings) {
    this.type = type
    this.name = name
    this.origin = origin
    this.valueTypeSettings = valueTypeSettings
  }

  update(value: SensorReadingValueBaseType, time = new Date()) {
    this.value = value
    this.time = time
  }

  toString() {
    const formatter = this.valueTypeSettings.formatter
    let formattedValue = ''
    try {
      switch (typeof formatter) {
        case 'undefined': // no formatter defined for string type values
          formattedValue = this.value as string
          break
        case 'number':
          formattedValue = `${(this.value as number).toFixed(formatter)} ${this.valueTypeSettings.unit}`
          break
        case 'function':
          formattedValue = formatter(this.value, this.valueTypeSettings.unit)
      }
    } catch (error) {
      console.error(error)
    }
    const { valueTypeSettings: typeSettings, ...data } = {
      type: this.valueTypeSettings.valueType,
      ...this,
      unit: this.valueTypeSettings.unit,
      formattedValue,
    }

    return JSON.stringify(data)
  }

  get sensorReading(): SensorReading<SensorReadingValueBaseType> {
    return { ...this, unit: this.valueTypeSettings.unit, type: this.type as MeasurementType }
  }
}
