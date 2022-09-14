export type RollerShutterActions = 'up' | 'open' | 'down' | 'close' | 'stop' | 'toPosition'

export type RollerShutterCommand = {
  action: RollerShutterActions
  position: number | undefined
}
