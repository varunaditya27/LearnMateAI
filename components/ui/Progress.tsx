/**
 * Progress Bar Component
 * 
 * A visual progress indicator with smooth animations.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorStyles = {
  primary: 'bg-[var(--primary)]',
  secondary: 'bg-[var(--secondary)]',
  accent: 'bg-[var(--accent)]',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  showLabel = false,
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-semibold">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--muted)] rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorStyles[color]}`}
        />
      </div>
    </div>
  );
};
