"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UnifiedVideoPlayerProps {
  courseId: number;
  lessonId: number;
  videoId: number;
  title: string;
  provider: 'youtube' | 'tasklynk_hosted' | 'cloudflare_stream' | 'bunny_stream';
  videoUrl: string;
  externalVideoId?: string | null;
  initialPositionSeconds?: number;
  durationSeconds?: number;
  minCompletionPercentage?: number;
  onProgressUpdate?: (data: { percentageWatched: number; isCompleted: boolean }) => void;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const UnifiedVideoPlayer: React.FC<UnifiedVideoPlayerProps> = ({
  courseId,
  lessonId,
  videoId,
  title,
  provider,
  videoUrl,
  externalVideoId,
  initialPositionSeconds = 0,
  durationSeconds = 0,
  minCompletionPercentage = 80,
  onProgressUpdate,
  onNextLesson,
  onPrevLesson,
  hasNext,
  hasPrev,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(durationSeconds || 1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [percentageWatched, setPercentageWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Extract YouTube ID if needed
  const getYouTubeId = useCallback((): string => {
    if (externalVideoId && externalVideoId.length === 11) return externalVideoId;
    const match = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : 'dQw4w9WgXcQ';
  }, [externalVideoId, videoUrl]);

  const isYouTube = provider === 'youtube' || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Send progress heartbeat to authoritative server
  const sendHeartbeat = useCallback(
    async (pos: number, dur: number) => {
      if (dur <= 0) return;
      try {
        setIsSyncing(true);
        const res = await fetch('/api/training/progress/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId,
            videoId,
            currentPositionSeconds: pos,
            durationSeconds: dur,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPercentageWatched(data.percentageWatched);
          if (data.isCompleted) {
            setIsCompleted(true);
          }
          if (onProgressUpdate) {
            onProgressUpdate({
              percentageWatched: data.percentageWatched,
              isCompleted: data.isCompleted,
            });
          }
        }
      } catch (err) {
        console.warn('Heartbeat error:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [courseId, lessonId, videoId, onProgressUpdate]
  );

  // Setup periodic heartbeat
  useEffect(() => {
    if (isPlaying) {
      heartbeatTimerRef.current = setInterval(() => {
        let pos = currentTime;
        let dur = duration;
        if (isYouTube && ytPlayerRef.current?.getCurrentTime) {
          pos = ytPlayerRef.current.getCurrentTime();
          dur = ytPlayerRef.current.getDuration() || dur;
          setCurrentTime(pos);
          setDuration(dur);
        } else if (videoRef.current) {
          pos = videoRef.current.currentTime;
          dur = videoRef.current.duration || dur;
          setCurrentTime(pos);
          setDuration(dur);
        }
        sendHeartbeat(pos, dur);
      }, 5000);
    } else {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    }

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isPlaying, currentTime, duration, isYouTube, sendHeartbeat]);

  // Initial YouTube API setup
  useEffect(() => {
    if (!isYouTube) return;

    let destroyed = false;

    const initYT = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;
      const elementId = `yt-player-${videoId}`;
      const elem = document.getElementById(elementId);
      if (!elem) return;

      ytPlayerRef.current = new window.YT.Player(elementId, {
        videoId: getYouTubeId(),
        playerVars: {
          autoplay: 0,
          start: Math.floor(initialPositionSeconds),
          modestbranding: 1,
          rel: 0,
          controls: 1,
        },
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            if (dur) setDuration(dur);
            if (initialPositionSeconds > 0) {
              event.target.seekTo(initialPositionSeconds, true);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
              const pos = event.target.getCurrentTime();
              const dur = event.target.getDuration() || duration;
              sendHeartbeat(pos, dur);
            } else if (event.data === 0) {
              setIsPlaying(false);
              const dur = event.target.getDuration() || duration;
              sendHeartbeat(dur, dur);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => initYT();
      document.body.appendChild(tag);
    }

    return () => {
      destroyed = true;
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [isYouTube, videoId, getYouTubeId, initialPositionSeconds, sendHeartbeat, duration]);

  // Native HTML5 Video handlers
  const handleNativePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      sendHeartbeat(videoRef.current.currentTime, videoRef.current.duration || duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = Number(e.target.value);
    setCurrentTime(newPos);
    if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(newPos, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newPos;
    }
    sendHeartbeat(newPos, duration);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
    >
      {/* Video Viewport */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {isYouTube ? (
          <div className="w-full h-full">
            <div id={`yt-player-${videoId}`} className="w-full h-full" />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                if (videoRef.current.duration) setDuration(videoRef.current.duration);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                sendHeartbeat(videoRef.current.currentTime, videoRef.current.duration);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                sendHeartbeat(videoRef.current.duration, videoRef.current.duration);
              }
            }}
            controls
          />
        )}
      </div>

      {/* Progress Sync Bar & Status */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(100, percentageWatched)}%` }}
            />
          </div>

          <span className="font-mono text-slate-400">
            {percentageWatched}% watched
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Lesson Completed ({minCompletionPercentage}% met)
            </span>
          ) : (
            <span className="text-slate-400">
              Watch {minCompletionPercentage}% to complete
            </span>
          )}

          {isSyncing && (
            <span className="text-[10px] text-slate-500 animate-pulse">
              Syncing progress...
            </span>
          )}
        </div>

        {/* Lesson Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          {hasPrev && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPrevLesson}
              className="h-8 px-2.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
          )}

          {hasNext && (
            <Button
              size="sm"
              onClick={onNextLesson}
              className="h-8 px-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs"
            >
              Next Lesson
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
