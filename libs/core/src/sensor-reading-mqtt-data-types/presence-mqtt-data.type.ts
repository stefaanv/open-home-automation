import { SensorReadingMqttData_base_class, SensorValueTypeSettings } from './sensor-reading.base.class'

export type Presence = 'present' | 'absent' | undefined
export class PresenceMqttData extends SensorReadingMqttData_base_class<'presence'> {
  constructor(name: string, origin: string) {
    super('presence', name, origin, new SensorValueTypeSettings('presence', '', undefined))
  }
}
