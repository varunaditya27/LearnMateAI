/**
 * Resource Card Component
 * 
 * Displays learning resources (videos, articles) as interactive cards.
 * Tracks user engagement when resources are accessed.
 * 
 * TODO: Implement embedded player for YouTube videos
 * TODO: Add bookmark/favorite functionality
 * TODO: Track actual watch time using YouTube API
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Resource } from '@/types';

interface ResourceCardProps {
  resource: Resource;
  onStart?: (resourceId: string) => void;
  onComplete?: (resourceId: string) => void;
  isCompleted?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onStart,
  onComplete,
  isCompleted = false,
}) => {
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

  const handleStart = () => {
    if (onStart) {
      onStart(resource.id);
    }
    // Open resource in new tab
    window.open(resource.url, '_blank');
  };

  return (
    <Card hoverable className="h-full flex flex-col">
      {/* Thumbnail */}
      {resource.thumbnailUrl && (
        <div className="w-full h-48 overflow-hidden rounded-t-xl">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${resource.thumbnailUrl})` }}
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getTypeIcon(resource.type)}</span>
              {isCompleted && <Badge variant="success" size="sm">✓ Completed</Badge>}
            </div>
            <CardTitle className="text-lg">{resource.title}</CardTitle>
          </div>
        </div>
        {resource.description && (
          <CardDescription>{resource.description}</CardDescription>
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
                className="text-xs px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button
            variant={isCompleted ? 'outline' : 'primary'}
            fullWidth
            onClick={handleStart}
          >
            {isCompleted ? 'Review' : 'Start Learning'}
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
  );
};
