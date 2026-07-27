const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let autoUpdater = null;
try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (e) {
  console.warn('electron-updater not available:', e.message);
}

// Embedded Express backend server
try {
  require('../server/index.js');
} catch (err) {
  console.error('Failed to start embedded backend server:', err);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'VideoPilot Pro',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    backgroundColor: '#09090b',
    show: true
  });

  // Official Electron API for absolute app root path resolution
  const appRoot = app.getAppPath();
  const indexHtmlPath = path.join(appRoot, 'client', 'dist', 'index.html');

  console.log('App Root:', appRoot);
  console.log('Target HTML Path:', indexHtmlPath);

  const loadApp = () => {
    if (fs.existsSync(indexHtmlPath)) {
      mainWindow.loadFile(indexHtmlPath).catch((err) => {
        console.error('loadFile error:', err);
        fallbackToUrl();
      });
    } else {
      fallbackToUrl();
    }
  };

  const fallbackToUrl = () => {
    const startUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    mainWindow.loadURL(startUrl).catch((err) => {
      console.error('loadURL fallback error:', err);
      // Fallback HTML string so black screen NEVER happens
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background: #09090b; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h2 { color: #10b981; margin-bottom: 8px; }
            p { color: #a1a1aa; font-size: 14px; }
            button { background: #10b981; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 16px; }
            button:hover { background: #34d399; }
          </style>
        </head>
        <body>
          <h2>VideoPilot Pro Engine Loading...</h2>
          <p>Initializing desktop interface and server connection.</p>
          <button onclick="location.reload()">Reload Application</button>
        </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    });
  };

  loadApp();

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page load failed:', errorCode, errorDescription);
  });

  // Check for updates 5 seconds after launch
  if (autoUpdater) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('Auto-update check ignored:', err.message);
      });
    }, 5000);
  }
}

if (autoUpdater) {
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-ready', info);
  });
}

ipcMain.on('restart-and-update', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Download Storage Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (err) {
    console.error('Error selecting folder:', err);
    return null;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
