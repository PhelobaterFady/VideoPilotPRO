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

// 8. Build client to verify
console.log('\n🔨 Verifying frontend build...');
execSync('npm --prefix client run build', { stdio: 'inherit', cwd: rootDir });

// 9. Git commit & tag & push
console.log('\n📦 Committing and pushing release tag to GitHub...');
execSync('git add .', { stdio: 'inherit', cwd: rootDir });
execSync(`git commit -m "Release v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
execSync(`git tag v${newVersion}`, { stdio: 'inherit', cwd: rootDir });
execSync('git push origin main', { stdio: 'inherit', cwd: rootDir });
execSync(`git push origin v${newVersion}`, { stdio: 'inherit', cwd: rootDir });

console.log(`\n🎉 SUCCESS: v${newVersion} pushed to GitHub!`);
console.log(`☁️  GitHub Actions is now automatically building the installer in the cloud and attaching latest.yml!`);
console.log(`📲 All installed user applications will detect v${newVersion} and auto-update automatically!\n`);
