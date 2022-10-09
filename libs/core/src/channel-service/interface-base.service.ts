import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { DiscoveryConfigRegex, InterfaceConfig } from './discovery-config.class'
import { Sensor } from '@core/sensors-actuators/sensor.class'
import { Actuator } from '@core/sensors-actuators/actuator.class'
import { regexExtract, regexTest } from '@core/helpers/helpers'

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - FTE : Foreign SENSOR-reading AND ACTUATOR-command Type Enum = litteral string type van de mogelijke externe inkomende sensor en actuator types
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
@Injectable()
export class InterfaceBase<TUID, FTE extends string> {
  protected _sensorIgnoreList: TUID[] = []
  protected _sensorChannels: Sensor<TUID, FTE>[] = []
  protected _actuatorIgnoreList: TUID[] = []
  protected _actuatorChannels: Actuator<TUID, FTE>[] = []
  protected readonly _interfaceConfig: InterfaceConfig<FTE>

  constructor(
    protected readonly _interfaceName: string,
    protected readonly _log: LoggingService,
    protected readonly _config: ConfigService,
    protected readonly _mqttDriver: MqttDriver,
  ) {
    this._interfaceConfig = new InterfaceConfig(this._config, _interfaceName)
  }

  getNameFromConfig(id: TUID, name: string, type: 'sensor' | 'actuator') {
    const discoverConfig: DiscoveryConfigRegex[] =
      this._interfaceConfig[type === 'sensor' ? 'sensorDiscover' : 'actuatorDiscover']
    const matchingFilter = discoverConfig.find(f => regexTest(name, f.filter))
    if (!matchingFilter) {
      const msg =
        `this is no matching filter for ${type} ${name} and the name does not match the ignore filter` +
        ` this is probably not what you intended, please update the configuration`
      this._log.warn(msg)
      return undefined
    }
    return { name: regexExtract(name, matchingFilter.filter, 'name'), type: matchingFilter.type }
  }

  protected getSensorChannel(id: TUID): Sensor<TUID, FTE> | undefined {
    const sensorChannel = this._sensorChannels.find(sc => sc.id === id)
    if (sensorChannel) return sensorChannel
    const actuatorChannel = this._actuatorChannels.find(sc => sc.id === id)
    return actuatorChannel
  }
}
