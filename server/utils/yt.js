const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
  if (typeof ffmpegPath === 'string') {
    // Unpack ASAR path for Electron production builds
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
  }
} catch (e) {
  console.warn('ffmpeg-static module not found, relying on system ffmpeg');
}

/**
 * Detect social platform from URL
 */
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.gg')) return 'facebook';
  return 'unknown';
}

/**
 * Parse yt-dlp stdout progress line
 */
function parseProgressLine(line) {
  try {
    const percentMatch = line.match(/(\d+\.\d+)%/);
    const speedMatch = line.match(/at\s+([\d\.\w\/]+)/);
    const etaMatch = line.match(/ETA\s+([\d:]+)/);

    return {
      percent: percentMatch ? parseFloat(percentMatch[1]) : null,
      speed: speedMatch ? speedMatch[1] : null,
      eta: etaMatch ? etaMatch[1] : null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Get detailed media information using yt-dlp with robust Facebook & Social User-Agent
 */
function getMediaInfo(url) {
  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '-J',
      '--no-warnings',
      '--no-call-home',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      '--referer', 'https://www.google.com/',
      url
    ];

    if (url.includes('list=') || url.includes('playlist')) {
      args.push('--flat-playlist');
    }

    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      args.push('--ffmpeg-location', ffmpegPath);
    }

    execFile('python', args, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`yt-dlp info error for [${url}]:`, stderr || error.message);
        
        // Fallback for short links / Facebook reels
        return resolve({
          type: 'video',
          platform,
          id: `vid_${Date.now()}`,
          title: `${platform.toUpperCase()} Media Video`,
          description: '',
          uploader: platform.toUpperCase(),
          duration: 0,
          thumbnail: '',
          webpage_url: url,
          formats: [{ formatId: 'best', label: 'Video MP4 Best Quality', ext: 'mp4', quality: 'Best', isVideo: true }]
        });
      }

      try {
        const data = JSON.parse(stdout);
        const isPlaylist = data._type === 'playlist' || (Array.isArray(data.entries) && data.entries.length > 0);

        if (isPlaylist) {
          const items = (data.entries || []).map((entry, index) => ({
            id: entry.id || `item_${index}`,
            title: entry.title || `Track ${index + 1}`,
            url: entry.url || entry.webpage_url || url,
            duration: entry.duration || 0,
            uploader: entry.uploader || entry.channel || data.title || 'Unknown',
            thumbnail: entry.thumbnail || (entry.thumbnails && entry.thumbnails[0] ? entry.thumbnails[0].url : '') || data.thumbnail || ''
          }));

          return resolve({
            type: 'playlist',
            platform,
            id: data.id,
            title: data.title || 'Playlist',
            itemCount: items.length,
            thumbnail: data.thumbnail || (items[0] ? items[0].thumbnail : ''),
            items
          });
        }

        const isShort = url.includes('/shorts/') || url.includes('/reel/') || (data.duration && data.duration <= 60);

        const formats = [];
        formats.push({ formatId: 'audio-best', label: 'Audio MP3 High Quality (320kbps)', ext: 'mp3', quality: '320kbps', isVideo: false });
        formats.push({ formatId: 'best', label: 'Video MP4 Best Quality', ext: 'mp4', quality: 'Best', isVideo: true });

        resolve({
          type: isShort ? 'short' : 'video',
          platform,
          id: data.id || `vid_${Date.now()}`,
          title: data.title || `${platform.toUpperCase()} Video`,
          description: data.description ? data.description.slice(0, 200) : '',
          uploader: data.uploader || data.channel || data.uploader_id || platform.toUpperCase(),
          duration: data.duration || 0,
          thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails.length ? data.thumbnails[data.thumbnails.length - 1].url : ''),
          webpage_url: data.webpage_url || url,
          formats
        });
      } catch (parseErr) {
        // Fallback for parse errors
        resolve({
          type: 'video',
          platform,
          id: `vid_${Date.now()}`,
          title: `${platform.toUpperCase()} Media Video`,
          description: '',
          uploader: platform,
          duration: 0,
          thumbnail: '',
          webpage_url: url,
          formats: [{ formatId: 'best', label: 'Video MP4 Best Quality', ext: 'mp4', quality: 'Best', isVideo: true }]
        });
      }
    });
  });
}

/**
 * Download file directly into specified PC output directory with robust MP3 extraction
 */
function downloadMediaToFile(url, format, isAudio, title, outputDir, onProgress, onComplete, onError) {
  const args = [
    '-m', 'yt_dlp',
    '--js-runtimes', 'node',
    '--newline',
    '--no-warnings',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    '--referer', 'https://www.google.com/'
  ];

  const hasFfmpeg = ffmpegPath && fs.existsSync(ffmpegPath);
  if (hasFfmpeg) {
    args.push('--ffmpeg-location', ffmpegPath);
  }

  if (isAudio || format === 'audio-best') {
    if (hasFfmpeg) {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      args.push('-f', 'ba/b');
    }
  } else {
    args.push('-f', 'b/best');
  }

  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      console.warn('Could not create directory:', e.message);
    }
  }

  const outputPath = path.join(outputDir, '%(title)s.%(ext)s').replace(/\\/g, '/');
  args.push('-o', outputPath);
  args.push(url);

  console.log(`Starting download: ${url} -> ${outputPath}`);

  const proc = spawn('python', args);

  const handleData = (data) => {
    const text = data.toString();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('[download]')) {
        const prog = parseProgressLine(line);
        if (prog && prog.percent !== null) {
          onProgress && onProgress(prog);
        }
      }
    }
  };

  proc.stdout.on('data', handleData);
  proc.stderr.on('data', handleData);

  proc.on('close', (code) => {
    if (code === 0) {
      console.log(`Download completed successfully in ${outputDir}`);
      onComplete && onComplete();
    } else {
      console.error(`Download process exited with code ${code}`);
      onError && onError(new Error(`yt-dlp process exited with code ${code}`));
    }
  });

  proc.on('error', (err) => {
    console.error('yt-dlp spawn error:', err);
    onError && onError(err);
  });
}

module.exports = {
  detectPlatform,
  getMediaInfo,
  downloadMediaToFile
};
