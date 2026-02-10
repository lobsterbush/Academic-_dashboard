# Academic Dashboard

A Next.js 14 app with an optional Electron desktop wrapper.

## Requirements

- Node.js (LTS recommended)
- npm (comes with Node.js)

## macOS

### 1) Install dependencies

```bash
npm install
```

### 2) Run the web app

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 3) Run the desktop app (Electron)

```bash
npm run dev:electron
```

### 4) Build a macOS desktop app (optional)

```bash
npm run build:electron
```

The DMG will be created in `dist-electron/`.

## Windows

### 1) Install dependencies

```bash
npm install
```

### 2) Run the web app

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 3) Run the desktop app (Electron)

```bash
npm run dev:electron
```

### 4) Build a Windows desktop app (optional)

```bash
npm run build:main
npm run build
npx electron-builder --win
```

The installer will be created in `dist-electron/`.

## Notes

- The desktop app serves the statically exported Next.js build from `out/` in production.
- If `npm run dev:electron` does not open a window, make sure port `3000` is free and try again.
