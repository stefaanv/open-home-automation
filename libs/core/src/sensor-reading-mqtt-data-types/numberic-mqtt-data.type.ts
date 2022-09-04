import { SensorReadingMqttData_base_class, SensorValueTypeSettings } from './sensor-reading.base.class'

export class IlluminanceMqttData extends SensorReadingMqttData_base_class<'illuminance'> {
  constructor(name: string, origin: string) {
    super('illuminance', name, origin, new SensorValueTypeSettings('illuminance', 'Lux', 0))
  }
}

export class TemperatureMqttData extends SensorReadingMqttData_base_class<'temperature'> {
  constructor(name: string, origin: string) {
    super('temperature', name, origin, new SensorValueTypeSettings('temperature', '°C', 1))
  }
}

export class HumidityMqttData extends SensorReadingMqttData_base_class<'humidity'> {
  constructor(name: string, origin: string) {
    super('humidity', name, origin, new SensorValueTypeSettings('humidity', '%rh', 1))
  }
}
