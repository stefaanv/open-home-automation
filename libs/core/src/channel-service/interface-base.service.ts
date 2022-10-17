import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { InterfaceConfig } from './discovery-config.class'
import { Sensor } from '@core/sensors-actuators/sensor.class'
import { Actuator } from '@core/sensors-actuators/actuator.class'
import { regexTest } from '@core/helpers/helpers'
import { UID } from '@core/sensors-actuators/uid.type'
import {
  ActuatorTypeMapper,
  DiscoverableActuator,
  DiscoverableSensor,
  SensorTypeMapper,
} from '@core/channel-service/types'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { ACTUATOR_TO_MEASUREMENT_TYPE } from './constants'
import { SensorReadingValue, SensorReadingValueWithoutType } from '@core/sensor-reading-values'

/**
 * Verantwoordelijkheden
 * - kanaal info (omvormen van externe naar mqtt waarden en commando's)
 *
 * Generic types
 * - TFVS : Foreign Value State - vorm van de sensor status die van de externe interface kant komt
 * - FTE : Foreign SENSOR-reading AND ACTUATOR-command Type Enum = litteral string type van de mogelijke externe inkomende sensor en actuator types
 * - FATE : Foreign ACTUATOR-command Type Enum = litteral string type van de mogelijke externe en actuator types
 */
/* Information needed from sensor discovery :
   - uid: key
   - name: label given to the sensor by the external app
   - type: sensor type (eg ZHASwitch)
*/
export abstract class InterfaceBase<FTE extends string, FATE extends FTE> {
  protected _sensorIgnoreList: UID[] = []
  protected _sensorChannels: Sensor<FTE>[] = []
  protected _actuatorIgnoreList: UID[] = []
  protected _actuatorChannels: Actuator<FTE>[] = []
  protected readonly _interfaceConfig: InterfaceConfig<FTE, FATE>

  constructor(
    protected readonly _interfaceName: string,
    protected readonly _log: LoggingService,
    protected readonly _config: ConfigService,
    protected readonly _mqttDriver: MqttDriver,
  ) {
    // set log context
    this._log.setContext(_interfaceName)

    this._interfaceConfig = new InterfaceConfig(this._config, _interfaceName, _log)
  }

  public discoverSensors(sensorList: DiscoverableSensor<FTE>[], typeMapper: SensorTypeMapper<FTE>) {
    const typeIndicators = this._interfaceConfig.sensorTypeIndicatorList
    // store the UID's of sensors to be ignored
    this._sensorIgnoreList = sensorList
      .filter(s => regexTest(s.name, this._interfaceConfig.sensorIgnore))
      .map(s => {
        this._log.debug(`Ignoring sensor ${s.sensorIgnoreLogInfo}`)
        return s
      })
      .map(ds => ds.id)

    // Transform received/discovereds - sensors
    sensorList
      .filter(s => !this._sensorIgnoreList.includes(s.id))
      // .filter(ds => ds.id !== '00:15:8d:00:02:f2:42:b6-01-0006')
      .forEach(s => {
        const mapperMeasurementType = typeMapper[s.foreignType]
        const discoveryConfig = this._interfaceConfig.findDiscoveryConfig(s.name, 'sensor')
        if (!discoveryConfig) return // no configuration that matches `name` and `type`, stop here
        const extractedInfo = discoveryConfig.filter.exec(s.name)!.groups
        if (!extractedInfo) {
          this._log.error(`Unable to extract name convertion information from "${s.name}"`)
          return
        }

        const nameCreateInfo = { ...extractedInfo, typeIndicator: typeIndicators?.[s.foreignType] ?? '' }
        const topic = discoveryConfig.template(nameCreateInfo)
        const measurementType = (discoveryConfig.type ?? mapperMeasurementType) as MeasurementTypeEnum | undefined
        if (!measurementType) {
          this._sensorIgnoreList.push(s.id)
          this._log.debug(`Unable to derive type of ${s.sensorIgnoreLogInfo}`)
          return
        }

        const sensor = new Sensor(s.id, topic, s.foreignType, measurementType, s.state, s)
        this.addSensor(s.name, sensor)
      })

    // Transform defined sensors
    this._interfaceConfig.sensorDefinition
      // Ignore discovered channels with the same unique ID
      .filter(s => {
        //TODO warnen indien op ignore list
        const eqCh = this._sensorChannels.find(ch => ch.id === s.uid)
        if (eqCh) {
          const prefix = `Channel with equal UID ${s.uid} like ${s.topic} already discovered`
          if (eqCh.topic === s.topic && eqCh.measurementType === s.type) this._log.warn(prefix)
          else this._log.error(prefix + `- ignoring the definition, discovery takes precedence`)
          return false
        }
        return true
      })
      .forEach(s => this.addSensor('defined sensor', new Sensor(s.uid as UID, s.topic, s.foreignType, s.type)))
  }

