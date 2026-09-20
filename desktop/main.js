const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');
const { spawn } = require('child_process');

// Ensure the application name is Video Pilot Pro across all system dialogs and task managers
app.name = 'Video Pilot Pro';
app.setName('Video Pilot Pro');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.videopilot.pro');
}

let autoUpdater = null;
let isUpdateDownloaded = false;
let directDownloadedInstallerPath = null;
let tray = null;
let isQuitting = false;

try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.forceDevUpdateConfig = !app.isPackaged;
  autoUpdater.verifyUpdateCodeSignature = false;
  autoUpdater.logger = console;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'PhelobaterFady',
    repo: 'VideoPilotPRO'
  });
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
          label: 'Open Video Pilot Pro',
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
          label: 'Quit Video Pilot Pro',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]);
      tray.setToolTip('Video Pilot Pro');
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
    title: 'Video Pilot Pro',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    backgroundColor: '#09090b',
    show: true
  });

  // Launch application in full screen (maximized)
  mainWindow.maximize();

  const relativeHtmlPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
  const appRootHtmlPath = path.join(app.getAppPath(), 'client', 'dist', 'index.html');

  if (fs.existsSync(relativeHtmlPath)) {
    mainWindow.loadFile(relativeHtmlPath);
  } else if (fs.existsSync(appRootHtmlPath)) {
    mainWindow.loadFile(appRootHtmlPath);
  } else {
    const startUrl = process.env.CLIENT_URL || 'http://localhost:5000';
    mainWindow.loadURL(startUrl);
  }

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
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    mainWindow?.webContents.send('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available event:', info);
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    mainWindow?.webContents.send('update-not-available', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Update download progress: ${Math.round(progressObj.percent)}%`);
    mainWindow?.webContents.send('update-download-progress', {
      percent: Math.round(progressObj.percent || 0),
      bytesPerSecond: progressObj.bytesPerSecond || 0,
      transferred: progressObj.transferred || 0,
      total: progressObj.total || 0
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded event:', info);
    isUpdateDownloaded = true;
    mainWindow?.webContents.send('update-ready', info);
  });

  autoUpdater.on('error', (err) => {
    console.warn('autoUpdater error event:', err?.message || err);
    mainWindow?.webContents.send('update-error', { error: err?.message || 'Update failed' });
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

function downloadInstallerDirect(version) {
  return new Promise((resolve, reject) => {
    const cleanVersion = String(version || '1.3.4').replace(/^v/, '');
    const fileName = `Video-Pilot-Pro-Setup-${cleanVersion}.exe`;
    const targetUrl = `https://github.com/PhelobaterFady/VideoPilotPRO/releases/download/v${cleanVersion}/${fileName}`;
    const destPath = path.join(os.tmpdir(), fileName);
    console.log(`[UpdateFallback] Downloading installer v${cleanVersion} from: ${targetUrl}`);

    const file = fs.createWriteStream(destPath);

    function fetchUrl(currentUrl, redirectCount = 0) {
      if (redirectCount > 5) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error('Too many redirects while downloading update.'));
      }

      https.get(currentUrl, { headers: { 'User-Agent': 'VideoPilotPro-Updater' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location, redirectCount + 1);
        }

        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`Server returned HTTP ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let transferred = 0;

        res.on('data', (chunk) => {
          transferred += chunk.length;
          const percent = totalBytes > 0 ? Math.round((transferred / totalBytes) * 100) : 50;
          mainWindow?.webContents.send('update-download-progress', {
            percent,
            transferred,
            total: totalBytes
          });
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            console.log(`[UpdateFallback] Download complete: ${destPath}`);
            isUpdateDownloaded = true;
            directDownloadedInstallerPath = destPath;
            mainWindow?.webContents.send('update-ready', { version: cleanVersion });
            resolve(destPath);
          });
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    fetchUrl(targetUrl);
  });
}

ipcMain.on('start-download-update', async (_event, data) => {
  const version = data?.version || '1.3.4';
  let updaterStarted = false;

  if (autoUpdater) {
    try {
      console.log('[AutoUpdater] Checking and initiating download...');
      const checkResult = await autoUpdater.checkForUpdates();
      if (checkResult && checkResult.downloadPromise) {
        updaterStarted = true;
        await checkResult.downloadPromise;
      } else {
        await autoUpdater.downloadUpdate();
        updaterStarted = true;
      }
    } catch (e) {
      console.warn('[AutoUpdater] electron-updater error, falling back to direct download:', e.message);
    }
  }

  if (!updaterStarted && !isUpdateDownloaded) {
    try {
      console.log('[AutoUpdater] Starting direct download fallback...');
      await downloadInstallerDirect(version);
    } catch (err) {
      console.error('[AutoUpdater] Direct download failed:', err.message);
      mainWindow?.webContents.send('update-error', { error: err.message });
    }
  }
});

ipcMain.on('restart-and-update', () => {
  if (directDownloadedInstallerPath && fs.existsSync(directDownloadedInstallerPath)) {
    console.log('[AutoUpdater] Launching downloaded installer:', directDownloadedInstallerPath);
    try {
      spawn(directDownloadedInstallerPath, ['--updated'], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      isQuitting = true;
      app.quit();
      return;
    } catch (e) {
      console.error('Failed to spawn downloaded installer:', e);
    }
  }

  if (autoUpdater && isUpdateDownloaded) {
    // false = silent/no-prompt, true = force relaunch app after install
    autoUpdater.quitAndInstall(false, true);
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
        title: payload?.title || 'Video Pilot Pro',
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

ipcMain.handle('select-cookie-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Netscape cookies.txt File',
      properties: ['openFile'],
      filters: [
        { name: 'Netscape Cookie Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (err) {
    console.error('Error selecting cookie file:', err);
    return null;
  }
});

ipcMain.handle('select-video-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Video File for Conversion',
      properties: ['openFile'],
      filters: [
        { name: 'Video & Audio Files', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'mp3', 'wav', 'm4a', 'flac'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (err) {
    console.error('Error selecting video file:', err);
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
