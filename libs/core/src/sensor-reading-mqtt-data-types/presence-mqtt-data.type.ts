import { SensorReadingMqttData_base_class } from './sensor-reading.base.class'

export type Presence = 'present' | 'absent' | undefined
export class PresenceMqttData extends SensorReadingMqttData_base_class<Presence, 'presence'> {}
