/**
 * Card Component
 * 
 * Clean card design with consistent styling
 */

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  const isInteractive = hoverable || !!onClick;

  return (
    <motion.div
      whileHover={isInteractive ? { y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-[var(--card)]  text-[var(--card-foreground)] border border-[var(--border)] rounded-2xl shadow-sm ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-8 ${className} `}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-3xl md:!text-4xl inline-flex my-3 items-center font-bold  text-[var(--foreground)] ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-[var(--muted-foreground)] mt-2 ${className}`}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 pb-8 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 pb-8 pt-4 border-t border-[var(--border)] ${className}`}>
      {children}
    </div>
  );
};