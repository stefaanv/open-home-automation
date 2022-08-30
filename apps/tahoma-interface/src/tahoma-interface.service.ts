import { Injectable } from '@nestjs/common'
import axios, { Axios } from 'axios'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import https from 'https'

type SomfyDevice = {
  label: string
  deviceURL: string
  available: boolean
  type: 'SENSOR' | 'PROTOCOL_GATEWAY' | 'ACTUATOR'
  controllableName:
    | 'io:RollerShutterGenericIOComponent'
    | 'io:VerticalExteriorAwningIOComponent'
    | 'io:StackComponent'
    | 'io:LightIOSystemSensor'
}

const API_BASE_URL_KEY = 'tahoma.interfaceSpecific.baseUrl'
const API_AUTHORIZATION_TOKEN_KEY = 'tahoma.interfaceSpecific.authorizationToken'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class TahomaInterfaceService {
  private readonly _axios: Axios

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    // set log context
    this._log.setContext(TahomaInterfaceService.name)

    // retriever API key and BASE URL from config
    const apiAuthToken = this._config.get<string>(API_AUTHORIZATION_TOKEN_KEY, '')
    if (!apiAuthToken) this._log.warn(API_AUTHORIZATION_TOKEN_KEY + EMPTY_ERROR_MSG)
    const apiBaseUrl = this._config.get<string>(API_BASE_URL_KEY, '')
    if (!apiBaseUrl) this._log.warn(API_BASE_URL_KEY + API_BASE_URL_KEY)
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    this._axios = axios.create({
      baseURL: apiBaseUrl,
      responseType: 'json',
      headers: { Authorization: 'Bearer ' + apiAuthToken },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
    this.discover()
  }

  async discover() {
    const devices = await this._axios.get<SomfyDevice[]>('setup/devices')
    const selectedActuators = devices.data.filter(d => d.controllableName === 'io:RollerShutterGenericIOComponent')
    const selectedSensors = devices.data.filter(d => d.controllableName === 'io:LightIOSystemSensor')
    console.log('selectedActuators', selectedActuators)
    console.log('selectedSensors', selectedSensors)
  }
}
