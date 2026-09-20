const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getMediaInfo, downloadMediaToFile, extractTranscript, downloadThumbnailFile, compressVideo, grabVideoFrame, testCookieAuth, reformatToVertical, convertMediaFormat, killProcessTree } = require('./utils/yt');

let QRCode = null;
try {
  QRCode = require('qrcode');
} catch (e) {
  console.warn('qrcode module not found, fallback enabled');
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const app = express();
const PORT = process.env.PORT || 5000;
const APP_SECRET = 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Active downloads map: id -> { id, params, status, proc, progress }
const activeDownloads = new Map();

// Active mobile Wi-Fi transfers: token -> { filePath, fileName, title, timestamp }
const activeTransfers = new Map();

// SSE Connected Clients for Real-time Progress Broadcasting
const sseClients = new Set();

function broadcastProgress(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Version Endpoint
app.get('/api/version', (req, res) => {
  res.json({
    latestVersion: process.env.LATEST_VERSION || '1.3.4',
    currentVersion: '1.3.4',
    downloadUrl: process.env.DOWNLOAD_URL || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    releaseNotes: 'Performance enhancements and seamless in-app auto updater.',
    releaseDate: '2026-09-20',
    mandatory: false
  });
});

// Server-Sent Events Endpoint for live percentage, speed & ETA
app.get('/api/download/progress-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  sseClients.add(res);

  // Send initial state of any current downloads
  for (const [id, item] of activeDownloads.entries()) {
    if (item.progress) {
      res.write(`data: ${JSON.stringify({ id, ...item.progress, status: item.status })}\n\n`);
    }
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Express server EADDRINUSE resilience logic
let server = null;

// Auth middleware for security
const verifyAppSecret = (req, res, next) => {
  const secret = req.headers['x-app-secret'];
  if (secret === APP_SECRET) {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized request: Invalid app secret' });
};

// Application Version & Update Endpoint (Hybrid Update Support)
app.get('/api/version', (req, res) => {
  res.json({
    latestVersion: process.env.LATEST_VERSION || '1.3.2',
    currentVersion: '1.3.2',
    downloadUrl: process.env.DOWNLOAD_URL || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    releaseNotes: 'Added Convertors Studio (Auto 9:16 Shorts/Reels/TikTok smart canvas & universal format transcoder) and engine performance updates.',
    releaseDate: '2026-09-20',
    mandatory: false
  });
});

// Media streaming endpoint supporting HTTP 206 Partial Content (instant in-app playback & scrubbing)
app.get('/api/stream', (req, res) => {
  try {
    const rawFilePath = req.query.file;
    if (!rawFilePath) {
      return res.status(400).send('File path parameter is required');
    }

    const decodedPath = decodeURIComponent(rawFilePath);
    const normalizedPath = path.normalize(decodedPath);

    if (!fs.existsSync(normalizedPath)) {
      console.warn('Stream file not found:', normalizedPath);
      return res.status(404).send('File not found on disk');
    }

    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(normalizedPath).toLowerCase();
    const mimeMap = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac'
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(normalizedPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(normalizedPath).pipe(res);
    }
  } catch (err) {
    console.error('Streaming error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Streaming error: ' + err.message);
    }
  }
});

// Single media info extraction endpoint
app.post('/api/info', verifyAppSecret, async (req, res) => {
  try {
    const { url, cookiesFromBrowser, cookiesFile } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    console.log('Fetching media info for:', url, cookiesFromBrowser ? `[Cookies: ${cookiesFromBrowser}]` : (cookiesFile ? `[CookieFile: ${cookiesFile}]` : ''));
    const mediaData = await getMediaInfo(url, { cookiesFromBrowser, cookiesFile });
    return res.json({ success: true, data: mediaData });
  } catch (error) {
    console.error('Error fetching media info:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to fetch media details' });
  }
});

// Batch media info extraction endpoint
app.post('/api/batch-info', verifyAppSecret, async (req, res) => {
  try {
    const { urls, cookiesFromBrowser, cookiesFile } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'List of URLs is required' });
    }

    console.log(`Processing batch of ${urls.length} links...`);
    const results = await Promise.allSettled(
      urls.map(url => getMediaInfo(url.trim(), { cookiesFromBrowser, cookiesFile }))
    );

    const formatted = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return { url: urls[index], success: true, data: res.value };
      } else {
        return { url: urls[index], success: false, error: res.reason?.message || 'Extraction failed' };
      }
    });

    return res.json({ success: true, items: formatted });
  } catch (error) {
    console.error('Error in batch info:', error.message);
    return res.status(500).json({ error: error.message || 'Batch extraction failed' });
  }
});

