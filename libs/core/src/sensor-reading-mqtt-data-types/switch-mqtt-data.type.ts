import { SensorReadingMqttData_base_class } from './sensor-reading.base.class'

export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
export class SwitchMqttData extends SensorReadingMqttData_base_class<SwitchPressed, 'switch'> {}
