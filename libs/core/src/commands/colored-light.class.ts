import { IsEnum, IsNotEmpty, Min, Max, IsNumber, IsBoolean } from 'class-validator'

export class ColoredLightCommand {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(255)
  brightness!: number

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10000)
  colorTemperature!: number

  @IsNotEmpty()
  @IsBoolean()
  on!: boolean
}
