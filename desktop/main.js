const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

let autoUpdater = null;
let isUpdateDownloaded = false;
let tray = null;
let isQuitting = false;

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

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, 'icon.png');
  if (fs.existsSync(iconPath)) {
    try {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open VideoPilot Pro',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.webContents.send('check-for-updates');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit VideoPilot Pro',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]);
      tray.setToolTip('VideoPilot Pro Universal Downloader');
      tray.setContextMenu(contextMenu);
      tray.on('double-click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    } catch (e) {
      console.warn('Could not initialize system tray:', e.message);
    }
  }
}

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

  mainWindow.on('close', (event) => {
    if (!isQuitting && tray) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  createTray();

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

ipcMain.handle('show-in-folder', async (_event, filePath) => {
  try {
    if (filePath && typeof filePath === 'string') {
      const cleanPath = path.normalize(filePath);
      if (fs.existsSync(cleanPath)) {
        shell.showItemInFolder(cleanPath);
        return { success: true };
      }
      const parentDir = path.dirname(cleanPath);
      if (fs.existsSync(parentDir)) {
        shell.openPath(parentDir);
        return { success: true };
      }
    }
    return { success: false, error: 'Target file or folder not found on disk' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-file', async (_event, filePath) => {
  try {
    if (filePath && typeof filePath === 'string') {
      const cleanPath = path.normalize(filePath);
      if (fs.existsSync(cleanPath)) {
        const errorMsg = await shell.openPath(cleanPath);
        return { success: !errorMsg, error: errorMsg || null };
      }
    }
    return { success: false, error: 'File does not exist on disk' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('show-notification', async (_event, payload) => {
  try {
    if (Notification.isSupported()) {
      const iconPath = path.join(__dirname, 'icon.png');
      const notif = new Notification({
        title: payload?.title || 'VideoPilot Pro',
        body: payload?.body || 'Media download completed successfully!',
        icon: fs.existsSync(iconPath) ? iconPath : undefined
      });
      notif.show();
      return { success: true };
    }
    return { success: false, reason: 'Notifications not supported' };
  } catch (e) {
    return { success: false, error: e.message };
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
ipcMain.on('window-close', () => {
  if (tray) {
    mainWindow?.hide();
  } else {
    mainWindow?.close();
  }
});

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
    else mainWindow?.show();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) app.quit();
});
