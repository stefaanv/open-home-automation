import { SensorValueTypeSettings } from '@core/configuration/sensors/SensorValueTypeSettings.class'
import { SensorReadingMqttDataBaseClass } from './sensor-reading.base.class'

export type OnOff = 'on' | 'off' | undefined

export class OnOffMqttData extends SensorReadingMqttDataBaseClass {
  constructor(name: string, origin: string) {
    super('on-off', name, origin, new SensorValueTypeSettings('on-off', '', undefined))
  }
}
