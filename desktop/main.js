const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let autoUpdater = null;
let isUpdateDownloaded = false;

try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.forceDevUpdateConfig = true; // Guarantees updater operates in all environments
} catch (e) {
  console.warn('electron-updater not available:', e.message);
}

// Embedded Express backend server safely initialized
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

  const appRootHtmlPath = path.join(app.getAppPath(), 'client', 'dist', 'index.html');
  const relativeHtmlPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');

  // Direct load without fragile fs.existsSync checks
  mainWindow.loadFile(appRootHtmlPath).catch((err) => {
    console.warn('appRootHtmlPath load failed, trying relativeHtmlPath:', err.message);
    mainWindow.loadFile(relativeHtmlPath).catch((relErr) => {
      console.warn('relativeHtmlPath load failed, loading dev URL:', relErr.message);
      const startUrl = process.env.CLIENT_URL || 'http://localhost:5000';
      mainWindow.loadURL(startUrl);
    });
  });

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
    console.log('Update available event:', info);
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded event:', info);
    isUpdateDownloaded = true;
    mainWindow?.webContents.send('update-ready', info);
  });
}

ipcMain.on('check-for-updates', async () => {
  if (autoUpdater) {
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      mainWindow?.webContents.send('update-check-result', {
        checked: true,
        available: !!result,
        version: result?.updateInfo?.version || null,
        mode: 'github-releases'
      });
    } catch (err) {
      console.warn('electron-updater check failed (falling back to API endpoint):', err.message);
      mainWindow?.webContents.send('update-check-result', {
        checked: true,
        available: false,
        fallbackToApi: true,
        error: err.message
      });
    }
  } else {
    mainWindow?.webContents.send('update-check-result', {
      checked: true,
      available: false,
      fallbackToApi: true
    });
  }
});

ipcMain.on('restart-and-update', () => {
  if (autoUpdater && isUpdateDownloaded) {
    autoUpdater.quitAndInstall();
  }
});

ipcMain.handle('open-external', async (_event, url) => {
  try {
    if (url && typeof url === 'string') {
      await shell.openExternal(url);
      return { success: true };
    }
    return { success: false, error: 'Invalid URL' };
  } catch (err) {
    console.error('Failed to open external URL:', err);
    return { success: false, error: err.message };
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
