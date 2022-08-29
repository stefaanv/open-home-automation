export type GenericSensorMapperConfig = {
  type: 'generic'
  nameFilter: string | RegExp
  measurementType: string | undefined
}

export type InstanceSensorMapperConfig = {
  type: 'instance'
  uid: string
  name: string
  measurementType: string
}

export type SensorMapperConfig = GenericSensorMapperConfig | InstanceSensorMapperConfig
