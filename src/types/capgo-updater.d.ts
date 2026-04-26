declare module '@capgo/capacitor-updater' {
  export const CapacitorUpdater: {
    notifyAppReady: () => Promise<void>
    setChannel: (options: { channel: string }) => Promise<void>
    download: (options: { channel: string }) => Promise<{
      bundle?: {
        id?: string
      }
    }>
    set: (options: { id: string }) => Promise<void>
  }
}
