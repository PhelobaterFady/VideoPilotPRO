import React from 'react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  QrCode, 
  Cpu, 
  Zap, 
  Film, 
  ExternalLink, 
  Lock, 
  Monitor, 
  Compass,
  ArrowRight
} from 'lucide-react';

interface DesktopLandingPageProps {
  currentVersion?: string;
  downloadUrl?: string;
}

export const DesktopLandingPage: React.FC<DesktopLandingPageProps> = ({
  currentVersion = '1.3.3',
  downloadUrl = 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest/download/Video-Pilot-Pro-Setup-1.3.3.exe'
}) => {
  const fallbackReleaseUrl = 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest';

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-[#00E5FF]/20 selection:text-[#00E5FF] font-sans antialiased overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#00E5FF]/10 via-[#00E676]/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[120px] rounded-full" />
        <div className="absolute top-[1000px] -right-40 w-[500px] h-[500px] bg-[#00E676]/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-xl sticky top-0 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-black font-bold shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-white text-lg tracking-tight">
                Video Pilot <span className="text-[#00E5FF]">Pro</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8290A5] text-[10px] font-mono border border-white/10 font-bold">
                WINDOWS DESKTOP EDITION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E131F] border border-white/[0.08] text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              <span>CORE v{currentVersion} READY</span>
            </div>

            <a
              href={downloadUrl}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00b0ff] hover:brightness-110 text-[#07090E] font-display font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Setup (.EXE)</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E131F] border border-[#00E5FF]/30 text-xs font-mono text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.15)] animate-in fade-in">
            <Monitor className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wide">NATIVE WINDOWS DESKTOP WORKSTATION</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
            The Ultimate Social Media Video <span className="bg-gradient-to-r from-[#00E5FF] via-[#33ebff] to-[#00E676] bg-clip-text text-transparent">Powerhouse</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#8290A5] leading-relaxed font-sans max-w-2xl mx-auto">
            Extract, reformat, and process uncapped 4K/8K media from YouTube, TikTok, Instagram, Facebook, and X. Built exclusively for Windows with native hardware-accelerated FFmpeg.
          </p>

          {/* Primary Download CTA Card */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <a
              href={downloadUrl}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] via-[#33ebff] to-[#00E676] text-black font-display font-black text-base shadow-[0_0_40px_rgba(0,229,255,0.35)] hover:shadow-[0_0_55px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform stroke-[2.5]" />
              <span>Download Video Pilot Pro (v{currentVersion})</span>
              <span className="text-xs bg-black/20 text-black px-2 py-0.5 rounded-full font-mono font-bold ml-1">
                64-Bit EXE
              </span>
            </a>

            <div className="flex items-center gap-4 text-xs font-mono text-[#8290A5] pt-1">
              <span>✓ Windows 10 & 11</span>
              <span>•</span>
              <span>✓ 100% Free & Open-Source</span>
              <span>•</span>
              <a
                href={fallbackReleaseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                <span>GitHub Releases</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Notice Banner: Why Desktop Only */}
          <div className="p-4 rounded-2xl bg-[#0E131F]/90 border border-white/[0.08] text-xs font-mono text-left text-zinc-300 max-w-xl mx-auto flex items-start gap-3 shadow-xl">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[#00E5FF] font-bold block mb-0.5">Desktop Application Required:</span>
              Browsers are sandboxed and cannot access your graphics card for FFmpeg 9:16 transcoding, extract Chrome cookies, or save lossless 4K streams to your hard drive. Install the desktop edition above to access all features.
            </div>
          </div>
        </div>

        {/* Feature Bento Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-[#00E5FF] uppercase tracking-wider font-bold">// ARCHITECTURE HIGHLIGHTS</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Engineered Without Compromises</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: 9:16 Converter Studio */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-[#00E5FF]/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Converter Studio (Feature 3)</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  Turn landscape YouTube videos into vertical 9:16 Shorts, Reels, and TikTok clips with intelligent dual-layer blurred canvas background.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                <span>9:16, 1:1, 4:5 Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Turbo Ingestion */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-[#00E676]/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Uncapped Turbo Streams</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  Multi-threaded socket chunking saturates your fiber connection for lightning fast 4K/8K downloads with live telemetry speedometers.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#00E676]">
                <span>Up to 16 Concurrent Chunks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Session & Cookie Bypass */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-[#FFB020]/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Browser Cookies Auto-Importer</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  Bypass YouTube "Sign in to confirm you're not a bot" and age restrictions by auto-importing authenticated cookies from Chrome, Edge, and Brave.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#FFB020]">
                <span>Zero Bot Detection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4: Wi-Fi Mobile Beam */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-[#00E676]/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Instant Wi-Fi Mobile Share</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  Scan a QR code with your iPhone or Android to stream or download media directly to your phone across your home network with no cables.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#00E676]">
                <span>High-Speed Local Transfer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 5: Lossless Frame Grabber */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-[#00E5FF]/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Lossless Frame & Subtitles Studio</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  Extract pristine PNG frames at any exact second, save original high-res thumbnails, and export video transcripts in SRT, VTT, and TXT.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                <span>Pristine Master Quality</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 6: Smart Auto-Updater */}
            <div className="p-6 rounded-3xl bg-[#0E131F]/70 border border-white/[0.08] hover:border-cyan-500/40 transition-all space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Silent In-App Auto-Updates</h3>
                <p className="text-xs text-[#8290A5] mt-1.5 leading-relaxed">
                  The application updates itself automatically in the background with live progress meters and 1-click seamless restarts.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#00E5FF]">
                <span>Zero Re-Installation Needed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* System Specs Section */}
        <div className="p-8 rounded-3xl bg-[#0E131F]/90 border border-white/[0.08] shadow-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-5">
            <div>
              <h3 className="text-xl font-bold font-display text-white">System Requirements & Specifications</h3>
              <p className="text-xs text-[#8290A5]">Optimized for modern desktop workstations</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#00E676]/10 text-[#00E676] text-xs font-mono font-bold border border-[#00E676]/30">
              CURRENT STABLE: v{currentVersion}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[#8290A5] block">Operating System</span>
              <span className="text-white font-bold">Windows 10 / 11 (64-Bit)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[#8290A5] block">Processing Engine</span>
              <span className="text-white font-bold">FFmpeg v7.0 + yt-dlp</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[#8290A5] block">Memory (RAM)</span>
              <span className="text-white font-bold">4 GB Minimum (8 GB Rec.)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[#8290A5] block">License & Telemetry</span>
              <span className="text-[#00E676] font-bold">100% Free / No Ads</span>
            </div>
          </div>
        </div>

        {/* Final Download Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-[#00E5FF]/10 via-[#0E131F] to-[#00E676]/10 border border-[#00E5FF]/30 text-center space-y-6 shadow-[0_0_50px_rgba(0,229,255,0.1)]">
          <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center mx-auto border border-[#00E5FF]/40 shadow-xl shadow-cyan-500/20">
            <Download className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white">
              Ready to Upgrade Your Video Workflow?
            </h2>
            <p className="text-xs sm:text-sm text-[#8290A5]">
              Download the standalone Windows installer now. Zero setup required, bundled with all codecs and extraction binaries.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] via-[#33ebff] to-[#00E676] text-black font-display font-black text-sm shadow-[0_0_35px_rgba(0,229,255,0.3)] hover:scale-105 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download Video Pilot Pro (v{currentVersion})</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/[0.08] bg-[#07090E] px-6 py-8 text-center text-xs font-mono text-[#8290A5] space-y-2">
        <p>Video Pilot Pro © 2026 • High-Performance Social Media Downloader & Transcoder</p>
        <p className="text-zinc-500">Exclusively designed and optimized for Microsoft Windows</p>
      </footer>
    </div>
  );
};
