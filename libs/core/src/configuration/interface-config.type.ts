import { ChannelConfigBase } from './channel-config-base.class'

/**
 * TGeneral: vorm van de algemene (General) config
 * TSensorTypes: Lijst van mogelijk waarden voor sensor type
 * TSensorChannelDef: vorm van individuele sensor channel definitie
 * TActuatorTypes: Lijst mogelijke waarden actuator type
 * TActuatorChannelDef: vorm actuator channel definitie
 */
export interface InterfaceConfiguration<
  TUID,
  TGeneral,
  TSensorTypes extends string,
  TSensorChannelDef extends string,
  TActuatorTypes extends string,
  TActuatorChannelDef extends string,
> {
  general: TGeneral
  sensors: ChannelConfigBase<TUID, TSensorTypes, TSensorChannelDef>
  actuators: ChannelConfigBase<TUID, TActuatorTypes, TActuatorChannelDef>
}