  private addSensor(originalName: string, sensor: Sensor<FTE>, lastupdated?: Date): void {
    this._log.log(
      `Adding sensor "${originalName}" => "${sensor.topic}", type=${sensor.measurementType}, ` +
        `id=${sensor.id}${!sensor.state ? '' : ', state=' + JSON.stringify(sensor.state).replace(/\\"/, `"`)} `,
    )

    // push new sensor to channel list
    this._sensorChannels.push(sensor)

    // send the initial state to the hub
    if (sensor.state) this.sendSensorStateUpdate(sensor.id, sensor.state, lastupdated)
  }

  public discoverActuators(actuatorList: DiscoverableActuator<FATE>[], typeMapper: ActuatorTypeMapper<FATE>) {
    const now = new Date()
    const typeIndicators = this._interfaceConfig.sensorTypeIndicatorList
    // store the UID's of sensors to be ignored
    this._actuatorIgnoreList = actuatorList
      .filter(a => regexTest(a.name, this._interfaceConfig.actuatorIgnore))
      .map(a => {
        this._log.debug(`Ignoring actuator ${a.actuatorIgnoreLogInfo}`)
        return a
      })
      .map(da => da.id)

    actuatorList
      .filter(a => !this._actuatorIgnoreList.includes(a.id))
      .forEach(a => {
        const mapperActuatorType = typeMapper[a.foreignType]
        const discoveryConfig = this._interfaceConfig.findDiscoveryConfig(a.name, 'actuator')
        if (!discoveryConfig) return // no configuration that matches `name` and `type`, stop here
        const extractedInfo = discoveryConfig.filter.exec(a.name)!.groups
        if (!extractedInfo) {
          this._log.error(`Unable to extract name convertion information from "${a.name}"`)
          return
        }

        const nameCreateInfo = { ...extractedInfo, typeIndicator: typeIndicators?.[a.foreignType] ?? '' }
        const topic = discoveryConfig.template(nameCreateInfo)
        const actuatorType = (discoveryConfig.type ?? mapperActuatorType) as ActuatorTypeEnum | undefined
        if (!actuatorType) {
          this._sensorIgnoreList.push(a.id)
          this._log.debug(`Unable to derive type of ${a.actuatorIgnoreLogInfo}`)
          return
        }

        // push new sensor to channel list
        const measurementType = ACTUATOR_TO_MEASUREMENT_TYPE[actuatorType]
        const sensor = new Sensor(a.id, topic, a.foreignType, measurementType)
        const actuator = new Actuator(a.id, topic, a.foreignType, actuatorType, sensor, a)

        this.addSensor(a.name, sensor, now)
        this.addActuator(a.name, actuator)
        if (a) this.sendSensorStateUpdate(sensor.id, a.state)
      })
    //TODO Defined actuators nog toevoegen
  }

  private addActuator(originalName: string, actuator: Actuator<FATE>): void {
    const logMessage = `Adding actuator "${originalName}" => "${actuator.topic}", type=${actuator.actuatorType}, id=${actuator.id}`
    this._log.log(logMessage)

    // push new sensor to channel list
    this._actuatorChannels.push(actuator)
  }

  //TODO: updaten v/d sensor state moet hier gebeuren (dus geen abstracte functie)
  protected sendSensorStateUpdate(id: UID, state: any, lastupdated?: Date) {
    const channel = this._sensorChannels.find(s => s.id === id)
    if (!channel) {
      this._log.error(`Sensor channel ${id} not found - unable to send update`)
      return
    }
    const topicInfix = channel.topic
    const measurementValue = this.transformSensorState(channel, state)

    if (!measurementValue) {
      this._log.error(`Unable to transform foreign state ${JSON.stringify(state)}`)
      return
    }
    if (typeof measurementValue === 'object' && 'type' in measurementValue)
      delete (measurementValue as SensorReadingValueWithoutType).type

    const now = lastupdated ?? new Date()
    channel.state = { time: now, value: measurementValue }
    const update = {
      origin: this._interfaceName,
      time: now,
      type: channel.measurementType,
      value: measurementValue,
    }

    try {
      this._mqttDriver.sendSensorStateUpdate(topicInfix, update)
    } catch (error) {
      this._log.error(JSON.stringify(error))
    }
  }

  protected abstract transformSensorState(channel: Sensor<FTE>, state: any): SensorReadingValue | undefined
}
