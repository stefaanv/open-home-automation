export type SensorReadingValueBaseType = object | string | number | boolean | null
export type ValueFormatter = (value: SensorReadingValueBaseType, unit: string) => string

export abstract class SensorReadingMqttData_base_class<TValue extends SensorReadingValueBaseType, TTypeIndicator> {
  origin: string
  time: Date
  name: string
  unit: string
  formattedValue: string
  value: TValue
  type: TTypeIndicator

  constructor(
    value: TValue,
    name: string,
    origin: string,
    unit: string = '',
    formatter: ValueFormatter = (value: SensorReadingValueBaseType) => value.toString(),
    time: Date = new Date(),
  ) {
    this.value = value
    this.name = name
    this.time = time
    this.unit = unit
    this.origin = origin
    this.formattedValue = formatter(value, unit)
  }
}
