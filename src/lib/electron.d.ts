interface ElectronStorageAPI {
  read: (key: string) => Promise<unknown>;
  write: (key: string, data: unknown) => Promise<{ success: boolean }>;
}

interface ElectronDialogAPI {
  openDirectory: () => Promise<string | null>;
}

interface ElectronFSAPI {
  readDirectory: (
    dirPath: string
  ) => Promise<
    { name: string; size: number; lastModified: number; type: string }[]
  >;
}

interface ElectronAPI {
  storage: ElectronStorageAPI;
  dialog: ElectronDialogAPI;
  fs: ElectronFSAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
