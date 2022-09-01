export type SensorReadingValueBaseType = object | string | number | boolean | null
export type ValueFormatter = (value: SensorReadingValueBaseType, unit: string) => string

export class SensorReadingMqttDataTypeSettings<TTypeIndicator> {
  constructor(
    readonly type: TTypeIndicator,
    readonly unit: string,
    readonly formatter: undefined | number | ValueFormatter,
  ) {}
} 

export abstract class SensorReadingMqttData_base_class<TValue extends SensorReadingValueBaseType, TTypeIndicator> {
  origin: string
  time: Date
  name: string
  formattedValue: string
  value: TValue
  typeSettings: SensorReadingMqttDataTypeSettings<TTypeIndicator>

  constructor(value: TValue, name: string, origin: string, time: Date = new Date()) {
    this.value = value
    this.name = name
    this.time = time
    this.origin = origin
    this.typeSettings
  }

  toString() {
    const formatter = this.typeSettings.formatter
    let formattedValue = ''
    switch (typeof formatter) {
      case 'undefined': // no formatter defined for string type values
        formattedValue = this.value as string
        break
      case 'number':
        formattedValue = `${(formatter as number).toFixed(formatter)} ${this.typeSettings.unit}`
        break
      case 'function':
        formattedValue = formatter(this.value, this.typeSettings.unit)
    }
    const { typeSettings, ...data } = {
      type: this.typeSettings.type,
      ...this,
      unit: this.typeSettings.unit,
      formattedValue,
    }

    return JSON.stringify(data)
  }
}
