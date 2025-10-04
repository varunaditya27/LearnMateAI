/**
 * Button Component
 * 
 * User-friendly buttons with proper padding and spacing
 */

import React from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-md hover:shadow-lg',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90 shadow-sm hover:shadow-md',
  accent: 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 shadow-md hover:shadow-lg',
  outline: 'border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--primary)]',
  ghost: 'text-[var(--foreground)] hover:bg-[var(--muted)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  onClick,
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-3
        font-semibold rounded-xl h-10
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : 'min-w-[140px]'}
        ${className}
      `}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="text-lg">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="text-lg">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};