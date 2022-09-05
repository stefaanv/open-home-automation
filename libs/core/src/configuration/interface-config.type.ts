import { ActuatorConfigBase } from './actuators/actuator-config.class'
import { SensorConfigBase } from './sensors/sensor-config-base.class'

export interface InterfaceConfiguration<G, U, V> {
  general: G
  sensors: SensorConfigBase<string, U>
  actuators: ActuatorConfigBase<string, V>
}
