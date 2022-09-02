import * as mqtt from 'async-mqtt'
import * as fns from 'date-fns'

const brokerUrl = 'mqtt://192.168.0.10'
const sensorTopicsPrefix = 'oha/sensor-reading'
const subscribeTotopics = ['buiten_zuid_lumi', 'rl_living_zuid', 'buiten_lucht_temp', 'themostaat_bureau_temp']
const UPPER_ILLUMINATION_LIMIT = 30000
const LOWER_ILLUMINATION_LIMIT = 10000
const HYSTERESIS_DELAY = 120 //seconds
const REPORT_INTERVAL = 60 //seconds
const EVALUATE_INTERVAL = 60 //seconds
const TARGET_CLOSURE_STATE = 60
const CLOSURE_OPEN_LIMIT = 5
const CLOSURE_CLOSED_LIMIT = 40
const ACTIVE_TIME_FROM = 9
const ACTIVE_TIME_TILL = 21

type State = {
  exteriorTemperature?: number
  interiorTemperature?: number
  shutterClosure?: number,
  illuminance?: number,
  underLowerLimitSince?: Date
  overUpperLimitSince?: Date
}
const state: State = {}
const sensorNameTranslator = {
  buiten_zuid_lumi: 'illuminance',
  rl_living_zuid: 'shutterClosure',
  buiten_lucht_temp: 'exteriorTemperature',
  themostaat_bureau_temp: 'interiorTemperature'
}

let mqttClient: mqtt.AsyncClient

async function bootstrap() {
  console.log(`@${fns.format(new Date(), 'HH:mm:ss')} -> STARTING automation Rolluik Living zuid`)

  mqttClient = mqtt.connect(brokerUrl)
  mqttClient.on('connect', () => {
    console.log(`MQTT connected to ${brokerUrl}`)
  })
  mqttClient.on('message', (topic: string, message: Buffer) =>
    receiveCallback(topic, message)
  )
  mqttClient.subscribe(subscribeTotopics.map((sn) => sensorTopicsPrefix + '/' + sn))
  setInterval(() => evaluate(), EVALUATE_INTERVAL * 1000)
  setInterval(() => report(), REPORT_INTERVAL * 1000)
}
bootstrap();

const report = () => {
  console.log(`@${fns.format(new Date(), 'HH:mm:ss')} -> ${JSON.stringify(state)}`)
}

const receiveCallback = (topic: string, message: Buffer) => {
  const msg = message.toString()
  const splitTopic = topic.split('/')
  const sensorName = splitTopic[splitTopic.length - 1]
  const data = JSON.parse(msg)
  if (sensorName === 'rl_living_zuid' && data['type'] !== 'closure') return
  const value: number = data['value']
  state[sensorNameTranslator[sensorName]] = value
  evaluate()
}

const evaluate = async () => {
  const now = new Date()
  const allKnown = state.exteriorTemperature != undefined && state.illuminance != undefined && state.interiorTemperature != undefined && state.shutterClosure != undefined
  const shutterIsOpen = state.shutterClosure < CLOSURE_OPEN_LIMIT
  const shutterIsClosed = state.shutterClosure > CLOSURE_CLOSED_LIMIT
  const hour = fns.differenceInMinutes(now, fns.startOfDay(now)) / 60
  const activeTime = hour > ACTIVE_TIME_FROM && hour < ACTIVE_TIME_TILL

  if (state.illuminance < UPPER_ILLUMINATION_LIMIT && state.illuminance > LOWER_ILLUMINATION_LIMIT) {
    resetOverUnder()
  }

  if (!allKnown || !activeTime) return

  if (shutterIsOpen) {
    if (state.illuminance > UPPER_ILLUMINATION_LIMIT) {
      state.underLowerLimitSince = undefined
      if (!state.overUpperLimitSince)
        state.overUpperLimitSince = new Date()
    } else {
      state.overUpperLimitSince = undefined
    }
    const timeOverUpper = !!state.overUpperLimitSince ? fns.differenceInSeconds(now, state.overUpperLimitSince) : undefined

    if (timeOverUpper > HYSTERESIS_DELAY) {
      closeShutter()
      console.log(`@${fns.format(new Date(), 'HH:mm:ss')} -> CLOSING`)
      resetOverUnder()
    }
    if (timeOverUpper) console.log('timeOverUpper', timeOverUpper)
  }

  if (shutterIsClosed) {
    if (state.illuminance < LOWER_ILLUMINATION_LIMIT) {
      state.overUpperLimitSince = undefined
      if (!state.underLowerLimitSince)
        state.underLowerLimitSince = new Date()
    } else {
      state.underLowerLimitSince = undefined
    }
    const timeUnderLower = !!state.underLowerLimitSince ? fns.differenceInSeconds(now, state.underLowerLimitSince) : undefined
    if (timeUnderLower > HYSTERESIS_DELAY) {
      closeShutter()
      console.log(`@${fns.format(new Date(), 'HH:mm:ss')} -> OPENING`)
      resetOverUnder()
    }
    if (timeUnderLower) console.log('timeUnderLower', timeUnderLower)
  }

}
function resetOverUnder() {
  state.overUpperLimitSince = undefined
  state.underLowerLimitSince = undefined
}

function openShutter() {
  mqttClient.publish('oha/command/rl_living_zuid', `{"action":"up"}`)
}

function closeShutter() {
  mqttClient.publish('oha/command/rl_living_zuid', `{"action":"toPosition", "position": ${TARGET_CLOSURE_STATE}}`)
}
