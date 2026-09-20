const fs = require('fs');
const path = require('path');
const https = require('https');
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
console.log('\n🔨 Building web/client assets...');
execSync('npm --prefix client run build', { stdio: 'inherit', cwd: rootDir });

// 9. Commit & tag & push git first
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

// 10. Package installer locally
console.log('\n📦 Packaging Windows Setup EXE & latest.yml locally...');
execSync('npx electron-builder --win', { stdio: 'inherit', cwd: rootDir });

const distDir = path.join(rootDir, 'dist_installer');
const hyphenExe = path.join(distDir, `Video-Pilot-Pro-Setup-${newVersion}.exe`);
const spacedExe = path.join(distDir, `Video Pilot Pro Setup ${newVersion}.exe`);

if (fs.existsSync(spacedExe) && !fs.existsSync(hyphenExe)) {
  fs.copyFileSync(spacedExe, hyphenExe);
} else if (fs.existsSync(hyphenExe) && !fs.existsSync(spacedExe)) {
  fs.copyFileSync(hyphenExe, spacedExe);
}

// 11. GitHub Release Helper Functions
function ghApi(urlPath, method, token, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: urlPath,
      method,
      headers: {
        'User-Agent': 'VideoPilotPro-ReleasePipeline',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function uploadAsset(uploadUrlTemplate, filePath, fileName, token) {
  return new Promise((resolve, reject) => {
    const uploadUrl = new URL(uploadUrlTemplate.replace(/\{.*\}/, ''));
    uploadUrl.searchParams.set('name', fileName);

    const stats = fs.statSync(filePath);
    const totalBytes = stats.size;
    let uploadedBytes = 0;

    const req = https.request({
      protocol: uploadUrl.protocol,
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'POST',
      headers: {
        'User-Agent': 'VideoPilotPro-ReleasePipeline',
        'Authorization': `token ${token}`,
        'Content-Type': fileName.endsWith('.exe') ? 'application/octet-stream' : 'text/plain',
        'Content-Length': totalBytes
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`\n   ✓ Uploaded ${fileName} successfully (${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`);
          resolve(data);
        } else {
          reject(new Error(`Upload failed for ${fileName} [HTTP ${res.statusCode}]: ${data}`));
        }
      });
    });

    req.on('error', reject);

    const fileStream = fs.createReadStream(filePath);
    let lastLog = 0;

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const now = Date.now();
      if (now - lastLog > 1500 || uploadedBytes === totalBytes) {
        lastLog = now;
        const pct = Math.round((uploadedBytes / totalBytes) * 100);
        const mb = (uploadedBytes / (1024 * 1024)).toFixed(1);
        const tot = (totalBytes / (1024 * 1024)).toFixed(1);
        process.stdout.write(`\r   ⏳ Uploading ${fileName}: ${pct}% (${mb} MB / ${tot} MB)...`);
      }
    });

    fileStream.pipe(req);
  });
}

async function publishToGitHub(version, token) {
  const tagName = `v${version}`;
  console.log(`\n📡 Connecting to GitHub Releases for ${tagName}...`);

  let release = null;
  try {
    release = await ghApi(`/repos/PhelobaterFady/VideoPilotPRO/releases/tags/${tagName}`, 'GET', token);
  } catch (e) {}

  if (!release || !release.id) {
    console.log(`Creating GitHub release for ${tagName}...`);
    release = await ghApi('/repos/PhelobaterFady/VideoPilotPRO/releases', 'POST', token, {
      tag_name: tagName,
      name: `Video Pilot Pro ${tagName}`,
      body: `Video Pilot Pro ${tagName}\n\n- In-app auto-updater engine (no browser redirects)\n- High performance live download telemetry\n- Universal formats converter studio\n- Universal media downloader for YouTube, TikTok, and Instagram`,
      draft: false,
      prerelease: false
    });
  }

  console.log(`✓ Release active (ID: ${release.id})`);

  const files = [
    `Video-Pilot-Pro-Setup-${version}.exe`,
    `Video-Pilot-Pro-Setup-${version}.exe.blockmap`,
    'latest.yml'
  ];

  for (const f of files) {
    const p = path.join(distDir, f);
    if (!fs.existsSync(p)) {
      console.warn(`File ${f} not found in dist_installer, skipping.`);
      continue;
    }

    // Check if asset already exists in release
    const existing = (release.assets || []).find(a => a.name === f);
    if (existing) {
      console.log(`Replacing existing asset ${f}...`);
      try {
        await ghApi(`/repos/PhelobaterFady/VideoPilotPRO/releases/assets/${existing.id}`, 'DELETE', token);
      } catch (err) {}
    }

    await uploadAsset(release.upload_url, p, f, token);
  }

  // Ensure release is public
  try {
    await ghApi(`/repos/PhelobaterFady/VideoPilotPRO/releases/${release.id}`, 'PATCH', token, {
      draft: false
    });
  } catch (e) {}

  console.log(`\n🎉 SUCCESS: All assets published to GitHub Release ${tagName}!`);
}

// Run release publish if token is available
if (ghToken) {
  publishToGitHub(newVersion, ghToken)
    .then(() => {
      console.log(`\n======================================================`);
      console.log(`🎉 Automated Release v${newVersion} is 100% Complete!`);
      console.log(`🚀 All desktop users will receive the update automatically.`);
      console.log(`======================================================\n`);
    })
    .catch((err) => {
      console.error('\n❌ GitHub Upload Error:', err.message);
      process.exit(1);
    });
} else {
  console.log(`\n======================================================`);
  console.log(`🎉 Build Complete: Files generated in dist_installer/`);
  console.log(`   - Video-Pilot-Pro-Setup-${newVersion}.exe`);
  console.log(`   - latest.yml`);
  console.log(`👉 Attach them to: https://github.com/PhelobaterFady/VideoPilotPRO/releases/edit/v${newVersion}`);
  console.log(`======================================================\n`);
}
