import { validate, ValidationError } from 'class-validator'
import { ActuatorTypeEnum } from './actuator-type.enum'
import { OnOffCommand } from './on-off.class'
import { Command } from './command.type'
import { ColoredLightCommand } from './colored-light.class'

export class ValidationResult {
  private errors: ValidationError[] = []

  constructor(errors: ValidationError[]) {
    this.errors = errors
  }

  public get isValid() {
    return this.errors.length === 0
  }

  public get errorMessages() {
    return this.errors.map(e => e.toString())
  }

  static async validate(cmd: Command) {
    const errors = await validate(cmd)
    return new ValidationResult(errors)
  }
}

export class CommandParser {
  static async parse(type: ActuatorTypeEnum, payload: any): Promise<Command | ValidationResult> {
    let command: Command
    let vr: ValidationResult
    switch (type) {
      case 'relay':
        command = new OnOffCommand()
        Object.assign(command, payload)
        vr = await ValidationResult.validate(command)
        return vr.isValid ? command : vr
      case 'colored-light':
        command = new ColoredLightCommand()
        Object.assign(command, payload)
        vr = await ValidationResult.validate(command)
        return vr.isValid ? command : vr
      default:
        return new ValidationResult([])
    }
  }
}
