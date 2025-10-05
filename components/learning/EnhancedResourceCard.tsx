/**
 * Enhanced Resource Card Component with Embedded Player
 * 
 * Features:
 * - Click to open YouTube videos in modal with embedded player
 * - Real-time progress tracking
 * - Bookmark/favorite functionality
 * - Visual progress indicators
 * - Interactive engagement tracking
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Resource } from '@/types';
import { YouTubePlayer } from './YouTubePlayer';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedResourceCardProps {
  resource: Resource;
  onStart?: (resourceId: string) => void;
  onComplete?: (resourceId: string) => void;
  onProgress?: (resourceId: string, data: { watchTime: number; progress: number }) => void;
  isCompleted?: boolean;
  progress?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (resourceId: string) => void;
}

export const EnhancedResourceCard: React.FC<EnhancedResourceCardProps> = ({
  resource,
  onStart,
  onComplete,
  onProgress,
  isCompleted = false,
  progress = 0,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'video': return '▶️';
      case 'article': return '📄';
      case 'interactive': return '🎮';
      case 'quiz': return '❓';
      case 'exercise': return '💪';
      default: return '📚';
    }
  };

  const getDifficultyColor = (difficulty?: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'default';
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTubeVideo = resource.type === 'video' && getYouTubeVideoId(resource.url);

  const handleResourceClick = () => {
    if (onStart) {
      onStart(resource.id);
    }

    if (isYouTubeVideo) {
      setShowPlayer(true);
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const handlePlayerProgress = (data: { watchTime: number; progress: number; completed: boolean }) => {
    if (onProgress) {
      onProgress(resource.id, { watchTime: data.watchTime, progress: data.progress });
    }

    if (data.completed && onComplete) {
      onComplete(resource.id);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card hoverable className="h-full flex flex-col relative overflow-hidden">
          {/* Progress indicator */}
          {progress > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-10">
              <motion.div
                className="h-full bg-[var(--primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Thumbnail with overlay */}
          {resource.thumbnailUrl && (
            <div className="w-full h-48 overflow-hidden rounded-t-xl relative group">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${resource.thumbnailUrl})` }}
              />
              
              {/* Play overlay for videos */}
              {isYouTubeVideo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center cursor-pointer"
                    onClick={handleResourceClick}
                  >
                    <span className="text-3xl ml-1">▶️</span>
                  </motion.div>
                </motion.div>
              )}

              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleFavorite) onToggleFavorite(resource.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
              >
                <span className="text-lg">{isFavorite ? '❤️' : '🤍'}</span>
              </button>

              {/* Duration badge for videos */}
              {resource.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {resource.duration} min
                </div>
              )}
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                  {isCompleted && <Badge variant="success" size="sm">✓ Completed</Badge>}
                  {progress > 0 && progress < 100 && (
                    <Badge variant="primary" size="sm">{Math.round(progress)}%</Badge>
                  )}
                </div>
                <div onClick={handleResourceClick}>
                  <CardTitle className="text-lg hover:text-[var(--primary)] transition-colors cursor-pointer">
                    {resource.title}
                  </CardTitle>
                </div>
              </div>
            </div>
            {resource.description && (
              <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="flex-1">
            <div className="flex flex-wrap gap-2">
              {resource.difficulty && (
                <Badge variant={getDifficultyColor(resource.difficulty)}>
                  {resource.difficulty}
                </Badge>
              )}
              {resource.provider && (
                <Badge variant="default">{resource.provider}</Badge>
              )}
              {resource.estimatedTime && (
                <Badge variant="default">⏱️ {resource.estimatedTime} min</Badge>
              )}
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded">
                    +{resource.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant={isCompleted ? 'outline' : 'primary'}
                fullWidth
                onClick={handleResourceClick}
              >
                {isCompleted ? '📖 Review' : isYouTubeVideo ? '▶️ Watch' : '🚀 Start Learning'}
              </Button>
              {!isCompleted && onComplete && (
                <Button
                  variant="secondary"
                  onClick={() => onComplete(resource.id)}
                >
                  ✓
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* YouTube Player Modal */}
      <AnimatePresence>
        {showPlayer && isYouTubeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPlayer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowPlayer(false)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              <YouTubePlayer
                videoId={getYouTubeVideoId(resource.url)!}
                title={resource.title}
                onProgress={handlePlayerProgress}
                onComplete={() => {
                  if (onComplete) onComplete(resource.id);
                }}
                initialProgress={progress}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
