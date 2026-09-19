const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getMediaInfo, downloadMediaToFile } = require('./utils/yt');

const app = express();
const PORT = process.env.PORT || 5000;
const APP_SECRET = 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
    latestVersion: process.env.LATEST_VERSION || '1.2.0',
    currentVersion: '1.2.0',
    downloadUrl: process.env.DOWNLOAD_URL || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
    releaseNotes: 'Added full YouTube Playlist downloader with multi-track batch extraction, audio/video selection, and improved stability.',
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
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    console.log('Fetching media info for:', url);
    const mediaData = await getMediaInfo(url);
    return res.json({ success: true, data: mediaData });
  } catch (error) {
    console.error('Error fetching media info:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to fetch media details' });
  }
});

// Batch media info extraction endpoint
app.post('/api/batch-info', verifyAppSecret, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'List of URLs is required' });
    }

    console.log(`Processing batch of ${urls.length} links...`);
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
    console.error('Error in batch info:', error.message);
    return res.status(500).json({ error: error.message || 'Batch extraction failed' });
  }
});

// Direct download execution endpoint
app.post('/api/download', verifyAppSecret, async (req, res) => {
  try {
    const { url, format, audioOnly, title, outputDir, subtitleLang } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Starting download: "${title}" [AudioOnly: ${audioOnly}] to: ${outputDir || 'Default'}`);

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
    console.error('Download execution error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to complete download' });
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
