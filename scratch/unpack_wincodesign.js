const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const targetDir = path.join(cacheDir, 'winCodeSign-2.6.0');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Find any downloaded 7z file in cacheDir
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.7z'));

if (files.length > 0) {
  const zipFile = path.join(cacheDir, files[0]);
  const z7Path = path.join(__dirname, '..', 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

  console.log(`Extracting ${zipFile} to ${targetDir}...`);
  try {
    // -snl- skips symlink creation, resolving Windows privilege error completely
    execSync(`"${z7Path}" x -snl- -bd -y "${zipFile}" "-o${targetDir}"`, { stdio: 'inherit' });
    console.log('Successfully extracted winCodeSign-2.6.0 without symlink errors!');
  } catch (err) {
    console.error('Extraction warning:', err.message);
  }
} else {
  console.log('No .7z files found in cache yet.');
}
