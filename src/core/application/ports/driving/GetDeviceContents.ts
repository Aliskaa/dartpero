export type DeviceContents = {
  readonly matches: number
  readonly players: number
}

export interface GetDeviceContents {
  execute(): Promise<DeviceContents>
}
