const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const appTsxPath = path.join(rootDir, 'client', 'src', 'App.tsx');
const serverIndexPath = path.join(rootDir, 'server', 'index.js');
const apiIndexPath = path.join(rootDir, 'api', 'index.js');
const settingsViewPath = path.join(rootDir, 'client', 'src', 'components', 'SettingsView.tsx');
const statusBarPath = path.join(rootDir, 'client', 'src', 'components', 'StatusBar.tsx');
const envPath = path.join(rootDir, '.env');

// Read GH_TOKEN from .env if present
let ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
if (!ghToken && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^GH_TOKEN=(.*)$/m) || envContent.match(/^GITHUB_TOKEN=(.*)$/m);
  if (match) {
    ghToken = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

// 1. Determine target version
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version || '1.3.1';
let newVersion = process.argv[2];

if (!newVersion) {
  const parts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);
  parts[2] = (parts[2] || 0) + 1;
  newVersion = parts.join('.');
} else {
  newVersion = newVersion.replace(/^v/, '');
}

console.log(`\n========================================`);
console.log(`🚀 Video Pilot Pro Release Pipeline`);
console.log(`   From: v${currentVersion}`);
console.log(`   To:   v${newVersion}`);
console.log(`========================================\n`);

// 2. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`✓ Updated package.json to v${newVersion}`);

// 3. Update client/src/App.tsx
if (fs.existsSync(appTsxPath)) {
  let content = fs.readFileSync(appTsxPath, 'utf8');
  content = content.replace(/const CURRENT_VERSION = '.*?';/, `const CURRENT_VERSION = '${newVersion}';`);
  fs.writeFileSync(appTsxPath, content, 'utf8');
  console.log(`✓ Updated client/src/App.tsx`);
}

// 4. Update server/index.js
if (fs.existsSync(serverIndexPath)) {
  let content = fs.readFileSync(serverIndexPath, 'utf8');
  content = content.replace(/latestVersion: process\.env\.LATEST_VERSION \|\| '.*?',/, `latestVersion: process.env.LATEST_VERSION || '${newVersion}',`);
  content = content.replace(/currentVersion: '.*?',/, `currentVersion: '${newVersion}',`);
  fs.writeFileSync(serverIndexPath, content, 'utf8');
  console.log(`✓ Updated server/index.js`);
}

// 5. Update api/index.js
if (fs.existsSync(apiIndexPath)) {
  let content = fs.readFileSync(apiIndexPath, 'utf8');
  content = content.replace(/latestVersion: process\.env\.LATEST_VERSION \|\| '.*?',/, `latestVersion: process.env.LATEST_VERSION || '${newVersion}',`);
  content = content.replace(/currentVersion: '.*?',/, `currentVersion: '${newVersion}',`);
  fs.writeFileSync(apiIndexPath, content, 'utf8');
  console.log(`✓ Updated api/index.js`);
}

// 6. Update SettingsView.tsx
if (fs.existsSync(settingsViewPath)) {
  let content = fs.readFileSync(settingsViewPath, 'utf8');
  content = content.replace(/currentVersion = '.*?',/, `currentVersion = '${newVersion}',`);
  fs.writeFileSync(settingsViewPath, content, 'utf8');
  console.log(`✓ Updated SettingsView.tsx`);
}

// 7. Update StatusBar.tsx
if (fs.existsSync(statusBarPath)) {
  let content = fs.readFileSync(statusBarPath, 'utf8');
  content = content.replace(/version = '.*?'/, `version = '${newVersion}'`);
  fs.writeFileSync(statusBarPath, content, 'utf8');
  console.log(`✓ Updated StatusBar.tsx`);
}

// 8. Build client
console.log('\n🔨 Building and packaging Windows application...');
execSync('npm --prefix client run build', { stdio: 'inherit', cwd: rootDir });

// 9. Build installer locally
if (ghToken) {
  console.log('\n📡 GH_TOKEN detected! Building and publishing directly to GitHub Releases...');
  execSync('npx electron-builder --win --publish always', {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, GH_TOKEN: ghToken, GITHUB_TOKEN: ghToken }
  });
  console.log(`\n🎉 Uploaded v${newVersion} installer & latest.yml directly to GitHub Releases!`);
} else {
  console.log('\n📦 Packaging Windows Setup EXE & latest.yml locally...');
  execSync('npx electron-builder --win', { stdio: 'inherit', cwd: rootDir });
  
  // Make hyphenated copy
  const distDir = path.join(rootDir, 'dist_installer');
  const originalExe = path.join(distDir, `Video Pilot Pro Setup ${newVersion}.exe`);
  const hyphenExe = path.join(distDir, `Video-Pilot-Pro-Setup-${newVersion}.exe`);
  if (fs.existsSync(originalExe)) {
    fs.copyFileSync(originalExe, hyphenExe);
  }
}

// 10. Git commit & tag & push
console.log('\n📦 Committing and pushing release tag to GitHub...');
execSync('git add .', { stdio: 'inherit', cwd: rootDir });
try {
  execSync(`git commit -m "Release v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
} catch (e) {}

try {
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
} catch (e) {}

execSync('git push origin main', { stdio: 'inherit', cwd: rootDir });
try {
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit', cwd: rootDir });
} catch (e) {}

console.log(`\n======================================================`);
console.log(`🎉 SUCCESS: Release v${newVersion} is Ready!`);
if (ghToken) {
  console.log(`🚀 Automated Release complete! All users will receive the update automatically.`);
} else {
  console.log(`📦 Files generated in: dist_installer/`);
  console.log(`   - Video-Pilot-Pro-Setup-${newVersion}.exe`);
  console.log(`   - latest.yml`);
  console.log(`👉 Attach them to: https://github.com/PhelobaterFady/VideoPilotPRO/releases/edit/v${newVersion}`);
  console.log(`💡 TIP: To make uploads 100% automatic from your PC, create a free token at:`);
  console.log(`   https://github.com/settings/tokens/new (select 'repo' scope)`);
  console.log(`   and save it in .env as GH_TOKEN=your_token`);
}
console.log(`======================================================\n`);
