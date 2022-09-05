import { SensorReadingMqttDataBaseClass } from './sensor-reading.base.class'
import { SensorValueTypeSettings } from '@core/configuration/sensors/SensorValueTypeSettings.class'

export type Presence = 'present' | 'absent' | undefined
export class PresenceMqttData extends SensorReadingMqttDataBaseClass {
  constructor(name: string, origin: string) {
    super('presence', name, origin, new SensorValueTypeSettings('presence', '', undefined))
  }
}
