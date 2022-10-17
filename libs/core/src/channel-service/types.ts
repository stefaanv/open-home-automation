import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { UID } from '@core/sensors-actuators/uid.type'

export type DiscoveredSensor<FTE, TFVS> = {
  uid: string
  name: string
  foreignType: FTE
  state: TFVS
}
export type DiscoveredActuator<FTE> = {
  uid: string
  name: string
  modelId: string
  foreignType: FTE
}

export type SensorTypeMapper<FTE extends string> = Record<FTE, MeasurementTypeEnum | undefined>
export type ActuatorTypeMapper<FATE extends string> = Record<FATE, ActuatorTypeEnum | undefined>
export type DiscoverableSensor<FTE extends string> = {
  name: string
  id: UID
  foreignType: FTE
  sensorIgnoreLogInfo: string
  state: any
  lastupdated: Date | undefined
  foreignConfig: any
}

export type DiscoverableActuator<FATE extends string> = {
  name: string
  id: UID
  foreignType: FATE
  state: any
  actuatorIgnoreLogInfo: string
  foreignConfig: any
}
