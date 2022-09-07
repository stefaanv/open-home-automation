import { ChannelConfigBase } from './channel-config-base.class'

/**
 * TGeneral: vorm van de algemene (General) config
 * TSensorTypes: Lijst van mogelijk waarden voor sensor type
 * TSensorChannelDef: vorm van individuele sensor channel definitie
 * TActuatorTypes: Lijst mogelijke waarden actuator type
 * TActuatorChannelDef: vorm actuator channel definitie
 */
export interface InterfaceConfiguration<
  TGeneral,
  TSensorTypes,
  TSensorChannelDef,
  TActuatorTypes,
  TActuatorChannelDef,
> {
  general: TGeneral
  sensors: ChannelConfigBase<string, TSensorTypes, TSensorChannelDef>
  actuators: ChannelConfigBase<string, TActuatorTypes, TActuatorChannelDef>
}
