import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-values'
import { ActuatorChannel } from './actuator-channel.class'

//TODO: channel verantwoorelijk maken voor het maken van de measurement en de (externe) command
export class ChannelBase<E extends MeasurementTypeEnum | ActuatorTypeEnum> {
  constructor(
    public readonly uid: string,
    public readonly name: string,
    public readonly type: E,
    public readonly transformer:
      | ((arg: Command, channel: ActuatorChannel) => any)
      | ((state: any) => SensorReadingValue),
  ) {}
}
