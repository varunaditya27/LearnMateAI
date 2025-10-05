/**
 * Interactive YouTube Player Component
 * 
 * Features:
 * - Embedded YouTube iframe with full controls
 * - Real-time watch time tracking
 * - Playback speed controls
 * - Note-taking while watching
 * - Focus time tracking (tab visibility)
 * - Automatic progress saving
 * - Completion detection
 * - Interactive timestamps
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onProgress: (data: {
    watchTime: number;
    progress: number;
    completed: boolean;
  }) => void;
  onComplete?: () => void;
  initialProgress?: number;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  playbackRate: number;
}

interface Note {
  id: string;
  timestamp: number;
  text: string;
  createdAt: Date;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  onProgress,
  onComplete,
  initialProgress = 0,
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: initialProgress,
    playbackRate: 1,
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const playerRef = useRef<YTPlayer | null>(null);
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
      }
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, []);

  // Handle player state changes
  const handlePlayerStateChange = useCallback((event: YTEvent) => {
    const state = event.data;
    
    if (state === window.YT.PlayerState.PLAYING) {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      startWatchTimeTracking();
    } else {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      stopWatchTimeTracking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track tab visibility for focus time
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(`player-${videoId}`, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: YTEvent) => {
              const duration = event.target.getDuration();
              setPlayerState((prev) => ({ ...prev, duration }));
            },
            onStateChange: handlePlayerStateChange,
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId, handlePlayerStateChange]);

  // Start tracking watch time
  const startWatchTimeTracking = () => {
    watchTimeIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const progress = (currentTime / duration) * 100;

        setPlayerState((prev) => ({
          ...prev,
          currentTime,
          progress,
        }));

        setWatchTime((prev) => prev + 1);
        
        if (isTabVisible) {
          setFocusTime((prev) => prev + 1);
        }

        // Check for completion (90% watched)
        if (progress >= 90 && onComplete) {
          onComplete();
        }
      }
    }, 1000);

    // Save progress every 10 seconds
    progressUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const progress = (currentTime / duration) * 100;

        onProgress({
          watchTime,
          progress,
          completed: progress >= 90,
        });
      }
    }, 10000);
  };

  // Stop tracking
  const stopWatchTimeTracking = () => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
    }
    if (progressUpdateIntervalRef.current) {
      clearInterval(progressUpdateIntervalRef.current);
    }
  };

  // Add note at current timestamp
  const addNote = () => {
    if (!currentNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      timestamp: playerState.currentTime,
      text: currentNote,
      createdAt: new Date(),
    };

    setNotes((prev) => [...prev, note]);
    setCurrentNote('');
  };

  // Jump to timestamp
  const jumpToTimestamp = (timestamp: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(timestamp, true);
    }
  };

  // Change playback speed
  const changePlaybackRate = (rate: number) => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
      setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate engagement score
  const engagementScore = Math.round((focusTime / watchTime) * 100) || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-xl mb-2">{title}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default" className="bg-white/20">
                Progress: {Math.round(playerState.progress)}%
              </Badge>
              <Badge variant="default" className="bg-white/20">
                Watch Time: {formatTime(watchTime)}
              </Badge>
              <Badge variant="default" className="bg-white/20">
                Focus: {engagementScore}%
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="bg-white/10 backdrop-blur"
          >
            {showNotes ? '📹 Video' : '📝 Notes'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Video Player */}
          <div className={`${showNotes ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="aspect-video bg-black relative">
              <div id={`player-${videoId}`} className="w-full h-full" />
              
              {/* Overlay controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex gap-2">
                    <span className="text-sm">{formatTime(playerState.currentTime)}</span>
                    <span className="text-sm">/</span>
                    <span className="text-sm">{formatTime(playerState.duration)}</span>
                  </div>
                  
                  {/* Playback speed */}
                  <div className="flex gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`px-2 py-1 text-xs rounded ${
                          playerState.playbackRate === rate
                            ? 'bg-white text-black'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200">
              <motion.div
                className="h-full bg-[var(--primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${playerState.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]">
                  {Math.round(playerState.progress)}%
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]">
                  {formatTime(watchTime)}
                </div>
                <div className="text-xs text-gray-600">Watch Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--primary)]">
                  {engagementScore}%
                </div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
            </div>
          </div>

          {/* Notes Panel */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-50 p-4 border-l border-gray-200 overflow-y-auto max-h-[600px]"
              >
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  📝 Notes & Timestamps
                  <Badge variant="primary">{notes.length}</Badge>
                </h3>

                {/* Add note */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addNote()}
                      placeholder="Add a note at current time..."
                      className="flex-1 px-3 py-2 border rounded text-sm"
                    />
                    <Button size="sm" onClick={addNote}>
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current time: {formatTime(playerState.currentTime)}
                  </p>
                </div>

                {/* Notes list */}
                <div className="space-y-3">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3 rounded border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => jumpToTimestamp(note.timestamp)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="default" size="sm">
                          {formatTime(note.timestamp)}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotes((prev) => prev.filter((n) => n.id !== note.id));
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-700">{note.text}</p>
                    </motion.div>
                  ))}

                  {notes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No notes yet</p>
                      <p className="text-xs mt-1">Add notes while watching</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayerConfig {
  videoId: string;
  playerVars?: Record<string, number>;
  events?: {
    onReady?: (event: YTEvent) => void;
    onStateChange?: (event: YTEvent) => void;
  };
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
}

interface YTEvent {
  target: YTPlayer;
  data: number;
}
