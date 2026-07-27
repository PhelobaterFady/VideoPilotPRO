const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Application Version Endpoint
app.get('/api/version', (req, res) => {
  res.json({
    latestVersion: '1.1.0',
    downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest'
  });
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
    const { url, format, audioOnly, title, outputDir } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Starting download: "${title}" [AudioOnly: ${audioOnly}] to: ${outputDir || 'Default'}`);

    const result = await downloadMediaToFile({
      url,
      format,
      audioOnly: !!audioOnly,
      title,
      outputDir
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
  console.log(`VideoPilot Pro Express Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is already in use by active VideoPilot Pro instance. Continuing backend execution.`);
  } else {
    console.error('Server error:', err);
  }
});
