import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CinematicState, InspectTarget } from './CinematicEngine';
import { NarrativeAct } from './CinematicEngine';
import { FileText, Clock, AlertTriangle, Layers, Play, Pause, ArrowLeft } from 'lucide-react';

interface RoomWasNeverEmptySceneProps {
  cinematicState: CinematicState;
  onInspectObject: (target: InspectTarget) => void;
  onMonitorScrub: (timeIndex: number) => void;
  onEnterCourt: () => void;
}

const TIMECODES = ['21:13:58', '21:14:00', '21:14:03', '21:14:15'];
// Corresponding seconds in the authentic CCTV surveillance video
const TIMECODE_SECONDS = [0.0, 2.0, 5.2, 15.0];

export const RoomWasNeverEmptyScene: React.FC<RoomWasNeverEmptySceneProps> = ({
  cinematicState,
  onInspectObject,
  onMonitorScrub,
  onEnterCourt,
}) => {
  const { act, progress, activeInspect, monitorTimeIndex, ctaVisible, isEntering } = cinematicState;

  // Reduced motion preference
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches),
    []
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Monitor tape auto-playback state during post-cinematic inspection
  const [isPlayingTape, setIsPlayingTape] = useState(false);

  // Sync CCTV surveillance video with the cinematic master timeline during autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeInspect === 'monitor') return;

    // During Shot 1 (0.00 - 0.160, ~0-3s): 0s to 3s
    // During Shot 2 (0.160 - 0.293, ~3-5.5s): 3s to 5s
    // During Shot 3 & 4: soft focus background video (3s to 5s)
    // During Shot 5 (0.638 - 0.851, ~12-16s): lunge into footage at 21:14:03 (5.2s video time with silhouette anomaly)
    if (progress >= 0.633 && progress < 0.851) {
      if (Math.abs(video.currentTime - 5.2) > 0.6) {
        video.currentTime = 5.2;
      }
    } else if (progress < 0.16) {
      const targetTime = (progress / 0.16) * 3.0;
      if (Math.abs(video.currentTime - targetTime) > 0.8) {
        video.currentTime = targetTime;
      }
    }
  }, [progress, activeInspect]);

  // Handle post-cinematic tape scrubbing
  const handleScrub = useCallback(
    (idx: number) => {
      setIsPlayingTape(false);
      onMonitorScrub(idx);
      const video = videoRef.current;
      if (video && TIMECODE_SECONDS[idx] !== undefined) {
        video.currentTime = TIMECODE_SECONDS[idx];
        video.pause();
      }
    },
    [onMonitorScrub]
  );

  // Handle tape play/pause toggle
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingTape) {
      video.pause();
      setIsPlayingTape(false);
    } else {
      video
        .play()
        .then(() => setIsPlayingTape(true))
        .catch(() => setIsPlayingTape(false));
    }
  }, [isPlayingTape]);

  // Tape auto-advancement when playing
  useEffect(() => {
    if (!isPlayingTape || activeInspect !== 'monitor') return;
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (video) {
        const ct = video.currentTime;
        if (ct < 2.0) onMonitorScrub(0);
        else if (ct < 5.0) onMonitorScrub(1);
        else if (ct < 14.0) onMonitorScrub(2);
        else onMonitorScrub(3);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlayingTape, activeInspect, onMonitorScrub]);

  // Procedural subtle rain condensation on archival window glass
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth || 1280);
    let height = (canvas.height = window.innerHeight || 800);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 1280;
      height = canvas.height = window.innerHeight || 800;
    };
    window.addEventListener('resize', onResize);

    interface RainDrop {
      x: number;
      y: number;
      len: number;
      speed: number;
      opacity: number;
    }

    const drops: RainDrop[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: Math.random() * 22 + 10,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.22 + 0.06,
    }));

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const d of drops) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(229, 222, 208, ${d.opacity})`;
        ctx.lineWidth = 1;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 0.4, d.y + d.len);
        ctx.stroke();

        if (!prefersReducedMotion) {
          d.y += d.speed;
          if (d.y > height) {
            d.y = -d.len;
            d.x = Math.random() * width;
          }
        }
      }

      if (prefersReducedMotion) return;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [prefersReducedMotion]);

  // Timecode readout for Shot 1
  const openingTimecode = useMemo(() => {
    if (progress < 0.05) return '21:13:58';
    if (progress < 0.1) return '21:13:59';
    return '21:14:00';
  }, [progress]);

  // ── THE 7-SHOT CONTINUOUS HYBRID CINEMATIC TIMELINE (18.8 s target) ────
  // SHOT 01 (0.00–0.160, 0.0–3.0s): Inside surveillance footage (CCTV fills viewport)
  // SHOT 02 (0.160–0.293, 3.0–5.5s): Break the frame (camera pulls back, CRT bezel & walnut desk appear)
  // SHOT 03 (0.293–0.452, 5.5–8.5s): Discover case file (macro on "ROOM WAS EMPTY AT 21:14")
  // SHOT 04 (0.452–0.638, 8.5–12.0s): Contradiction (access slip + monitor in background)
  // SHOT 05 (0.638–0.851, 12.0–16.0s): Enter footage again (zoom into screen, silhouette anomaly)
  // SHOT 06 (0.851–0.933, 16.0–17.55s): Tribunal emerges (glide down central aisle, doors unlock)
  // SHOT 07 (0.933–1.000, 17.55–18.8s+): Settled symmetrical judicial composition & invitation
  const isShot1 = progress < 0.16;
  const isShot2 = progress >= 0.155 && progress < 0.293;
  const isShot3 = progress >= 0.29 && progress < 0.452;
  const isShot4 = progress >= 0.447 && progress < 0.638;
  const isShot5 = progress >= 0.633 && progress < 0.851;
  const isShot6 = progress >= 0.846 && progress < 0.933;
  const isShot7 = progress >= 0.918;

  const isPostCinematic =
    ctaVisible || act === NarrativeAct.FINALE || act === NarrativeAct.COMPLETED;

  // Calculate continuous camera pullback for Shot 2
  const breakFrameScale = useMemo(() => {
    if (progress < 0.16) return 1;
    if (progress > 0.293) return 0.52;
    const t = (progress - 0.16) / (0.293 - 0.16);
    const s = t * t * (3 - 2 * t);
    return 1 - s * 0.48;
  }, [progress]);

  // Dedicated macro plates for post-cinematic in-world inspection
  const caseFileMacro = isPostCinematic && activeInspect === 'case_file';
  const accessMacro = isPostCinematic && activeInspect === 'access_record';

  const getInspectionTransform = () => {
    if (!isPostCinematic || activeInspect === 'none') {
      return isEntering ? 'scale(1.15) translateY(-3%)' : 'scale(1) translate(0, 0)';
    }
    switch (activeInspect) {
      case 'monitor':
        return 'scale(1.28) translate(0%, -4%)';
      case 'case_file':
        return 'scale(1.12) translateY(-2%)';
      case 'access_record':
        return 'scale(1.12) translateY(-2%)';
      case 'compare':
        return 'scale(1.32) translate(0%, -4%)';
      default:
        return 'scale(1) translate(0, 0)';
    }
  };

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-[#111315] select-none"
      aria-label="3D Interactive Experience — The Camera Was Lying"
      role="region"
    >
      {/* ── THE CONTINUOUS LIVING CINEMATIC ENVIRONMENT ──────────────── */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-1000 ease-out"
        style={{
          transform: prefersReducedMotion ? undefined : getInspectionTransform(),
        }}
      >
        {/* ── BACKGROUND ARCHITECTURE: Grand Judicial Tribunal Chamber ── */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: isShot6 || isShot7 || isPostCinematic ? 1 : 0,
            pointerEvents: isShot6 || isShot7 || isPostCinematic ? 'auto' : 'none',
          }}
        >
          <img
            src="/cinematic/shot5_tribunal_chamber.jpg"
            alt="Grand judicial tribunal chamber with opposing advocate benches and double doors unlocking"
            className="h-full w-full object-cover"
          />
          {/* Volumetric tungsten light beam through parting doors */}
          <div
            className="pointer-events-none absolute top-1/4 left-1/2 h-[550px] w-52 -translate-x-1/2 bg-gradient-to-b from-[#C6A16B]/30 via-[#C6A16B]/15 to-transparent blur-3xl transition-opacity duration-1000"
            style={{ opacity: progress >= 0.88 || isPostCinematic ? 1 : 0.3 }}
          />
        </div>

        {/* ── SHOT 05: Enter the Footage Again (Surveillance Re-entry at 21:14:03) ── */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: isShot5 && activeInspect === 'none' ? 1 : 0,
            pointerEvents: isShot5 ? 'auto' : 'none',
          }}
        >
          {/* Real video or high-res silhouette plate */}
          <div className="relative h-full w-full">
            <img
              src="/cinematic/cctv_archive_silhouette.jpg"
              alt="Surveillance view at 21:14:03 showing human silhouette in corridor doorway"
              className="h-full w-full object-cover contrast-125 grayscale"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-50" />
          </div>

          {/* Cam HUD & Anomaly Reflection Focus */}
          <div className="pointer-events-none absolute top-[4.25rem] right-8 flex items-center justify-end gap-3 text-right font-mono text-xs font-bold tracking-widest text-[#782F37] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            <span className="text-[#E5DED0]/70">CAM 03</span>
            <span>[!] 21:14:03 EST — UNREGISTERED PRESENCE REFLECTED</span>
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#782F37]" />
          </div>

          {/* Subtle Focus Ring around Silhouette */}
          <div className="pointer-events-none absolute top-[28%] left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div className="h-44 w-28 animate-pulse rounded border border-[#782F37] shadow-[0_0_25px_rgba(120,47,55,0.7)]" />
            <span className="mt-2 rounded bg-[#782F37]/90 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-white uppercase shadow">
              THE CAMERA WAS LYING
            </span>
          </div>
        </div>

        {/* ── SHOT 04: Contradiction Composition (Access Slip + Monitor in Background) ── */}
        <div
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            opacity: accessMacro ? 1 : isShot4 && activeInspect === 'none' ? 1 : 0,
            pointerEvents: accessMacro || isShot4 ? 'auto' : 'none',
            zIndex: accessMacro ? 25 : 4,
          }}
        >
          <img
            src="/cinematic/shot4_contradiction_record.jpg"
            alt="Physical access record: 21:14:03 ACCESS GRANTED contradicting empty room footage"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#111315]/20 to-[#111315]/75" />
        </div>

        {/* ── SHOT 03: Discover Case File Folder on Evidence Table ── */}
        <div
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            opacity: caseFileMacro ? 1 : isShot3 && activeInspect === 'none' ? 1 : 0,
            pointerEvents: caseFileMacro || isShot3 ? 'auto' : 'none',
            zIndex: caseFileMacro ? 25 : 3,
          }}
        >
          <img
            src="/cinematic/shot2_case_file.jpg"
            alt="Physical case dossier reading: THE ROOM WAS EMPTY AT 21:14"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#111315]/15 to-[#111315]/80" />
        </div>

        {/* ── SHOT 02: Break the Frame (Camera Pulls Out of Monitor onto Table) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: isShot2 && activeInspect === 'none' ? 1 : 0,
            pointerEvents: isShot2 ? 'auto' : 'none',
          }}
        >
          {/* Courtroom Evidence Table Background */}
          <img
            src="/cinematic/shot6_desk_overview.jpg"
            alt="Courtroom table surface with vintage lamp and monitor housing"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* CRT Monitor Housing retreating in perspective */}
          <div
            className="relative transition-transform duration-700 ease-out"
            style={{
              transform: prefersReducedMotion ? undefined : `scale(${breakFrameScale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Monitor Outer Bezel Housing */}
            <div className="rounded-2xl border-[14px] border-[#181A1B] bg-[#0E1011] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
              {/* Inner CRT Screen Frame */}
              <div className="relative aspect-video w-[82vw] max-w-4xl overflow-hidden rounded-lg border-4 border-[#222527] bg-black">
                {/* Genuine CCTV Video Playing on CRT Monitor */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                  className="h-full w-full object-cover contrast-125 grayscale"
                >
                  <source src="/cinematic/cctv_surveillance_archive.webm" type="video/webm" />
                  <source src="/cinematic/cctv_surveillance_archive.mp4" type="video/mp4" />
                </video>

                {/* Fallback image if video fails to load or autoplay is blocked */}
                {(!videoLoaded || videoError) && (
                  <img
                    src="/cinematic/cctv_archive_empty.jpg"
                    alt="Surveillance monitor showing Archive B"
                    className="absolute inset-0 h-full w-full object-cover contrast-125 grayscale"
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-50" />
                {/* Live tape HUD */}
                <div className="absolute top-3 right-4 flex items-center gap-2 font-mono text-xs font-bold text-[#55DD77]">
                  <span className="h-2 w-2 shrink-0 animate-ping rounded-full bg-red-600" />
                  <span>● REC 21:14:00 EST // CAM 03</span>
                </div>
              </div>

              {/* Monitor Hardware Bezel Detail (Sony/PVM style dials) */}
              <div className="mt-2.5 flex items-center justify-between px-4 font-mono text-[9px] text-[#555859]">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="font-bold tracking-widest text-[#7B8084]">
                    ARCHIVE SURVEILLANCE PVM-2030
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[8px] uppercase">
                  <span>BRIGHTNESS</span>
                  <span>CONTRAST</span>
                  <span>CH 03</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SHOT 01: Inside the Recording (0.00 – 0.160, 0–3s) ── */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: isShot1 && activeInspect === 'none' ? 1 : 0,
            pointerEvents: isShot1 ? 'auto' : 'none',
          }}
        >
          {/* Authentic surveillance footage viewport */}
          <div className="relative h-full w-full">
            <img
              src="/cinematic/cctv_archive_empty.jpg"
              alt="CCTV surveillance feed of Archive B aisle at 21:14:00"
              className="h-full w-full object-cover contrast-125 grayscale"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-45" />
          </div>

          {/* Live Surveillance HUD */}
          <div className="pointer-events-none absolute top-[4.25rem] right-8 flex items-center justify-end gap-3 text-right font-mono text-xs font-bold tracking-widest text-[#55DD77] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="text-[#E5DED0]/80">CAM 03 — ARCHIVE B // NORTH PERIMETER</span>
            <span className="text-red-500">● REC [SP]</span>
            <span className="h-2.5 w-2.5 shrink-0 animate-ping rounded-full bg-red-600" />
          </div>

          <div className="pointer-events-none absolute top-6 right-16 font-mono text-sm font-bold tracking-widest text-[#55DD77] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {openingTimecode} EST
          </div>
        </div>
      </div>

      {/* ── Rain Streaks Canvas on Archival Window ── */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 opacity-45 mix-blend-screen"
      />

      {/* ── Dark Filmic Vignette ── */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-radial from-transparent via-[#111315]/15 to-[#111315]/85" />

      {/* ── POST-CINEMATIC IN-WORLD INSPECTION OVERLAYS (NO DASHBOARDS!) ── */}

      {/* 1. MONITOR IN-WORLD MACRO SCRUBBER (When inspecting monitor) */}
      <AnimatePresence>
        {activeInspect === 'monitor' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto fixed bottom-8 left-1/2 z-40 w-[92%] max-w-lg -translate-x-1/2"
          >
            <div className="rounded border border-[#555859]/40 bg-[#111315]/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#292E30] pb-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#C6A16B]">
                  <Clock className="h-4 w-4" />
                  <span className="tracking-wider uppercase">SURVEILLANCE RECORDER // CAM 03</span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectObject('none')}
                  className="flex items-center gap-1 text-[10px] text-[#555859] transition-colors hover:text-[#E5DED0]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to Chamber [Esc]</span>
                </button>
              </div>

              {/* Tape Transport Controls */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 rounded border border-[#C6A16B]/60 bg-[#C6A16B]/15 px-3 py-1.5 font-mono text-xs text-[#E5DED0] transition-colors hover:bg-[#C6A16B]/30"
                >
                  {isPlayingTape ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  <span>{isPlayingTape ? 'PAUSE' : 'PLAY TAPE'}</span>
                </button>

                <div className="grid flex-1 grid-cols-4 gap-1">
                  {TIMECODES.map((tc, idx) => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => handleScrub(idx)}
                      className={`border py-1.5 font-mono text-[10px] tracking-wider transition-all ${
                        monitorTimeIndex === idx
                          ? 'border-[#C6A16B] bg-[#C6A16B]/20 font-bold text-[#E5DED0]'
                          : idx === 2
                            ? 'border-[#782F37]/80 bg-[#782F37]/20 text-[#782F37]'
                            : 'border-[#292E30] text-[#555859] hover:border-[#555859]'
                      }`}
                    >
                      {tc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live tape preview */}
              <div className="mt-2.5 flex items-center gap-3">
                <div className="relative w-32 shrink-0 overflow-hidden rounded border border-[#292E30] bg-black sm:w-40">
                  <div className="aspect-video w-full">
                    <img
                      src={
                        monitorTimeIndex === 2 || monitorTimeIndex === 3
                          ? '/cinematic/cctv_archive_silhouette.jpg'
                          : '/cinematic/cctv_archive_empty.jpg'
                      }
                      alt={`Surveillance tape at ${TIMECODES[monitorTimeIndex]}`}
                      className="h-full w-full object-cover contrast-125 grayscale"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_3px] opacity-50" />
                  <span className="absolute right-1.5 bottom-1 font-mono text-[8px] font-bold tracking-wider text-[#55DD77]">
                    {TIMECODES[monitorTimeIndex]} EST
                  </span>
                  {(monitorTimeIndex === 2 || monitorTimeIndex === 3) && (
                    <span className="absolute bottom-1 left-1.5 rounded-sm bg-[#782F37]/90 px-1 font-mono text-[7px] font-bold tracking-widest text-white uppercase">
                      SILHOUETTE
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-[#9C948A]">
                  {monitorTimeIndex === 2 || monitorTimeIndex === 3
                    ? '21:14:03 EST: Silhouette reflection appears in corridor doorway as lock disengages.'
                    : '21:14:00 EST: Archive aisle appears vacant on surface inspection.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CASE FILE MACRO INSPECTION OVERLAY */}
      <AnimatePresence>
        {activeInspect === 'case_file' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto fixed bottom-8 left-1/2 z-40 w-[92%] max-w-lg -translate-x-1/2"
          >
            <div className="rounded border border-[#555859]/40 bg-[#111315]/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#292E30] pb-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#C6A16B]">
                  <FileText className="h-4 w-4" />
                  <span className="tracking-wider uppercase">ARCHIVE DOSSIER 094-B</span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectObject('none')}
                  className="flex items-center gap-1 text-[10px] text-[#555859] transition-colors hover:text-[#E5DED0]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to Chamber [Esc]</span>
                </button>
              </div>

              <div className="mt-3">
                <span className="font-mono text-[9px] tracking-widest text-[#555859] uppercase">
                  RECORDED CLAIM:
                </span>
                <p className="mt-0.5 font-serif text-lg text-[#E5DED0]">
                  “THE ROOM WAS EMPTY AT 21:14.”
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-[#9C948A]">
                  Attestation asserts no occupant present. Directly challenged by security access
                  record #0482 at 21:14:03.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ACCESS RECORD MACRO INSPECTION OVERLAY */}
      <AnimatePresence>
        {activeInspect === 'access_record' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto fixed bottom-8 left-1/2 z-40 w-[92%] max-w-lg -translate-x-1/2"
          >
            <div className="rounded border border-[#782F37]/60 bg-[#111315]/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#782F37]/40 pb-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#782F37]">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="tracking-wider uppercase">ELECTRONIC DEADBOLT REGISTER</span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectObject('none')}
                  className="flex items-center gap-1 text-[10px] text-[#555859] transition-colors hover:text-[#E5DED0]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to Chamber [Esc]</span>
                </button>
              </div>

              <div className="mt-3 space-y-1 font-mono text-xs text-[#E5DED0]">
                <div>
                  TIMESTAMP: <strong className="text-[#C6A16B]">21:14:03 EST</strong>
                </div>
                <div>
                  AUTHENTICATION:{' '}
                  <strong className="text-[#E5DED0]">KEYCARD #0482 // ENTRY CONFIRMED</strong>
                </div>
                <p className="pt-1.5 font-serif text-xs text-[#9C948A] italic">
                  Physical deadbolt separation authenticated. The claim of an empty room is
                  irreconcilable.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. COMPARE DUAL COMPOSITION OVERLAY */}
      <AnimatePresence>
        {activeInspect === 'compare' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto fixed bottom-8 left-1/2 z-40 w-[92%] max-w-xl -translate-x-1/2"
          >
            <div className="rounded border border-[#555859]/40 bg-[#111315]/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#292E30] pb-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#C6A16B]">
                  <Layers className="h-4 w-4" />
                  <span className="tracking-wider uppercase">CORRELATION: CLAIM VS RECORD</span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectObject('none')}
                  className="flex items-center gap-1 text-[10px] text-[#555859] transition-colors hover:text-[#E5DED0]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to Chamber [Esc]</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="border border-[#292E30] bg-[#141618] p-2.5">
                  <span className="block text-[9px] text-[#555859]">CLAIM:</span>
                  <span className="text-[#E5DED0]">Room empty at 21:14</span>
                </div>
                <div className="border border-[#782F37]/50 bg-[#782F37]/15 p-2.5">
                  <span className="block text-[9px] text-[#782F37]">RECORD:</span>
                  <span className="text-[#E5DED0]">Access 21:14:03 (Keycard 0482)</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#292E30] pt-2">
                <p className="font-serif text-xs text-[#9C948A] italic">
                  The camera was lying. Truth demands adversarial scrutiny.
                </p>
                <button
                  type="button"
                  onClick={onEnterCourt}
                  className="cursor-pointer rounded border border-[#782F37] bg-[#782F37]/30 px-3 py-1 font-mono text-[10px] text-[#E5DED0] transition-colors hover:bg-[#782F37]/60"
                >
                  Enter Court &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBTLE IN-WORLD SELECTION PROMPTS (Only in settled final state) ── */}
      <AnimatePresence>
        {isPostCinematic && activeInspect === 'none' && !isEntering && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pointer-events-auto fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 font-mono text-[10px] tracking-[0.2em] text-[#555859] uppercase sm:bottom-8 sm:text-[11px]"
          >
            <button
              type="button"
              onClick={() => onInspectObject('case_file')}
              className="cursor-pointer transition-colors hover:text-[#E5DED0]"
            >
              [1] Case File
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onInspectObject('monitor')}
              className="cursor-pointer transition-colors hover:text-[#E5DED0]"
            >
              [2] CRT Monitor
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onInspectObject('access_record')}
              className="cursor-pointer transition-colors hover:text-[#E5DED0]"
            >
              [3] Access Log
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onInspectObject('compare')}
              className="cursor-pointer transition-colors hover:text-[#C6A16B]"
            >
              [C] Correlate
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
