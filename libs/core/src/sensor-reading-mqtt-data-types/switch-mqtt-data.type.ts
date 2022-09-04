import { SensorReadingMqttData_base_class, SensorValueTypeSettings } from './sensor-reading.base.class'

export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
export class SwitchMqttData extends SensorReadingMqttData_base_class<'switch'> {
  constructor(name: string, origin: string) {
    super('switch', name, origin, new SensorValueTypeSettings('switch', '', undefined))
  }
}
