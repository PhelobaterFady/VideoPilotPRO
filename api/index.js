const express = require('express');
const cors = require('cors');
const { getMediaInfo, downloadMediaToFile } = require('../server/utils/yt');

const app = express();
const APP_SECRET_KEY = process.env.APP_SECRET_KEY || 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json());

const requireAppSecret = (req, res, next) => {
  const clientSecret = req.headers['x-app-secret'];
  if (!clientSecret || clientSecret !== APP_SECRET_KEY) {
    return res.status(403).json({ error: 'Access Denied: Restricted to VideoPilot Pro Application.' });
  }
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'VideoPilot Pro Vercel API', time: new Date().toISOString() });
});

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    latestVersion: '1.0.0',
    downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    changelog: 'VideoPilot Pro Universal Downloader with Auto-Updater Engine'
  });
});

app.post('/api/info', requireAppSecret, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid media URL' });
    }
    const info = await getMediaInfo(url.trim());
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch media metadata' });
  }
});

app.post('/api/batch-info', requireAppSecret, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of URLs' });
    }
    const results = await Promise.allSettled(
      urls.slice(0, 10).map(u => getMediaInfo(u.trim()))
    );
    const items = results.map((r, index) => 
      r.status === 'fulfilled' 
        ? { success: true, url: urls[index], data: r.value } 
        : { success: false, url: urls[index], error: r.reason?.message }
    );
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/download', requireAppSecret, (req, res) => {
  const { url, format, audioOnly, title, outputDir } = req.body;
  if (!url || !outputDir) {
    return res.status(400).json({ error: 'URL and outputDir parameters are required' });
  }
  const isAudio = audioOnly === true || audioOnly === 'true' || format === 'audio-best';
  downloadMediaToFile(
    url, format, isAudio, title, outputDir.trim(),
    () => {},
    () => { if (!res.headersSent) res.json({ success: true, message: `Successfully saved to ${outputDir}` }); },
    (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); }
  );
});

module.exports = app;
