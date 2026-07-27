const { app } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

app.whenReady().then(async () => {
  autoUpdater.logger = console;
  autoUpdater.forceDevUpdateConfig = true; // FORCE dev update check so checkForUpdates runs in all modes!
  
  console.log('[TEST] Electron App initialized. Version:', app.getVersion());

  autoUpdater.on('checking-for-update', () => {
    console.log('[TEST] Checking for update on GitHub...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[TEST] SUCCESS: Update Available!', info.version);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[TEST] Info: App is up to date or no GitHub release found.', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('[TEST] Updater error:', err.message);
  });

  try {
    const res = await autoUpdater.checkForUpdates();
    console.log('[TEST] Check result:', res?.updateInfo?.version || 'Completed');
  } catch (err) {
    console.error('[TEST] Execution catch:', err.message);
  }

  setTimeout(() => app.quit(), 3000);
});
