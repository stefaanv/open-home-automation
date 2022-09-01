import { OnOffCommand } from './on-off.type'
import { RollerShutterCommand } from './roller-shutter-command.type'

export type ActuatorCommand = OnOffCommand | RollerShutterCommand
