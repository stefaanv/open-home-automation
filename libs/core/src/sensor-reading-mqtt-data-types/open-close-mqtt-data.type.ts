import { SensorValueTypeSettings } from '@core/configuration/sensors/SensorValueTypeSettings.class'
import { SensorReadingMqttDataBaseClass } from './sensor-reading.base.class'

export type OpenClosed = 'open' | 'closed' | undefined
export class OpenClosedMqttData extends SensorReadingMqttDataBaseClass {
  constructor(name: string, origin: string) {
    super('open-closed', name, origin, new SensorValueTypeSettings('open-closed', '', undefined))
  }
}
