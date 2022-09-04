import { SensorReadingMqttData_base_class, SensorValueTypeSettings } from './sensor-reading.base.class'

export type OnOff = 'on' | 'off' | undefined

export class OnOffMqttData extends SensorReadingMqttData_base_class<'on-off'> {
  constructor(name: string, origin: string) {
    super('on-off', name, origin, new SensorValueTypeSettings('on-off', '', undefined))
  }
}
