import { IsEnum } from 'class-validator'

export class OnOffCommand {
  @IsEnum({ on: 'on', off: 'off' })
  switchTo: 'on' | 'off' = 'off'
}
