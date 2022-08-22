export type ItemType = 'temperature' | 'switch' | 'somethingElse'

export type ItemUpdate<T = any> = {
  time: Date
  type: ItemType
  item: string
  newState: T
  previousState: undefined | OldState<T>
}

export interface OldState<T = any> {
  time: Date
  state: T
}
