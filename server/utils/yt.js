const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  // Fallback lookups
}

if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
  const candidatePaths = [
    path.join(__dirname, '../node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(__dirname, '../../server/node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(__dirname, '../../node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked/server/node_modules/ffmpeg-static/ffmpeg.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe')
  ];
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
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
 * Parse rich available video resolutions and audio options with accurate file sizes
 */
function parseAvailableFormats(data) {
  const formats = [];
  const rawFormats = data.formats || [];

  const bestAudio = rawFormats.filter(f => f.vcodec === 'none' && f.acodec !== 'none').pop();
  const audioSize = bestAudio?.filesize || bestAudio?.filesize_approx || (data.duration ? Math.round(data.duration * 320 * 1024 / 8) : null);

  // 1. Calculate TRUE Highest Video Quality Stream Size
  const videoStreams = rawFormats.filter(f => f.vcodec && f.vcodec !== 'none');
  const sortedVideoStreams = [...videoStreams].sort((a, b) => {
    const hA = Math.min(a.height || 0, a.width || 0) || a.height || 0;
    const hB = Math.min(b.height || 0, b.width || 0) || b.height || 0;
    if (hB !== hA) return hB - hA;
    return (b.tbr || b.filesize || 0) - (a.tbr || a.filesize || 0);
  });

  const bestVideoStream = sortedVideoStreams[0];
  const bestVideoSize = bestVideoStream?.filesize || bestVideoStream?.filesize_approx || (bestVideoStream?.tbr && data.duration ? Math.round(bestVideoStream.tbr * 1024 * data.duration / 8) : null);
  const bestNeedsAudio = bestVideoStream ? (bestVideoStream.acodec === 'none') : false;
  const trueHighestSize = bestVideoSize
    ? (bestNeedsAudio && audioSize ? bestVideoSize + audioSize : bestVideoSize)
    : (data.filesize || data.filesize_approx);

  formats.push({
    formatId: 'bestvideo+bestaudio/best',
    label: 'Video MP4 👑 Highest Quality Available (Max / 4K / 1080p)',
    ext: 'mp4',
    quality: 'Highest Available (Max)',
    fps: bestVideoStream?.fps || 60,
    isVideo: true,
    filesize: trueHighestSize,
    filesizeFormatted: formatBytes(trueHighestSize) || 'Auto Max'
  });

  // 2. Multi-Resolution Video Parsing (4K, 2K, 1080p, 720p, 480p, 360p)
  const targetResolutions = [
    { height: 2160, label: '4K Ultra HD', quality: '2160p' },
    { height: 1440, label: '2K Quad HD', quality: '1440p' },
    { height: 1080, label: 'Full HD 1080p', quality: '1080p' },
    { height: 720, label: 'High Definition', quality: '720p' },
    { height: 480, label: 'Standard', quality: '480p' },
    { height: 360, label: 'Compact Economy', quality: '360p' }
  ];

  for (const res of targetResolutions) {
    const matchedFormats = rawFormats.filter(f => {
      if (!f.vcodec || f.vcodec === 'none') return false;
      // Handle both landscape and portrait (Shorts/Reels)
      const effH = Math.min(f.height || 0, f.width || 0) || f.height || 0;
      return effH === res.height;
    });

    if (matchedFormats.length > 0) {
      // Pick standard H.264/AVC stream or first MP4 stream
      const chosen = matchedFormats.find(f => f.ext === 'mp4' && (f.vcodec.startsWith('avc') || f.vcodec.startsWith('h264'))) ||
                     matchedFormats.find(f => f.ext === 'mp4') ||
                     matchedFormats[0];

      const videoSize = chosen.filesize || chosen.filesize_approx || (chosen.tbr && data.duration ? Math.round(chosen.tbr * 1024 * data.duration / 8) : null);
      const needsAudio = chosen.acodec === 'none';
      const combinedSize = videoSize ? (needsAudio && audioSize ? videoSize + audioSize : videoSize) : null;

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

  // Ensure Highest Quality (formats[0]) is logically at least as large as any lower resolution option
  const maxLowerVideoSize = Math.max(0, ...formats.filter((f, idx) => idx > 0 && f.isVideo && f.filesize).map(f => f.filesize));
  if (formats[0] && formats[0].isVideo && maxLowerVideoSize > 0) {
    if (!formats[0].filesize || formats[0].filesize < maxLowerVideoSize) {
      formats[0].filesize = maxLowerVideoSize;
      formats[0].filesizeFormatted = formatBytes(maxLowerVideoSize);
    }
  }

  // 3. Studio Quality MP3 Audio Option
  formats.push({
    formatId: 'audio-best',
    label: 'Audio MP3 Studio Quality (320kbps)',
    ext: 'mp3',
    quality: '320kbps',
    isVideo: false,
    filesize: audioSize,
    filesizeFormatted: formatBytes(audioSize) || '~5.2 MB'
  });

  // 4. High Quality AAC/M4A
  formats.push({
    formatId: 'audio-m4a',
    label: 'Audio M4A / AAC Clean (128kbps)',
    ext: 'm4a',
    quality: '128kbps',
    isVideo: false,
    filesize: audioSize ? Math.round(audioSize * 0.45) : null,
    filesizeFormatted: formatBytes(audioSize ? Math.round(audioSize * 0.45) : null)
  });

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
function getMediaInfo(url, options = {}) {
  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    const cookiesFromBrowser = options.cookiesFromBrowser;
    const cookiesFile = options.cookiesFile;
    
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '-J',
      '--no-warnings'
    ];

    // Browser Cookies / Session Auth
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    } else if (cookiesFromBrowser && cookiesFromBrowser !== 'none') {
      args.push('--cookies-from-browser', cookiesFromBrowser);
    }

    if (platform === 'youtube') {
      args.push('--extractor-args', 'youtube:player_client=tv_embedded,web,default');
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
  let clipStart = null;
  let clipEnd = null;
  let sortMode = 'flat';
  let turboStreams = 16;
  let embedMetadata = true;
  let audioBoost = 'none';
  let playbackSpeed = 1.0;
  let uploader = '';

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
    clipStart = urlOrOptions.clipStart || null;
    clipEnd = urlOrOptions.clipEnd || null;
    sortMode = urlOrOptions.sortMode || 'flat';
    turboStreams = urlOrOptions.turboStreams || 16;
    embedMetadata = urlOrOptions.embedMetadata !== undefined ? !!urlOrOptions.embedMetadata : true;
    audioBoost = urlOrOptions.audioBoost || 'none';
    playbackSpeed = typeof urlOrOptions.playbackSpeed === 'number' ? urlOrOptions.playbackSpeed : (parseFloat(urlOrOptions.playbackSpeed) || 1.0);
    uploader = urlOrOptions.uploader || '';
    cookiesFromBrowser = urlOrOptions.cookiesFromBrowser || 'none';
    cookiesFile = urlOrOptions.cookiesFile || null;
  } else {
    url = urlOrOptions;
    format = formatArg || 'best';
    isAudio = !!isAudioArg;
    title = titleArg || '';
    outputDir = outputDirArg || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');
    onProgress = onProgressArg;
    onComplete = onCompleteArg;
    onError = onErrorArg;
    cookiesFromBrowser = 'none';
    cookiesFile = null;
  }

  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '--newline',
      '--no-warnings',
      '--windows-filenames',
      '--continue',
      '--retries', '10',
      '--fragment-retries', '10'
    ];

    // Browser Cookies / Session Auth
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    } else if (cookiesFromBrowser && cookiesFromBrowser !== 'none') {
      args.push('--cookies-from-browser', cookiesFromBrowser);
    }

    // Video Section Trimming / Clipping
    if ((clipStart && typeof clipStart === 'string' && clipStart.trim() !== '') || (clipEnd && typeof clipEnd === 'string' && clipEnd.trim() !== '')) {
      const s = (clipStart && typeof clipStart === 'string' && clipStart.trim() !== '') ? clipStart.trim() : '0';
      const e = (clipEnd && typeof clipEnd === 'string' && clipEnd.trim() !== '') ? clipEnd.trim() : 'inf';
      
      // Strict timestamp format check: only allow digits, colons, decimal seconds, or 'inf'
      const timeRegex = /^(\d+(:[0-5]?\d){0,2}(\.\d+)?|inf)$/i;
      if (timeRegex.test(s) && timeRegex.test(e)) {
        args.push('--download-sections', `*${s}-${e}`, '--force-keyframes-at-cuts');
      } else {
        console.warn(`[yt-dlp] Ignored invalid clip time range: start="${s}", end="${e}"`);
      }
    }

    // Bandwidth Speed Limiter or Turbo Multi-threading Stream Acceleration
    if (limitRate && limitRate !== 'unlimited' && limitRate.trim() !== '') {
      const cleanRate = limitRate.trim().toUpperCase();
      const rateVal = /^\d+$/.test(cleanRate) ? `${cleanRate}M` : cleanRate;
      args.push('--limit-rate', rateVal);
    } else {
      const streamCount = String(turboStreams || 16);
      args.push('--concurrent-fragments', streamCount);
      args.push('-N', streamCount);
    }

    // Auto-ID3 Metadata & High-Res Album Art Embedder
    if (embedMetadata) {
      args.push('--embed-metadata');
      if (isAudio || format === 'audio-best') {
        args.push('--embed-thumbnail');
      }
    }

    if (platform === 'youtube') {
      args.push('--extractor-args', 'youtube:player_client=tv_embedded,web,default');
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

    // Audio Booster & Noise Filter / Playback Speed FFmpeg postprocessor args
    const audioFilters = [];
    if (audioBoost === '+6dB') audioFilters.push('volume=6dB');
    else if (audioBoost === '+12dB') audioFilters.push('volume=12dB');
    else if (audioBoost === 'denoise') audioFilters.push('afftdn=nf=-25');
    else if (audioBoost === '+6dB_denoise') audioFilters.push('volume=6dB', 'afftdn=nf=-25');

    if (playbackSpeed && playbackSpeed !== 1.0) {
      audioFilters.push(`atempo=${playbackSpeed}`);
    }

    if (hasFfmpeg) {
      const postArgs = [];
      if (playbackSpeed && playbackSpeed !== 1.0 && !isAudio && format !== 'audio-best') {
        const vPts = (1 / playbackSpeed).toFixed(4);
        postArgs.push(`-filter:v setpts=${vPts}*PTS`);
      }
      if (audioFilters.length > 0) {
        postArgs.push(`-filter:a "${audioFilters.join(',')}"`);
      }
      if (postArgs.length > 0) {
        args.push('--postprocessor-args', `ffmpeg:${postArgs.join(' ')}`);
      }
    }

    if (isAudio || format === 'audio-best') {
      if (hasFfmpeg) {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      } else {
        args.push('-f', 'ba/b');
      }
    } else {
      // High-Definition & 4K Video handling
      if (format && format !== 'best') {
        args.push('-f', format);
      } else {
        // True Highest Quality Available with video and audio merged
        args.push('-f', 'bestvideo+bestaudio/best');
      }
      if (hasFfmpeg) {
        args.push('--merge-output-format', 'mp4');
      }
    }

    // Auto-Smart Storage Sorter: Resolve subdirectory
    let targetFolder = outputDir;
    if (sortMode === 'platform') {
      const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Web';
      targetFolder = path.join(outputDir, platformName);
    } else if (sortMode === 'creator' && uploader && uploader.trim() !== '') {
      const cleanCreator = uploader.replace(/[<>:"/\\|?*]/g, '_').trim().slice(0, 40);
      targetFolder = path.join(outputDir, cleanCreator || 'General');
    } else if (sortMode === 'type') {
      const isShortItem = url.includes('/shorts/') || url.includes('/reel/');
      const typeFolder = isAudio || format === 'audio-best' ? 'Music' : (isShortItem ? 'Shorts' : 'Videos');
      targetFolder = path.join(outputDir, typeFolder);
    }
    outputDir = targetFolder;

    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch (e) {
        console.warn('Could not create directory:', e.message);
      }
    }

    // Sanitize Windows invalid filename characters: < > : " / \ | ? *
    const sanitizeFilename = (name) => {
      return (name || '').replace(/[<>:"/\\|?*]/g, '_').trim();
    };

    const isClipped = (clipStart && typeof clipStart === 'string' && clipStart.trim() !== '') ||
                      (clipEnd && typeof clipEnd === 'string' && clipEnd.trim() !== '');

    const targetExt = isAudio || format === 'audio-best' ? 'mp3' : (format === 'audio-m4a' ? 'm4a' : 'mp4');
    let baseFileName = title && title.trim() !== '' ? sanitizeFilename(title) : '%(title)s';

    // If trimmed/clipped, append distinct section tag so it never collides with the full video
    if (isClipped) {
      const sTag = (clipStart && typeof clipStart === 'string' && clipStart.trim() !== '') ? clipStart.trim().replace(/[:.]/g, '-') : '0';
      const eTag = (clipEnd && typeof clipEnd === 'string' && clipEnd.trim() !== '') ? clipEnd.trim().replace(/[:.]/g, '-') : 'End';
      baseFileName += ` [Clip ${sTag}-${eTag}]`;
    }

    // Smart unique auto-numbering: If file already exists in outputDir, automatically increment filename (e.g. Song (1).mp4)
    if (title && title.trim() !== '' && fs.existsSync(outputDir)) {
      let candidate = `${baseFileName}.${targetExt}`;
      let counter = 1;
      while (fs.existsSync(path.join(outputDir, candidate))) {
        candidate = `${baseFileName} (${counter}).${targetExt}`;
        counter++;
      }
      baseFileName = candidate.replace(new RegExp(`\\.${targetExt}$`), '');
    }

    const outputPath = path.join(outputDir, `${baseFileName}.%(ext)s`).replace(/\\/g, '/');
    args.push('-o', outputPath);
    args.push('--force-overwrites');
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
          resolvedPath = path.resolve(path.join(outputDir, `${baseFileName}.${targetExt}`));
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

/**
 * Extract subtitles and plain-text transcript from video
 */
function extractTranscript(url, lang = 'en') {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(process.env.TEMP || '.', `transcript_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    } catch (e) {}

    const outPattern = path.join(tempDir, 'sub.%(ext)s').replace(/\\/g, '/');
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node',
      '--skip-download',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', `${lang || 'en'},en.*,ar.*,all`,
      '--sub-format', 'srt/vtt',
      '-o', outPattern,
      url
    ];

    execFile('python', args, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
      try {
        if (!fs.existsSync(tempDir)) {
          return reject(new Error('Subtitles extraction failed.'));
        }
        const files = fs.readdirSync(tempDir);
        const subFile = files.find(f => f.endsWith('.srt') || f.endsWith('.vtt'));
        if (!subFile) {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
          return reject(new Error('No captions or transcripts were found for this video in the selected language.'));
        }

        const rawContent = fs.readFileSync(path.join(tempDir, subFile), 'utf-8');
        // Clean out WebVTT headers and timecode metadata for readable plain text
        const plainText = rawContent
          .replace(/WEBVTT[\s\S]*?\n\n/g, '')
          .replace(/\d+\r?\n\d{2}:\d{2}:\d{2}[\d,.:]* --> \d{2}:\d{2}:\d{2}[\d,.:]*[^\n]*/g, '')
          .replace(/<[^>]+>/g, '')
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0 && !/^\d+$/.test(l))
          .join(' ')
          .replace(/\s+/g, ' ');

        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

        resolve({
          srt: rawContent,
          text: plainText,
          subFile
        });
      } catch (err) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        reject(err);
      }
    });
  });
}

/**
 * Save Ultra HD / Max Resolution thumbnail directly to disk
 */
async function downloadThumbnailFile(thumbnailUrl, title, outputDir) {
  try {
    if (!thumbnailUrl) throw new Error('No thumbnail URL provided');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const safeTitle = (title || 'Video')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim()
      .slice(0, 80);
    const targetFile = path.join(outputDir, `${safeTitle} - Poster.jpg`);

    const res = await fetch(thumbnailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download image (HTTP ${res.status})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));

    return { success: true, filePath: targetFile };
  } catch (err) {
    console.error('Thumbnail download error:', err.message);
    throw err;
  }
}

/**
 * Smart Social Media Video Compressor (WhatsApp, Discord, Email, Custom)
 */
function compressVideo({ inputPath, targetPreset = 'whatsapp', customSizeMB, outputDir }) {
  return new Promise((resolve, reject) => {
    if (!inputPath || !fs.existsSync(inputPath)) {
      return reject(new Error('Input video file does not exist on disk'));
    }
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      return reject(new Error('FFmpeg runtime is not available for video compression'));
    }

    const presetLimits = {
      whatsapp: 15.0,     // Target 15MB to be safely under WhatsApp 16MB limit
      discord_free: 7.8,  // Target 7.8MB to be under Discord 8MB free limit
      discord_nitro: 24.0,// Target 24MB to be under Discord 25MB limit
      email: 19.0         // Target 19MB to be safely under 20MB attachment limit
    };

    const targetMB = customSizeMB ? parseFloat(customSizeMB) : (presetLimits[targetPreset] || 15.0);
    const originalStat = fs.statSync(inputPath);
    const originalSizeBytes = originalStat.size;

    // 1. Probe duration using FFmpeg
    execFile(ffmpegPath, ['-i', inputPath], (err, stdout, stderr) => {
      const outputLog = (stderr || '') + (stdout || '');
      const durationMatch = outputLog.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      
      let durationSeconds = 60; // fallback
      if (durationMatch) {
        const hours = parseFloat(durationMatch[1]);
        const mins = parseFloat(durationMatch[2]);
        const secs = parseFloat(durationMatch[3]);
        durationSeconds = hours * 3600 + mins * 60 + secs;
      }

      if (durationSeconds <= 0) durationSeconds = 60;

      // 2. Calculate target bitrates (bits = MB * 8 * 1024 * 1024 * 0.94 safety factor)
      const targetBits = targetMB * 8 * 1024 * 1024 * 0.94;
      const audioBitrateKbps = durationSeconds > 120 ? 96 : 128;
      const totalBitrateKbps = Math.floor(targetBits / durationSeconds / 1024);
      const videoBitrateKbps = Math.max(120, totalBitrateKbps - audioBitrateKbps);

      // Smart downscaling if bitrate is constrained
      let scaleFilter = "scale='min(1920,iw)':-2";
      if (videoBitrateKbps < 350) {
        scaleFilter = "scale='min(640,iw)':-2"; // 480p/360p
      } else if (videoBitrateKbps < 850) {
        scaleFilter = "scale='min(1280,iw)':-2"; // 720p
      }

      const ext = path.extname(inputPath);
      const baseName = path.basename(inputPath, ext);
      const outFolder = outputDir || path.dirname(inputPath);
      if (!fs.existsSync(outFolder)) {
        fs.mkdirSync(outFolder, { recursive: true });
      }

      const presetLabel = targetPreset.replace('_', '-').toUpperCase();
      const outputPath = path.join(outFolder, `${baseName} [${presetLabel} ${Math.round(targetMB)}MB].mp4`);

      const ffmpegArgs = [
        '-y',
        '-i', inputPath,
        '-c:v', 'libx264',
        '-b:v', `${videoBitrateKbps}k`,
        '-maxrate', `${Math.round(videoBitrateKbps * 1.35)}k`,
        '-bufsize', `${Math.round(videoBitrateKbps * 2)}k`,
        '-vf', scaleFilter,
        '-c:a', 'aac',
        '-b:a', `${audioBitrateKbps}k`,
        '-preset', 'fast',
        outputPath
      ];

      execFile(ffmpegPath, ffmpegArgs, { maxBuffer: 10 * 1024 * 1024 }, (compErr) => {
        if (compErr) {
          return reject(new Error('Compression process failed: ' + compErr.message));
        }

        if (!fs.existsSync(outputPath)) {
          return reject(new Error('Compressed output file was not created.'));
        }

        const compStat = fs.statSync(outputPath);
        const compressedSizeBytes = compStat.size;
        const savingsPercent = Math.max(0, Math.round((1 - (compressedSizeBytes / originalSizeBytes)) * 100));

        resolve({
          success: true,
          originalPath: inputPath,
          outputPath,
          fileName: path.basename(outputPath),
          originalSize: formatBytes(originalSizeBytes),
          compressedSize: formatBytes(compressedSizeBytes),
          savingsPercent
        });
      });
    });
  });
}

/**
 * Lossless Frame Grabber - Extract exact full-resolution PNG image at timestamp
 */
function grabVideoFrame({ source, timestamp = '00:00:01', outputDir, title, cookiesFromBrowser, cookiesFile }) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      return reject(new Error('FFmpeg runtime is not available for frame grabbing'));
    }

    const outFolder = outputDir || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads');
    if (!fs.existsSync(outFolder)) {
      fs.mkdirSync(outFolder, { recursive: true });
    }

    const safeTitle = (title || 'Snap')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim()
      .slice(0, 70);

    const cleanTimestamp = (timestamp || '0').replace(/[:.]/g, '-');
    const outputPath = path.join(outFolder, `${safeTitle} [Frame ${cleanTimestamp}].png`);
    const cleanSs = (timestamp || '0').trim();

    // Check if source is a local file on disk
    if (fs.existsSync(source)) {
      const args = [
        '-y',
        '-ss', cleanSs,
        '-i', source,
        '-vframes', '1',
        '-q:v', '2',
        outputPath
      ];

      execFile(ffmpegPath, args, (err) => {
        if (err) return reject(new Error('Frame grab failed: ' + err.message));
        if (!fs.existsSync(outputPath)) return reject(new Error('Frame could not be captured at this timestamp'));

        resolve({
          success: true,
          filePath: outputPath,
          fileName: path.basename(outputPath)
        });
      });
    } else {
      // Remote URL: use yt-dlp to extract highest quality video stream link
      const platform = detectPlatform(source);
      const pyArgs = [
        '-m', 'yt_dlp',
        '--js-runtimes', 'node',
        '--no-warnings'
      ];

      // Browser Cookies / Session Auth
      if (cookiesFile && fs.existsSync(cookiesFile)) {
        pyArgs.push('--cookies', cookiesFile);
      } else if (cookiesFromBrowser && cookiesFromBrowser !== 'none') {
        pyArgs.push('--cookies-from-browser', cookiesFromBrowser);
      }

      pyArgs.push(
        '-g',
        '-f', 'bestvideo/best'
      );

      if (platform !== 'youtube') {
        pyArgs.push(
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--referer', 'https://www.google.com/'
        );
      }
      pyArgs.push(source);

      execFile('python', pyArgs, { maxBuffer: 10 * 1024 * 1024 }, (ytErr, stdout, stderr) => {
        const directUrl = (stdout || '').trim().split('\n')[0];
        if (ytErr || !directUrl || !directUrl.startsWith('http')) {
          console.error('Frame grab yt-dlp stream error:', stderr || ytErr?.message);
          return reject(new Error('Could not fetch stream URL for remote frame capture: ' + (stderr || ytErr?.message || 'Unknown error')));
        }

        const args = [
          '-y',
          '-ss', cleanSs,
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5',
          '-i', directUrl,
          '-vframes', '1',
          '-q:v', '2',
          outputPath
        ];

        execFile(ffmpegPath, args, { maxBuffer: 10 * 1024 * 1024 }, (frameErr) => {
          if (frameErr) return reject(new Error('Remote frame grab failed: ' + frameErr.message));
          if (!fs.existsSync(outputPath)) return reject(new Error('Frame could not be captured at this timestamp'));

          resolve({
            success: true,
            filePath: outputPath,
            fileName: path.basename(outputPath)
          });
        });
      });
    }
  });
}

/**
 * Diagnostic tool to test cookies authentication from a browser or cookies.txt file
 */
function testCookieAuth({ browser, filePath }) {
  return new Promise((resolve) => {
    const args = [
      '-m', 'yt_dlp',
      '--no-warnings',
      '--simulate',
      '--dump-single-json',
      '--playlist-items', '1'
    ];

    if (filePath && fs.existsSync(filePath)) {
      args.push('--cookies', filePath);
    } else if (browser && browser !== 'none') {
      args.push('--cookies-from-browser', browser);
    } else {
      return resolve({
        success: false,
        error: 'No valid browser or cookies file selected'
      });
    }

    // Fast test against a standard video
    args.push('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    execFile('python', args, { timeout: 15000 }, (err, stdout, stderr) => {
      const errStr = (stderr || err?.message || '').toLowerCase();
      if (errStr.includes('could not copy') || errStr.includes('database')) {
        return resolve({
          success: false,
          error: `Browser database is locked by ${browser}. Please close your browser completely or export a cookies.txt file.`
        });
      }
      if (errStr.includes('could not find')) {
        return resolve({
          success: false,
          error: `Could not find cookies for ${browser}. Verify the browser is installed and used on this computer.`
        });
      }
      if (err) {
        return resolve({
          success: false,
          error: (stderr || err.message).slice(0, 200) || 'Cookie verification failed'
        });
      }

      return resolve({
        success: true,
        message: `Session verified successfully via ${filePath ? 'Cookies File' : browser.toUpperCase()}!`
      });
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
  extractTranscript,
  downloadThumbnailFile,
  compressVideo,
  grabVideoFrame,
  testCookieAuth,
  killProcessTree
};
