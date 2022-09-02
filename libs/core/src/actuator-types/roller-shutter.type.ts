export type RollerShutterActions = 'up' | 'down' | 'stop' | 'toPosition'

export type RollerShutterCommand = {
  action: RollerShutterActions
  position: number | undefined
  type: 'roller-shutter'
}
