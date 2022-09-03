import { ActuatorConfigBase, SensorConfigBase } from "@core/device/sensor-config-base.class";

export interface InterfaceConfiguration<G> {
  general: G,
  sensors: SensorConfigBase<string>,
  actuators: ActuatorConfigBase<string>
}