export interface ItemUpdate<T> {
  time: Date
  topic: string
  previousState: undefined | OldState<T>
  newState: T
}

export interface OldState<T> {
  time: Date
  state: T
}
