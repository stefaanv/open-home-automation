import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'

export const ACTUATOR_TO_MEASUREMENT_TYPE: Record<ActuatorTypeEnum, MeasurementTypeEnum> = {
  'colored-light': 'colored-light',
  'roller-shutter': 'moving', //TODO: maar ook 'position' ????
  relay: 'on-off',
}
