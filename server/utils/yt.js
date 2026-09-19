const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  // Fallback lookups
  const candidatePaths = [
    path.join(__dirname, '../node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(__dirname, '../../server/node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(__dirname, '../../node_modules/ffmpeg-static/ffmpeg.exe')
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      ffmpegPath = p;
      break;
    }
  }
}

if (typeof ffmpegPath === 'string') {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
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
 * Helper to format bytes to human readable sizes
 */
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Parse rich available video resolutions and audio options with file sizes
 */
function parseAvailableFormats(data) {
  const formats = [];
  const rawFormats = data.formats || [];

  // 1. Studio Quality MP3 Audio Option
  const bestAudio = rawFormats.filter(f => f.vcodec === 'none' && f.acodec !== 'none').pop();
  const audioSize = bestAudio?.filesize || bestAudio?.filesize_approx || (data.duration ? Math.round(data.duration * 320 * 1024 / 8) : null);
  formats.push({
    formatId: 'audio-best',
    label: 'Audio MP3 Studio Quality (320kbps)',
    ext: 'mp3',
    quality: '320kbps',
    isVideo: false,
    filesize: audioSize,
    filesizeFormatted: formatBytes(audioSize) || '~5.2 MB'
  });

  // 2. High Quality AAC/M4A
  formats.push({
    formatId: 'audio-m4a',
    label: 'Audio M4A / AAC Clean (128kbps)',
    ext: 'm4a',
    quality: '128kbps',
    isVideo: false,
    filesize: audioSize ? Math.round(audioSize * 0.45) : null,
    filesizeFormatted: formatBytes(audioSize ? Math.round(audioSize * 0.45) : null)
  });

  // 3. Multi-Resolution Video Parsing (4K, 2K, 1080p, 720p, 480p, 360p)
  const targetResolutions = [
    { height: 2160, label: '4K Ultra HD', quality: '2160p' },
    { height: 1440, label: '2K Quad HD', quality: '1440p' },
    { height: 1080, label: 'Full HD 1080p', quality: '1080p' },
    { height: 720, label: 'High Definition', quality: '720p' },
    { height: 480, label: 'Standard', quality: '480p' },
    { height: 360, label: 'Compact Economy', quality: '360p' }
  ];

  for (const res of targetResolutions) {
    const matchedFormats = rawFormats.filter(f => f.height === res.height && f.vcodec !== 'none');
    if (matchedFormats.length > 0) {
      const chosen = matchedFormats.find(f => f.ext === 'mp4') || matchedFormats[matchedFormats.length - 1];
      const videoSize = chosen.filesize || chosen.filesize_approx;
      const combinedSize = videoSize ? (audioSize ? videoSize + audioSize : videoSize) : null;

      formats.push({
        formatId: `bestvideo[height<=${res.height}]+bestaudio/best[height<=${res.height}]/best`,
        label: `Video MP4 ${res.label} (${res.quality})`,
        ext: 'mp4',
        quality: res.quality,
        fps: chosen.fps || 30,
        isVideo: true,
        filesize: combinedSize,
        filesizeFormatted: formatBytes(combinedSize)
      });
    }
  }

  // 4. Guaranteed Best Quality Fallback
  if (formats.filter(f => f.isVideo).length === 0) {
    const rawTotalSize = data.filesize || data.filesize_approx;
    formats.push({
      formatId: 'best',
      label: 'Video MP4 Best Quality Available',
      ext: 'mp4',
      quality: 'Best',
      isVideo: true,
      filesize: rawTotalSize,
      filesizeFormatted: formatBytes(rawTotalSize)
    });
  }

  return formats;
}

/**
 * Extract available subtitles / captions
 */
function parseAvailableSubtitles(data) {
  const subs = [];
  const allSubs = { ...(data.subtitles || {}), ...(data.automatic_captions || {}) };
  for (const [langCode, entries] of Object.entries(allSubs)) {
    const name = (entries && entries[0] && entries[0].name) || langCode.toUpperCase();
    subs.push({
      code: langCode,
      name: `${name} (${langCode})`
    });
    if (subs.length >= 10) break;
  }
  return subs;
}

/**
 * Get detailed media information using yt-dlp
 */
function getMediaInfo(url) {
  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '-J',
      '--no-warnings'
    ];

    if (platform === 'youtube') {
      args.push('--extractor-args', 'youtube:player_client=android,web');
    } else {
      args.push(
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        '--referer', 'https://www.google.com/'
      );
    }

    if (url.includes('list=') || url.includes('playlist') || url.includes('/@') || url.includes('/channel/') || url.includes('/c/') || url.includes('/user/')) {
      args.push('--flat-playlist', '--playlist-end', '100');
    }

    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      args.push('--ffmpeg-location', ffmpegPath);
    }

    args.push(url);

    execFile('python', args, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const errText = (stderr || error.message || '').toLowerCase();
        console.error(`yt-dlp info error for [${url}]:`, stderr || error.message);

        if (errText.includes('404') || errText.includes('not found') || errText.includes('does not exist') || errText.includes('400') || errText.includes('bad request') || errText.includes('invalid argument')) {
          return reject(new Error('The requested video or playlist was not found or the playlist ID is invalid. Please verify that the link is correct, not deleted, and set to public.'));
        }
        if (errText.includes('private') || errText.includes('sign in') || errText.includes('login required')) {
          return reject(new Error('This video or playlist is private or requires authentication to view.'));
        }
        if (errText.includes('403') || errText.includes('forbidden')) {
          return reject(new Error('Access was denied by the platform (HTTP 403 Forbidden).'));
        }

        // Only fallback for non-YouTube platforms where yt-dlp metadata extraction might be restricted
        if (platform !== 'youtube' && !url.includes('playlist') && !url.includes('list=')) {
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
            formats: [{ formatId: 'best', label: 'Video MP4 Best Quality', ext: 'mp4', quality: 'Best', isVideo: true }],
            subtitles: []
          });
        }

        return reject(new Error('Failed to load playlist or video. Please check the URL and try again.'));
      }

      try {
        const data = JSON.parse(stdout);
        const isPlaylist = data._type === 'playlist' || (Array.isArray(data.entries) && data.entries.length > 0);

        if (isPlaylist) {
          const items = (data.entries || []).map((entry, index) => {
            const entryUrl = entry.url && (entry.url.startsWith('http://') || entry.url.startsWith('https://'))
              ? entry.url
              : (entry.id ? `https://www.youtube.com/watch?v=${entry.id}` : url);

            const isShort = (entry.duration && entry.duration <= 60) ||
                            (entryUrl && entryUrl.includes('/shorts/')) ||
                            (entry.title && entry.title.toLowerCase().includes('#shorts'));

            return {
              id: entry.id || `item_${index}`,
              title: entry.title || `Track ${index + 1}`,
              url: entryUrl,
              duration: entry.duration || 0,
              uploader: entry.uploader || entry.channel || data.title || 'Unknown',
              thumbnail: entry.thumbnail || (entry.thumbnails && entry.thumbnails[0] ? entry.thumbnails[0].url : '') || data.thumbnail || '',
              isShort: !!isShort
            };
          });

          return resolve({
            type: 'playlist',
            platform,
            id: data.id || `playlist_${Date.now()}`,
            title: data.title || 'YouTube Playlist',
            itemCount: items.length,
            thumbnail: data.thumbnail || (items[0] ? items[0].thumbnail : ''),
            items
          });
        }

        const isShort = url.includes('/shorts/') || url.includes('/reel/') || (data.duration && data.duration <= 60);
        const formats = parseAvailableFormats(data);
        const subtitles = parseAvailableSubtitles(data);

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
          formats,
          subtitles
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
          formats: [{ formatId: 'best', label: 'Video MP4 Best Quality', ext: 'mp4', quality: 'Best', isVideo: true }],
          subtitles: []
        });
      }
    });
  });
}

