/**
 * All Learning Paths Page
 * 
 * Displays all user's learning paths with filtering and sorting
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { api } from '@/services/api';
import type { LearningPath } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AllLearningPathsPage() {
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        setLoading(true);
        const response = await api.learning.getPaths();

        if (response.success && response.data) {
          console.log('Fetched paths:', response.data);
          console.log('Paths with IDs:', response.data.filter(p => p.id));
          console.log('Paths without IDs:', response.data.filter(p => !p.id));
          
          // Log each path's ID explicitly
          response.data.forEach((path, idx) => {
            console.log(`Path ${idx}:`, {
              id: path.id,
              name: path.name,
              hasId: !!path.id,
              idType: typeof path.id
            });
          });
          
          setPaths(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch learning paths');
        }

        setError(null);
      } catch (err) {
        console.error('Fetch paths error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load learning paths');
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  const filteredPaths = paths.filter((path) => {
    if (filter === 'all') return true;
    return path.status === filter;
  });

  const getStatusVariant = (status: string): 'primary' | 'secondary' | 'accent' | 'default' => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'accent';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full"
            />
            <p className="text-[var(--muted-foreground)] text-lg">Loading learning paths...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">Your Learning Paths</h1>
              <p className="text-lg text-[var(--muted-foreground)]">
                Manage and track your learning journeys
              </p>
            </div>
            <Link href="/dashboard/learning/generate">
              <Button variant="primary" leftIcon={<span>✨</span>}>
                Create New Path
              </Button>
            </Link>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {(['all', 'active', 'completed', 'paused'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline'}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${paths.length})`}
                {status !== 'all' && ` (${paths.filter((p) => p.status === status).length})`}
              </Button>
            ))}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold">Error</h3>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {filteredPaths.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold mb-2">No Learning Paths Yet</h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  {filter === 'all'
                    ? 'Start your learning journey by creating your first path'
                    : `No ${filter} paths found`}
                </p>
                <Link href="/dashboard/learning/generate">
                  <Button variant="primary">Create Your First Path</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaths.map((path, index) => {
              const pathHref = `/dashboard/learning/paths/${path.id || 'unknown'}`;
              console.log(`Rendering path card ${index}:`, { 
                id: path.id, 
                href: pathHref,
                pathKeys: Object.keys(path)
              });
              
              return (
              <motion.div
                key={path.id || `path-${path.userId}-${index}`}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link href={pathHref}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 flex-1">{path.name}</CardTitle>
                        <Badge variant={getStatusVariant(path.status)} size="sm">
                          {path.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[var(--muted-foreground)] mb-4 line-clamp-3">
                        {path.description || 'Continue your learning journey'}
                      </p>

                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-[var(--muted-foreground)]">Progress</span>
                            <span className="font-semibold">{path.progress}%</span>
                          </div>
                          <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full transition-all"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[var(--muted)] rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{path.steps?.length || 0}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">Steps</div>
                          </div>
                          <div className="bg-[var(--muted)] rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">
                              {path.steps?.filter((s) => s.status === 'completed').length || 0}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">Completed</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
