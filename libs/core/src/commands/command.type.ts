import { ColoredLightCommand } from './colored-light.class'
import { OnOffCommand } from './on-off.class'
import { RollerShutterCommand } from './roller-shutter'

export type Command = OnOffCommand | RollerShutterCommand | ColoredLightCommand
