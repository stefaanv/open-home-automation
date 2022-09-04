import { SensorReadingMqttData_base_class, SensorValueTypeSettings } from './sensor-reading.base.class'

export type OpenClosed = 'open' | 'closed' | undefined
export class OpenClosedMqttData extends SensorReadingMqttData_base_class<'open-closed'> {
  constructor(name: string, origin: string) {
    super('open-closed', name, origin, new SensorValueTypeSettings('open-closed', '', undefined))
  }
}
