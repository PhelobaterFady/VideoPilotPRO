const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getMediaInfo, downloadMediaToFile } = require('./utils/yt');

const app = express();
const PORT = process.env.PORT || 5000;
const APP_SECRET_KEY = process.env.APP_SECRET_KEY || 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json());

// Application Access Protection Middleware
const requireAppSecret = (req, res, next) => {
  const clientSecret = req.headers['x-app-secret'];
  if (!clientSecret || clientSecret !== APP_SECRET_KEY) {
    return res.status(403).json({ error: 'Access Denied: Direct browser access forbidden. API is restricted exclusively to the VideoPilot Pro Desktop Application.' });
  }
  next();
};

// Health & Version Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'VideoPilot Pro Engine', protection: 'Active', time: new Date().toISOString() });
});

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    latestVersion: '1.0.0',
    downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    changelog: 'VideoPilot Pro Universal Downloader with Auto-Updater Engine'
  });
});

// Fetch Single or Playlist Info (Protected)
app.post('/api/info', requireAppSecret, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid media URL' });
    }

    const cleanUrl = url.trim();
    const info = await getMediaInfo(cleanUrl);
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('API /api/info error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch media information' });
  }
});

// Batch Info Extraction (Protected)
app.post('/api/batch-info', requireAppSecret, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of URLs' });
    }

    const results = await Promise.allSettled(
      urls.slice(0, 10).map(u => getMediaInfo(u.trim()))
    );

    const items = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return { success: true, url: urls[index], data: res.value };
      } else {
        return { success: false, url: urls[index], error: res.reason?.message || 'Failed to process URL' };
      }
    });

    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Batch fetch failed' });
  }
});

// Direct PC File Download Endpoint (Protected)
app.post('/api/download', requireAppSecret, (req, res) => {
  const { url, format, audioOnly, title, outputDir } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  if (!outputDir || typeof outputDir !== 'string' || outputDir.trim() === '') {
    return res.status(400).json({ error: 'Download output folder is not configured. Please select a folder in Settings & Storage.' });
  }

  const isAudio = audioOnly === true || audioOnly === 'true' || format === 'audio-best';

  downloadMediaToFile(
    url,
    format,
    isAudio,
    title,
    outputDir.trim(),
    (prog) => {
      // Progress callback
    },
    () => {
      if (!res.headersSent) {
        res.json({ success: true, message: `Successfully saved to ${outputDir}` });
      }
    },
    (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Failed during download process' });
      }
    }
  );
});

// Serve Client Static Build Files
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`🚀 VideoPilot Pro Engine running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is already in use, reusing active server instance`);
  } else {
    console.error('Express server error:', err);
  }
});
