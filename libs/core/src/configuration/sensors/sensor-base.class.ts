import {
  SensorReadingMqttDataBaseClass,
  SensorReadingValueBaseType,
} from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'

/** specifieke sensor of actuator */
export class SensorBaseClass<TUID extends number | string, TConfig> {
  constructor(
    readonly uid: TUID,
    readonly name: string,
    readonly config: TConfig,
    readonly mqttValue: SensorReadingMqttDataBaseClass,
    readonly transformer: (state: any) => SensorReadingValueBaseType,
  ) {}
}
