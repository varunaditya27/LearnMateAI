/**
 * Badge Component
 * 
 * Clean badge for labels and status indicators
 */

import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  secondary: 'bg-purple-100 text-purple-700',
  accent: 'bg-orange-100 text-orange-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm font-medium',
  md: 'px-5 py-2.5 text-sm font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  return (
    <span
className={`inline-flex items-center justify-center rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}    >
      {children}
    </span>
  );
};