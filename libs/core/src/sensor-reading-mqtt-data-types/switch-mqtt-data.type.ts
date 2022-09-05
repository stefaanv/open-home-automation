import { SensorReadingMqttDataBaseClass } from './sensor-reading.base.class'
import { SensorValueTypeSettings } from '@core/configuration/sensors/SensorValueTypeSettings.class'

export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
export class SwitchMqttData extends SensorReadingMqttDataBaseClass {
  constructor(name: string, origin: string) {
    super('switch', name, origin, new SensorValueTypeSettings('switch', '', undefined))
  }
}
