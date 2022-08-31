import { SensorReadingMqttData_base_class } from './sensor-reading.base.class'

export type OnOff = 'on' | 'off' | undefined
export class OnOffMqttData extends SensorReadingMqttData_base_class<OnOff, 'on-off'> {}