// Direct download execution endpoint
app.post('/api/download', verifyAppSecret, async (req, res) => {
  try {
    const {
      id,
      url,
      format,
      audioOnly,
      title,
      outputDir,
      subtitleLang,
      limitRate,
      clipStart,
      clipEnd,
      sortMode,
      turboStreams,
      embedMetadata,
      audioBoost,
      playbackSpeed,
      uploader,
      cookiesFromBrowser,
      cookiesFile
    } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const downloadId = id || `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const downloadParams = {
      url,
      format,
      audioOnly: !!audioOnly,
      title,
      outputDir,
      subtitleLang,
      limitRate,
      clipStart,
      clipEnd,
      sortMode: sortMode || 'flat',
      turboStreams: turboStreams || 16,
      embedMetadata: embedMetadata !== undefined ? !!embedMetadata : true,
      audioBoost: audioBoost || 'none',
      playbackSpeed: playbackSpeed || 1.0,
      uploader: uploader || '',
      cookiesFromBrowser: cookiesFromBrowser || 'none',
      cookiesFile: cookiesFile || null
    };

    activeDownloads.set(downloadId, {
      id: downloadId,
      params: downloadParams,
      status: 'downloading',
      proc: null,
      progress: { percent: 5, speed: 'Starting...', eta: '--:--' }
    });

    broadcastProgress({ id: downloadId, status: 'downloading', percent: 5, speed: 'Connecting...', eta: '--:--' });

    console.log(`Starting download: "${title}" [ID: ${downloadId}, Streams: ${downloadParams.turboStreams}, SpeedRate: ${downloadParams.playbackSpeed}x, Sort: ${downloadParams.sortMode}]`);

    const result = await downloadMediaToFile({
      ...downloadParams,
      onProcessStart: (proc) => {
        const item = activeDownloads.get(downloadId);
        if (item) item.proc = proc;
      },
      onProgress: (prog) => {
        const item = activeDownloads.get(downloadId);
        if (item && item.status === 'downloading') {
          item.progress = prog;
          broadcastProgress({ id: downloadId, ...prog, status: 'downloading' });
        }
      }
    });

    if (result.killed) {
      console.log(`Download execution stopped by user: ${downloadId} -> ${result.status}`);
      return res.json({
        success: false,
        status: result.status,
        message: `Download was ${result.status}`
      });
    }

    activeDownloads.delete(downloadId);
    broadcastProgress({ id: downloadId, status: 'completed', percent: 100, speed: 'Saved', eta: '0:00' });

    return res.json({
      success: true,
      message: 'Download completed successfully',
      filePath: result.filePath
    });
  } catch (error) {
    console.error('Download execution error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to complete download' });
  }
});

// Pause download endpoint
app.post('/api/download/pause', verifyAppSecret, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Download ID is required' });

  const item = activeDownloads.get(id);
  if (item) {
    item.status = 'paused';
    if (item.proc) {
      item.proc._userKilled = true;
      item.proc._userAction = 'paused';
      killProcessTree(item.proc.pid);
    }
  }

  broadcastProgress({ id, status: 'paused', speed: 'Paused' });
  return res.json({ success: true, message: 'Download paused' });
});

// Resume download endpoint
app.post('/api/download/resume', verifyAppSecret, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Download ID is required' });

  const item = activeDownloads.get(id);
  if (!item || !item.params) {
    return res.status(404).json({ error: 'No paused download parameters found for this ID' });
  }

  item.status = 'downloading';
  broadcastProgress({ id, status: 'downloading', speed: 'Resuming...', eta: '--:--' });

  try {
    const result = await downloadMediaToFile({
      ...item.params,
      onProcessStart: (proc) => {
        item.proc = proc;
      },
      onProgress: (prog) => {
        if (item.status === 'downloading') {
          item.progress = prog;
          broadcastProgress({ id, ...prog, status: 'downloading' });
        }
      }
    });

    if (result.killed) {
      return res.json({ success: false, status: result.status });
    }

    activeDownloads.delete(id);
    broadcastProgress({ id, status: 'completed', percent: 100, speed: 'Saved', eta: '0:00' });

    return res.json({
      success: true,
      message: 'Download resumed and completed',
      filePath: result.filePath
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to resume download' });
  }
});

// Cancel download endpoint
app.post('/api/download/cancel', verifyAppSecret, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Download ID is required' });

  const item = activeDownloads.get(id);
  if (item) {
    item.status = 'cancelled';
    if (item.proc) {
      item.proc._userKilled = true;
      item.proc._userAction = 'cancelled';
      killProcessTree(item.proc.pid);
    }
    activeDownloads.delete(id);
  }

  broadcastProgress({ id, status: 'cancelled', speed: 'Cancelled' });
  return res.json({ success: true, message: 'Download cancelled' });
});

// ==========================================
// 📱 QR Wi-Fi Mobile Transfer Endpoints
// ==========================================

// Generate QR code and link for sending local PC file to phone via Wi-Fi
app.post('/api/transfer/generate-qr', verifyAppSecret, async (req, res) => {
  try {
    const { filePath, title } = req.body;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File does not exist on your computer' });
    }

    const token = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileName = path.basename(filePath);
    activeTransfers.set(token, { filePath, fileName, title: title || fileName, timestamp: Date.now() });

    const localIp = getLocalIp();
    const transferUrl = `http://${localIp}:${PORT}/api/transfer/download/${token}`;

    let qrDataUrl = '';
    if (QRCode) {
      qrDataUrl = await QRCode.toDataURL(transferUrl, { width: 320, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    }

    return res.json({
      success: true,
      token,
      transferUrl,
      qrDataUrl,
      fileName,
      localIp
    });
  } catch (error) {
    console.error('Error generating QR:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to generate QR transfer' });
  }
});

// Mobile landing page (accessed directly from phone browser via Wi-Fi)
app.get('/api/transfer/download/:token', (req, res) => {
  const { token } = req.params;
  const transfer = activeTransfers.get(token);

  if (!transfer || !fs.existsSync(transfer.filePath)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Expired - Video Pilot Pro</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #09090b; color: #fff; text-align: center; padding: 40px 20px; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 30px; max-width: 400px; margin: 40px auto; }
          h2 { color: #f43f5e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚠️ Transfer Link Expired</h2>
          <p style="color: #a1a1aa; font-size: 14px;">This file transfer session has expired or the file was moved. Please scan the QR code again from Video Pilot Pro.</p>
        </div>
      </body>
      </html>
    `);
  }

  const fileExt = path.extname(transfer.filePath).toLowerCase();
  const isVideo = ['.mp4', '.mkv', '.webm', '.mov'].includes(fileExt);
  const isAudio = ['.mp3', '.m4a', '.wav', '.aac'].includes(fileExt);
  const stats = fs.statSync(transfer.filePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <title>Video Pilot Pro - Mobile Transfer</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #09090b;
          color: #f4f4f5;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 24px;
          padding: 24px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          text-align: center;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.4;
          margin-bottom: 8px;
          word-break: break-word;
        }
        .meta {
          font-size: 13px;
          color: #a1a1aa;
          margin-bottom: 20px;
        }
        .player-container {
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          margin-bottom: 20px;
          border: 1px solid #27272a;
        }
        video, audio {
          width: 100%;
          display: block;
        }
        .btn-download {
          display: block;
          width: 100%;
          background: #10b981;
          color: #000;
          font-weight: 800;
          font-size: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          text-decoration: none;
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
          transition: transform 0.1s ease, background 0.2s ease;
        }
        .btn-download:active {
          transform: scale(0.98);
          background: #059669;
        }
        .footer {
          margin-top: 20px;
          font-size: 11px;
          color: #71717a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">🚀 Video Pilot Pro Wi-Fi Direct</div>
        <h1>${transfer.fileName}</h1>
        <div class="meta">Size: <strong>${sizeMb} MB</strong> • Local Wi-Fi Speed</div>

        ${isVideo ? `
          <div class="player-container">
            <video controls playsinline preload="metadata">
              <source src="/api/transfer/file/${token}" type="video/mp4">
              Your browser does not support inline video preview.
            </video>
          </div>
        ` : (isAudio ? `
          <div class="player-container" style="padding: 15px;">
            <audio controls>
              <source src="/api/transfer/file/${token}" type="audio/mpeg">
              Your browser does not support audio playback.
            </audio>
          </div>
        ` : '')}

        <a href="/api/transfer/file/${token}" download="${encodeURIComponent(transfer.fileName)}" class="btn-download">
          📥 Save to Phone (تنزيل للموبايل)
        </a>

        <div class="footer">
          Connected via local Wi-Fi • No internet quota consumed
        </div>
      </div>
    </body>
    </html>
  `);
});

// Binary file download endpoint for phone
app.get('/api/transfer/file/:token', (req, res) => {
  const { token } = req.params;
  const transfer = activeTransfers.get(token);

  if (!transfer || !fs.existsSync(transfer.filePath)) {
    return res.status(404).send('File not found or transfer expired');
  }

  return res.download(transfer.filePath, transfer.fileName);
});

// ==========================================
// 📝 Transcript & Subtitles Endpoints
// ==========================================

app.post('/api/transcript', verifyAppSecret, async (req, res) => {
  try {
    const { url, lang } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const result = await extractTranscript(url, lang || 'en');
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Transcript error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to extract transcript' });
  }
});

app.post('/api/save-transcript', verifyAppSecret, async (req, res) => {
  try {
    const { title, content, format, outputDir } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const targetDir = outputDir || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeTitle = (title || 'Transcript').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80);
    const ext = format === 'srt' ? 'srt' : 'txt';
    const filePath = path.join(targetDir, `${safeTitle} - Transcript.${ext}`);

    fs.writeFileSync(filePath, content, 'utf-8');
    return res.json({ success: true, filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to save transcript' });
  }
});

// ==========================================
// 🖼️ Ultra HD Thumbnail / Poster Endpoint
// ==========================================

app.post('/api/save-thumbnail', verifyAppSecret, async (req, res) => {
  try {
    const { thumbnailUrl, title, outputDir } = req.body;
    const targetDir = outputDir || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');

    const result = await downloadThumbnailFile(thumbnailUrl, title, targetDir);
    return res.json({ success: true, filePath: result.filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to save thumbnail' });
  }
});

// ==========================================
// 📉 Smart Social Media Compressor Endpoint
// ==========================================
app.post('/api/tools/compress-video', verifyAppSecret, async (req, res) => {
  try {
    const { filePath, targetPreset, customSizeMB, outputDir } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    console.log(`Starting video compression: "${filePath}" with preset: ${targetPreset || 'whatsapp'}`);
    const result = await compressVideo({ inputPath: filePath, targetPreset, customSizeMB, outputDir });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Video compression error:', err.message);
    return res.status(500).json({ error: err.message || 'Video compression failed' });
  }
});

// ==========================================
// 📸 Lossless Photographic Frame Grabber Endpoint
// ==========================================
app.post('/api/tools/frame-grab', verifyAppSecret, async (req, res) => {
  try {
    const { source, timestamp, outputDir, title, cookiesFromBrowser, cookiesFile } = req.body;
    if (!source) {
      return res.status(400).json({ error: 'Source file or URL is required' });
    }

    console.log(`Snapping frame at [${timestamp || '00:00:01'}] from: ${source}`);
    const result = await grabVideoFrame({ source, timestamp, outputDir, title, cookiesFromBrowser, cookiesFile });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Frame grab error:', err.message);
    return res.status(500).json({ error: err.message || 'Frame grab failed' });
  }
});

// ==========================================
// 🔐 Browser Cookies & Session Authenticator
// ==========================================
app.post('/api/tools/test-cookies', verifyAppSecret, async (req, res) => {
  try {
    const { browser, filePath } = req.body;
    console.log(`Testing cookie session auth: [Browser: ${browser || 'none'}, File: ${filePath || 'none'}]`);
    const result = await testCookieAuth({ browser, filePath });
    return res.json(result);
  } catch (err) {
    console.error('Cookie test error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to verify cookies' });
  }
});

app.post('/api/tools/save-cookie-content', verifyAppSecret, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Cookie content is empty' });
    }

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const targetPath = path.join(dataDir, 'cookies.txt');
    fs.writeFileSync(targetPath, content.trim(), 'utf8');

    return res.json({
      success: true,
      filePath: targetPath,
      message: 'cookies.txt saved successfully into application storage!'
    });
  } catch (err) {
    console.error('Save cookie content error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to write cookies file' });
  }
});

