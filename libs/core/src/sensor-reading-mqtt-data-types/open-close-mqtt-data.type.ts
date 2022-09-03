import { SensorReadingMqttData_base_class } from './sensor-reading.base.class'

export type OpenClosed = 'open' | 'closed' | undefined
export class OpenClosedMqttData extends SensorReadingMqttData_base_class<OpenClosed, 'open-closed'> { }
