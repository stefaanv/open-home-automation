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

export type SensorTypeMapper<FTE extends string> = Record<
  FTE,
  { typeIndicator: string; measurementType: MeasurementTypeEnum | undefined }
>