// ==========================================
// 📱 9:16 Shorts/Reels Canvas Studio Endpoint
// ==========================================
app.post('/api/tools/reformat-canvas', verifyAppSecret, async (req, res) => {
  try {
    const { inputPath, outputDir, aspect, style, blurRadius, resolution } = req.body;
    if (!inputPath) {
      return res.status(400).json({ error: 'Input video path is required' });
    }

    console.log(`Reformatting canvas to ${aspect || '9:16'} with style ${style || 'blur'} for: "${inputPath}"`);
    const result = await reformatToVertical({ inputPath, outputDir, aspect, style, blurRadius, resolution });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Canvas reformat error:', err.message);
    return res.status(500).json({ error: err.message || 'Canvas reformatting failed' });
  }
});

// ==========================================
// 🔄 Universal Format Converter Endpoint
// ==========================================
app.post('/api/tools/convert-format', verifyAppSecret, async (req, res) => {
  try {
    const { inputPath, outputDir, targetFormat, audioBitrate } = req.body;
    if (!inputPath) {
      return res.status(400).json({ error: 'Input media path is required' });
    }

    console.log(`Converting format to ${targetFormat || 'mp4'} for: "${inputPath}"`);
    const result = await convertMediaFormat({ inputPath, outputDir, targetFormat, audioBitrate });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Format conversion error:', err.message);
    return res.status(500).json({ error: err.message || 'Format conversion failed' });
  }
});

// Serve frontend dist static files in production mode
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

server = app.listen(PORT, () => {
  console.log(`Video Pilot Pro Express Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is already in use by active Video Pilot Pro instance. Continuing backend execution.`);
  } else {
    console.error('Server error:', err);
  }
});
