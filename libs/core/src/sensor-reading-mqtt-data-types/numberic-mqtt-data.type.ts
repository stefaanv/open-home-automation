import { SensorValueTypeSettings } from '@core/configuration/sensors/SensorValueTypeSettings.class'
import { MeasurementTypeEnum } from '@core/measurement-types/measurement-type.enum'
import { SensorReadingMqttDataBaseClass } from './sensor-reading.base.class'

export class NumericMqttData<T extends MeasurementTypeEnum> extends SensorReadingMqttDataBaseClass {
  constructor(type: T, name: string, origin: string, valueTypeSettings: SensorValueTypeSettings) {
    super(type, name, origin, valueTypeSettings)
  }
}

export class IlluminanceMqttData extends NumericMqttData<'illuminance'> {
  constructor(name: string, origin: string) {
    super('illuminance', name, origin, new SensorValueTypeSettings('illuminance', 'Lux', 0))
  }
}

export class TemperatureMqttData extends NumericMqttData<'temperature'> {
  constructor(name: string, origin: string) {
    super('temperature', name, origin, new SensorValueTypeSettings('temperature', '°C', 1))
  }
}

export class HumidityMqttData extends NumericMqttData<'humidity'> {
  constructor(name: string, origin: string) {
    super('humidity', name, origin, new SensorValueTypeSettings('humidity', '%rh', 1))
  }
}
