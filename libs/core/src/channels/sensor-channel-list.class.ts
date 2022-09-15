import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { ChannelListBase } from './channel-list-base.class'
import { SensorChannel } from './sensor-channel.class'

export class SensorChannelList<TUID extends string | number> extends ChannelListBase<TUID, SensorChannel<TUID>> {
  static log: LoggingService

  public add(channel: SensorChannel<TUID>) {
    super.add(channel)
  }

  public sendUpdate(mqttDriver: MqttDriver, uid: TUID, state: any, driverName: string, time: Date = new Date()) {
    const channel = this.get(uid)
    if (channel) {
      const update = channel.transformToSensorReading(state, driverName, time)
      mqttDriver.sendMeasurement(update)
    } else {
      const msg = `value update for unknown sensor ${uid} : ${JSON.stringify(state)}`
      SensorChannelList.log.warn(msg)
    }
  }
}
