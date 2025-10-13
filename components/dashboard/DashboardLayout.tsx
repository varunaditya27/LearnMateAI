/**
 * Dashboard Layout Component
 * 
 * Clean top navigation with CSS variable-based theming
 * Includes user avatar, logout functionality, and responsive design
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">
                LearnMateAI
              </h1>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="relative h-full">
                <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-8 lg:pt-12 lg:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};