import { SensorReadingMqttData_base_class, ValueFormatter } from './sensor-reading.base.class'

type NumericMqttDataTypes = 'temperature' | 'humidity' | 'illuminance'
export class NumericMqttData extends SensorReadingMqttData_base_class<Number, NumericMqttDataTypes> {
  constructor(
    type: NumericMqttDataTypes,
    value: number,
    name: string,
    origin: string,
    unit: string = '',
    formatter: ValueFormatter,
    time: Date = new Date(),
  ) {
    super(value, name, origin, unit, formatter, time)
    this.value = value
    this.name = name
    this.time = time
    this.unit = unit
    this.origin = origin
    this.formattedValue = formatter(value, unit)
    this.type = type
  }
}
