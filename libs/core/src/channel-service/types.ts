import { ActuatorTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

export type SensorChannelTransformer<TFVS> = (state: TFVS) => SensorReadingValue
export type ActuatorChannelTransformer = (cmd: Command) => any
export type SensorTypeMapper<TFVS> = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: SensorChannelTransformer<TFVS>
}
export type ActuatorTypeMapper = {
  nameExtension: string
  actuatorType: ActuatorTypeEnum
  transformer: ActuatorChannelTransformer
}
export type DiscoveredSensor<FSTE, TFVS> = {
  uid: string
  name: string
  foreignType: FSTE
  state: TFVS
}
export type DiscoveredActuator<FATE> = {
  uid: string
  name: string
  modelId: string
  foreignType: FATE
}
