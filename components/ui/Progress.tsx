/**
 * Progress Bar Component
 * 
 * Smooth animated progress indicator
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
};

const colorStyles = {
  primary: 'bg-gradient-to-r from-blue-500 to-purple-500',
  secondary: 'bg-gray-600',
  accent: 'bg-orange-500',
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
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-gray-900">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorStyles[color]}`}
        />
      </div>
    </div>
  );
};