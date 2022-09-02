import { OnOffCommand } from './on-off.type'
import { RollerShutterCommand } from './roller-shutter.type'

export type ActuatorCommand = OnOffCommand | RollerShutterCommand
