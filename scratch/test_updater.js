const { autoUpdater } = require('electron-updater');
const path = require('path');

// Set log level to debug
autoUpdater.logger = console;
autoUpdater.currentVersion = '1.0.0'; // Simulate older installed version 1.0.0

console.log('Starting offline/online electron-updater verification test...');
console.log('Current App Version simulated:', autoUpdater.currentVersion);

autoUpdater.on('checking-for-update', () => {
  console.log('[TEST] Event: Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[TEST] SUCCESS! Event: Update Available!', info.version);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[TEST] Event: Update Not Available (App up to date).', info.version);
});

autoUpdater.on('error', (err) => {
  console.error('[TEST] Event: Updater Error:', err.message);
});

autoUpdater.checkForUpdates().then((result) => {
  console.log('[TEST] Check finished. Result version:', result?.updateInfo?.version || 'None');
  process.exit(0);
}).catch((err) => {
  console.error('[TEST] Check failed:', err.message);
  process.exit(1);
});
