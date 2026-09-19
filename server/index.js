const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getMediaInfo, downloadMediaToFile, killProcessTree } = require('./utils/yt');

const app = express();
const PORT = process.env.PORT || 5000;
const APP_SECRET = 'VP_PRO_APP_SECRET_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Active downloads map: id -> { id, params, status, proc, progress }
const activeDownloads = new Map();

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
    const { id, url, format, audioOnly, title, outputDir, subtitleLang, limitRate } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const downloadId = id || `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const downloadParams = { url, format, audioOnly: !!audioOnly, title, outputDir, subtitleLang, limitRate };

    activeDownloads.set(downloadId, {
      id: downloadId,
      params: downloadParams,
      status: 'downloading',
      proc: null,
      progress: { percent: 5, speed: 'Starting...', eta: '--:--' }
    });

    broadcastProgress({ id: downloadId, status: 'downloading', percent: 5, speed: 'Connecting...', eta: '--:--' });

    console.log(`Starting download: "${title}" [ID: ${downloadId}, LimitRate: ${limitRate || 'Max'}] to: ${outputDir || 'Default'}`);

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
    return res.json({ success: true, filePath: result.filePath });
  } catch (error) {
    item.status = 'error';
    broadcastProgress({ id, status: 'error', speed: 'Error' });
    return res.status(500).json({ error: error.message });
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
