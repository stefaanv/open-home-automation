import { ActuatorConfigBase, SensorConfigBase } from "@core/device/device-config-base.class";

export interface InterfaceConfiguration<G> {
  general: G,
  sensors: SensorConfigBase<string>,
  actuators: ActuatorConfigBase<string>
}