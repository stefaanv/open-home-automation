import {
  SensorReadingMqttData_base_class,
  SensorReadingValueBaseType,
} from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'

/** specifieke sensor of actuator */
export interface DeviceBase<
  TUID extends number | string,
  TConfig,
  TValue extends SensorReadingValueBaseType,
  TValueTypeIndicator extends string,
> {
  readonly uid: TUID
  readonly name: string
  readonly config: TConfig
  readonly mqttValue: SensorReadingMqttData_base_class<TValueTypeIndicator, TValue>
  transformer: (state: any) => TValue
}
