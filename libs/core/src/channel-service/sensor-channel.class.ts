import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorChannelTransformer } from './types'

export class SensorChannel<TFVS> {
  constructor(
    public readonly uid: string,
    public readonly name: string,
    public readonly type: MeasurementTypeEnum,
    public readonly transformer: SensorChannelTransformer<TFVS>,
  ) {}

  // //TODO te moven naar de Service
  // transformToSensorReading(foreignState: any, interfaceName: string, time: Date): SensorReading {
  //   const value = this.transformer(foreignState)
  //   if (typeof value === 'object') {
  //     delete value.type
  //   }
  //   const update = {
  //     name: this.name,
  //     origin: interfaceName,
  //     time,
  //     type: this.type,
  //     value,
  //   }
  //   console.log(JSON.stringify(update))
  //   return update
  // }
}
