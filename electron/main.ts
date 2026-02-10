import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import * as http from "http";
import * as fsSync from "fs";

// ============================================
// Paths
// ============================================

const isDev = !app.isPackaged;

function getUserDataPath(): string {
  return path.join(app.getPath("userData"));
}

function getStoragePath(key: string): string {
  const fileName = key === "settings" ? "settings.json" : "data.json";
  return path.join(getUserDataPath(), fileName);
}

// ============================================
// Atomic JSON storage
// ============================================

async function ensureUserDataDir(): Promise<void> {
  await fs.mkdir(getUserDataPath(), { recursive: true });
}

async function readJSON(filePath: string): Promise<unknown> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeJSON(filePath: string, data: unknown): Promise<void> {
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tempPath, filePath);
}

// ============================================
// MIME type helpers
// ============================================

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json",
    // For directory scanning (carried over)
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".tex": "application/x-tex",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return map[ext] ?? "application/octet-stream";
}

// Simplified MIME guess for fs:readDirectory (original helper)
function guessType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    tex: "application/x-tex",
    txt: "text/plain",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return map[ext] ?? "application/octet-stream";
}

// ============================================
// IPC Handlers
// ============================================

function registerIPC(): void {
  ipcMain.handle(
    "storage:read",
    async (_event, { key }: { key: string }) => {
      const filePath = getStoragePath(key);
      return readJSON(filePath);
    }
  );

  ipcMain.handle(
    "storage:write",
    async (_event, { key, data }: { key: string; data: unknown }) => {
      await ensureUserDataDir();
      const filePath = getStoragePath(key);
      await writeJSON(filePath, data);
      return { success: true };
    }
  );

  ipcMain.handle("dialog:openDirectory", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    "fs:readDirectory",
    async (_event, { dirPath }: { dirPath: string }) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: {
        name: string;
        size: number;
        lastModified: number;
        type: string;
      }[] = [];

      for (const entry of entries) {
        if (entry.isFile() && !entry.name.startsWith(".")) {
          const fullPath = path.join(dirPath, entry.name);
          try {
            const stat = await fs.stat(fullPath);
            files.push({
              name: entry.name,
              size: stat.size,
              lastModified: stat.mtimeMs,
              type: guessType(entry.name),
            });
          } catch {
            // Skip files we can't stat
          }
        }
      }

      return files.sort((a, b) => b.lastModified - a.lastModified);
    }
  );
}

// ============================================
// Local HTTP server for serving Next.js export
// ============================================

let serverPort = 0;

function startStaticServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const outDir = isDev
      ? path.join(__dirname, "..", "..", "out")
      : path.join(process.resourcesPath, "out");

    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url || "/");

      // Strip query strings
      const qIndex = urlPath.indexOf("?");
      if (qIndex !== -1) urlPath = urlPath.substring(0, qIndex);

      // Default to index.html for root
      if (urlPath === "/") {
        urlPath = "/index.html";
      }

      let fullPath = path.join(outDir, urlPath);

      // Security: prevent path traversal
      if (!fullPath.startsWith(outDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      // Try to serve the file directly first
      const tryServe = (filePath: string) => {
        const stream = fsSync.createReadStream(filePath);
        stream.on("open", () => {
          res.writeHead(200, {
            "Content-Type": guessMimeType(filePath),
            "Access-Control-Allow-Origin": "*",
          });
          stream.pipe(res);
        });
        stream.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "ENOENT" || err.code === "EISDIR") {
            // If no extension, try .html (SPA routes)
            if (!path.extname(filePath)) {
              const htmlPath = filePath + ".html";
              const htmlStream = fsSync.createReadStream(htmlPath);
              htmlStream.on("open", () => {
                res.writeHead(200, {
                  "Content-Type": "text/html; charset=utf-8",
                  "Access-Control-Allow-Origin": "*",
                });
                htmlStream.pipe(res);
              });
              htmlStream.on("error", () => {
                // Fall back to index.html for client-side routing
                const indexPath = path.join(outDir, "index.html");
                res.writeHead(200, {
                  "Content-Type": "text/html; charset=utf-8",
                  "Access-Control-Allow-Origin": "*",
                });
                fsSync.createReadStream(indexPath).pipe(res);
              });
            } else {
              res.writeHead(404);
              res.end("Not Found");
            }
          } else {
            res.writeHead(500);
            res.end("Internal Server Error");
          }
        });
      };

      tryServe(fullPath);
    });

    // Listen on random available port on localhost only
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        serverPort = addr.port;
        console.log(`Static server running at http://127.0.0.1:${serverPort}`);
        resolve(serverPort);
      } else {
        reject(new Error("Failed to start static server"));
      }
    });

    server.on("error", reject);
  });
}

// ============================================
// Window
// ============================================

function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.js");

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Academic Dashboard",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadURL(`http://127.0.0.1:${serverPort}`);
  }
}

// ============================================
// App lifecycle
// ============================================

app.whenReady().then(async () => {
  registerIPC();

  // In production, start a local HTTP server to serve the static export.
  // This avoids all the issues with custom protocols (app://) and
  // Next.js RSC payload fetching, fetch() API, etc.
  if (!isDev) {
    await startStaticServer();
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
