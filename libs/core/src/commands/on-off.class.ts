import { IsEnum, IsNotEmpty } from 'class-validator'

export class OnOffCommand {
  @IsNotEmpty()
  @IsEnum({ on: 'on', off: 'off' })
  action: 'on' | 'off' = 'off'
}
