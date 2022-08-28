import { ActuatorType } from './actuator-type.type'

export type ActuatorCommand = {
  origin: string
  time: Date
  type: ActuatorType
  name: string
  command: any
}
