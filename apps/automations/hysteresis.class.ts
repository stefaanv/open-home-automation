import * as fns from 'date-fns'

export type LimitCrossing = 'none' | 'upper' | 'lower'

export default class Hysteresis {
  private _lastValue?: number = undefined
  private _lastValueReceivedAt?: Date = undefined
  private _upperCrossedAt?: Date = undefined
  private _lowerCrossedAt?: Date = undefined

  constructor(
    private readonly _upperLimit: number,
    private readonly _lowerLimit: number,
    private readonly _delayTime: number, // in seconds
  ) {}

  public update(newValue: number, time: Date = new Date()) {
    if (this._lastValue < this._upperLimit && newValue > this._upperLimit) {
      this._upperCrossedAt = time
    }
    if (this._lastValue > this._lowerLimit && newValue < this._lowerLimit) {
      this._lowerCrossedAt = time
    }
    this._lastValue = newValue
    this._lastValueReceivedAt = time
    return this.evaluate()
  }

  public evaluate(time: Date = new Date()): LimitCrossing {
    if (this._upperCrossedAt && fns.differenceInSeconds(time, this._upperCrossedAt) > this._delayTime) {
      this._upperCrossedAt = undefined
      return 'upper'
    }
    if (this._lowerCrossedAt && fns.differenceInSeconds(time, this._lowerCrossedAt) > this._delayTime) {
      this._lowerCrossedAt = undefined
      return 'lower'
    }
    return 'none'
  }
}
