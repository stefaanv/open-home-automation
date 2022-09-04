import {
  SensorReadingMqttData_base_class,
  SensorReadingValueBaseType,
} from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'

/** specifieke sensor of actuator */
export class DeviceBase<TUID extends number | string, TConfig, TValueTypeIndicator extends string> {
  constructor(
    readonly uid: TUID,
    readonly name: string,
    readonly config: TConfig,
    readonly mqttValue: SensorReadingMqttData_base_class<TValueTypeIndicator>,
    readonly transformer: (state: any) => SensorReadingValueBaseType,
  ) {}
}
