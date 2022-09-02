import {
  SensorReadingMqttDataTypeSettings,
  SensorReadingMqttData_base_class,
  ValueFormatter,
} from './sensor-reading.base.class'

type NumericMqttDataTypes = 'temperature' | 'humidity' | 'illuminance'
export class NumericMqttData<TTypeIndicator extends NumericMqttDataTypes> extends SensorReadingMqttData_base_class<
  Number,
  TTypeIndicator
> {
  constructor(
    type: TTypeIndicator,
    value: number,
    name: string,
    origin: string,
    unit: string,
    formatter: ValueFormatter,
    time: Date = new Date(),
  ) {
    const typeSettings: SensorReadingMqttDataTypeSettings<TTypeIndicator> = { type, unit, formatter }
    super(value, name, origin, typeSettings, time)
    this.value = value
    this.name = name
    this.time = time
    this.origin = origin
    this.formattedValue = formatter(value, unit)
  }
}
