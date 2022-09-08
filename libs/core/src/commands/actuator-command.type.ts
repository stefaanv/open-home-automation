import { OnOffCommand } from './on-off.type'
import { RollerShutterCommand } from './roller-shutter'

export type Command = OnOffCommand | RollerShutterCommand
export type MqttCommandPacket = { command: Command }
