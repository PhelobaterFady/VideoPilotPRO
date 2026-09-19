const express = require('express');
const cors = require('cors');
const { getMediaInfo, downloadMediaToFile } = require('../server/utils/yt');

const app = express();
const APP_SECRET = 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const verifyAppSecret = (req, res, next) => {
  const secret = req.headers['x-app-secret'];
  if (secret === APP_SECRET) {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized request: Invalid app secret' });
};

app.get('/api/version', (req, res) => {
  res.json({
    latestVersion: process.env.LATEST_VERSION || '1.2.0',
    currentVersion: '1.2.0',
    downloadUrl: process.env.DOWNLOAD_URL || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    releaseNotes: 'Added full YouTube Playlist downloader with multi-track batch extraction, audio/video selection, and improved stability.',
    releaseDate: '2026-09-20',
    mandatory: false
  });
});

app.post('/api/info', verifyAppSecret, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Media URL is required' });
    }
    const mediaData = await getMediaInfo(url);
    return res.json({ success: true, data: mediaData });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch media details' });
  }
});

app.post('/api/batch-info', verifyAppSecret, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'List of URLs is required' });
    }

    const results = await Promise.allSettled(
      urls.map(url => getMediaInfo(url.trim()))
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
    return res.status(500).json({ error: error.message || 'Batch extraction failed' });
  }
});

app.post('/api/download', verifyAppSecret, async (req, res) => {
  try {
    const { url, format, audioOnly, title, outputDir, subtitleLang } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await downloadMediaToFile({
      url,
      format,
      audioOnly: !!audioOnly,
      title,
      outputDir,
      subtitleLang
    });

    return res.json({
      success: true,
      message: 'Download completed successfully',
      filePath: result.filePath
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to complete download' });
  }
});

module.exports = app;
