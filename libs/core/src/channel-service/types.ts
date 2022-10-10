import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

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