/**
 * Download file or playlist tracks directly into specified PC output directory with robust MP3 extraction
 */
function downloadMediaToFile(urlOrOptions, formatArg, isAudioArg, titleArg, outputDirArg, onProgressArg, onCompleteArg, onErrorArg) {
  let url = '';
  let format = 'best';
  let isAudio = false;
  let title = '';
  let outputDir = '';
  let subtitleLang = null;
  let onProgress = null;
  let onComplete = null;
  let onError = null;

  let limitRate = null;
  let onProcessStart = null;

  if (typeof urlOrOptions === 'object' && urlOrOptions !== null) {
    url = urlOrOptions.url;
    format = urlOrOptions.format || 'best';
    isAudio = !!(urlOrOptions.audioOnly || urlOrOptions.isAudio);
    title = urlOrOptions.title || '';
    outputDir = urlOrOptions.outputDir || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');
    subtitleLang = urlOrOptions.subtitleLang || null;
    limitRate = urlOrOptions.limitRate || null;
    onProgress = urlOrOptions.onProgress;
    onComplete = urlOrOptions.onComplete;
    onError = urlOrOptions.onError;
    onProcessStart = urlOrOptions.onProcessStart;
  } else {
    url = urlOrOptions;
    format = formatArg || 'best';
    isAudio = !!isAudioArg;
    title = titleArg || '';
    outputDir = outputDirArg || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');
    onProgress = onProgressArg;
    onComplete = onCompleteArg;
    onError = onErrorArg;
  }

  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '--newline',
      '--no-warnings',
      '--windows-filenames',
      '--continue'
    ];

    // Bandwidth Speed Limiter
    if (limitRate && limitRate !== 'unlimited' && limitRate.trim() !== '') {
      const cleanRate = limitRate.trim().toUpperCase();
      // If user typed '3' convert to '3M', if '500K' or '2M' leave as is
      const rateVal = /^\d+$/.test(cleanRate) ? `${cleanRate}M` : cleanRate;
      args.push('--limit-rate', rateVal);
    } else {
      args.push('--concurrent-fragments', '5');
    }

    if (platform === 'youtube') {
      args.push('--extractor-args', 'youtube:player_client=android,web');
    } else {
      args.push(
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        '--referer', 'https://www.google.com/'
      );
    }

    // Subtitles Embedding Support
    if (subtitleLang && typeof subtitleLang === 'string' && subtitleLang !== 'none') {
      args.push('--write-sub', '--sub-lang', subtitleLang, '--embed-subs');
    }

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
    } else if (format && format !== 'best') {
      args.push('-f', format);
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

    console.log(`Starting download [LimitRate: ${limitRate || 'Unlimited'}]: ${url} -> ${outputPath}`);

    const proc = spawn('python', args);
    if (onProcessStart && typeof onProcessStart === 'function') {
      onProcessStart(proc);
    }

    let stderrLog = '';
    let finalDetectedPath = '';

    const handleData = (data) => {
      const text = data.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.includes('has already been downloaded')) {
          const match = line.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
          if (match && match[1]) finalDetectedPath = match[1].trim();
        }
        if (line.includes('[download]') && line.includes('Destination:')) {
          const destMatch = line.match(/Destination:\s*(.+)$/);
          if (destMatch && destMatch[1]) finalDetectedPath = destMatch[1].trim();
        }
        if (line.includes('[ExtractAudio]') && line.includes('Destination:')) {
          const destMatch = line.match(/Destination:\s*(.+)$/);
          if (destMatch && destMatch[1]) finalDetectedPath = destMatch[1].trim();
        }
        if (line.includes('[Merger]') && line.includes('Merging formats into')) {
          const mergeMatch = line.match(/Merging formats into ["']?([^"']+)["']?/);
          if (mergeMatch && mergeMatch[1]) finalDetectedPath = mergeMatch[1].trim();
        }
        if (line.includes('[download]')) {
          const prog = parseProgressLine(line);
          if (prog && prog.percent !== null) {
            onProgress && onProgress(prog);
          }
        }
      }
    };

    proc.stdout.on('data', handleData);
    proc.stderr.on('data', (d) => {
      stderrLog += d.toString();
      handleData(d);
    });

    proc.on('close', (code) => {
      if (proc._userKilled) {
        console.log(`Download user-${proc._userAction || 'killed'}: ${url}`);
        return resolve({
          success: false,
          killed: true,
          status: proc._userAction || 'cancelled'
        });
      }

      if (code === 0) {
        let resolvedPath = (finalDetectedPath && fs.existsSync(finalDetectedPath))
          ? path.resolve(finalDetectedPath)
          : null;

        // Fallback: find latest downloaded file in outputDir if finalDetectedPath was not caught
        if (!resolvedPath || !fs.existsSync(resolvedPath)) {
          try {
            const files = fs.readdirSync(outputDir)
              .filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl'))
              .map(f => ({ name: f, fullPath: path.join(outputDir, f), mtime: fs.statSync(path.join(outputDir, f)).mtime }))
              .sort((a, b) => b.mtime - a.mtime);
            if (files.length > 0) {
              resolvedPath = files[0].fullPath;
            }
          } catch (e) {}
        }

        if (!resolvedPath) {
          resolvedPath = path.resolve(outputPath.replace('%(title)s', title).replace('%(ext)s', isAudio ? 'mp3' : 'mp4'));
        }

        console.log(`Download completed successfully. Local PC file: ${resolvedPath}`);
        onComplete && onComplete();
        resolve({ success: true, filePath: resolvedPath });
      } else {
        console.error(`Download process exited with code ${code}. Stderr:`, stderrLog);
        const err = new Error(stderrLog.trim() || `yt-dlp process exited with code ${code}`);
        onError && onError(err);
        reject(err);
      }
    });

    proc.on('error', (err) => {
      if (proc._userKilled) {
        return resolve({ success: false, killed: true, status: proc._userAction || 'cancelled' });
      }
      console.error('yt-dlp spawn error:', err);
      onError && onError(err);
      reject(err);
    });
  });
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFile('taskkill', ['/F', '/T', '/PID', pid.toString()], () => {});
    } else {
      process.kill(pid, 'SIGKILL');
    }
  } catch (e) {
    console.warn(`Error terminating process tree for PID ${pid}:`, e.message);
  }
}

module.exports = {
  detectPlatform,
  getMediaInfo,
  downloadMediaToFile,
  killProcessTree
};
