import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  storage: {
    read: (key: string): Promise<unknown> =>
      ipcRenderer.invoke("storage:read", { key }),
    write: (key: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("storage:write", { key, data }),
  },
  dialog: {
    openDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke("dialog:openDirectory"),
  },
  fs: {
    readDirectory: (
      dirPath: string
    ): Promise<
      { name: string; size: number; lastModified: number; type: string }[]
    > => ipcRenderer.invoke("fs:readDirectory", { dirPath }),
  },
});
