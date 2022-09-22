import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

export type SensorChannelTransformer<TFVS> = (state: TFVS) => SensorReadingValue
export type ActuatorChannelTransformer<TFC> = (cmd: Command) => TFC
export type SensorTypeMapper<TFVS> = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: SensorChannelTransformer<TFVS>
}
// export type ActuatorTypeMapper =
export type DiscoveredSensor<TFITE, TFVS> = {
  uid: string
  name: string
  foreignTypeName: TFITE
  state: TFVS
}
