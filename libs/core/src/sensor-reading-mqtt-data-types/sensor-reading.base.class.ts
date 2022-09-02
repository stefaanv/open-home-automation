export type SensorReadingValueBaseType = object | string | number | boolean | null
export type ValueFormatter = (value: SensorReadingValueBaseType, unit: string) => string

export class SensorValueTypeSettings<TValueTypeIndicator extends string> {
  constructor(
    readonly valueType: TValueTypeIndicator,
    readonly unit: string,
    readonly formatter: undefined | number | ValueFormatter,
  ) {}
}

export abstract class SensorReadingMqttData_base_class<
  TValue extends SensorReadingValueBaseType,
  TValueTypeIndicator extends string,
> {
  origin: string
  time: Date
  name: string
  formattedValue: string
  value: TValue
  valueTypeSettings: SensorValueTypeSettings<TValueTypeIndicator>

  constructor(
    value: TValue,
    name: string,
    origin: string,
    valueTypeSettings: SensorValueTypeSettings<TValueTypeIndicator>,
    time: Date = new Date(),
  ) {
    this.value = value
    this.name = name
    this.time = time
    this.origin = origin
    this.valueTypeSettings = valueTypeSettings
  }

  toString() {
    const formatter = this.valueTypeSettings.formatter
    let formattedValue = ''
    switch (typeof formatter) {
      case 'undefined': // no formatter defined for string type values
        formattedValue = this.value as string
        break
      case 'number':
        formattedValue = `${(formatter as number).toFixed(formatter)} ${this.valueTypeSettings.unit}`
        break
      case 'function':
        formattedValue = formatter(this.value, this.valueTypeSettings.unit)
    }
    const { valueTypeSettings: typeSettings, ...data } = {
      type: this.valueTypeSettings.valueType,
      ...this,
      unit: this.valueTypeSettings.unit,
      formattedValue,
    }

    return JSON.stringify(data)
  }
}
