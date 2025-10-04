/**
 * Dashboard Layout Component
 * 
 * Main layout for the dashboard with sidebar navigation and top bar.
 * Responsive design with mobile support.
 * 
 * TODO: Add mobile menu toggle
 * TODO: Add breadcrumb navigation
 * TODO: Add notification center
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Learning Path', href: '/dashboard/learning', icon: '🎯' },
  { label: 'Progress', href: '/dashboard/progress', icon: '📈' },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: '🏆' },
  { label: 'Screen Time', href: '/dashboard/screen-time', icon: '⏱️' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--card)] border-b border-[var(--border)] z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <span className="text-2xl">☰</span>
            </button>
            <h1 className="text-2xl font-heading font-bold text-[var(--primary)]">
              LearnMate
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Streak Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-full">
              <span>🔥</span>
              <span className="font-semibold">5 Day Streak</span>
            </div>
            
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-[var(--card)] border-r border-[var(--border)]
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${
                        isActive
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'hover:bg-[var(--muted)]'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer - Daily Goal */}
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-sm font-medium mb-2">Daily Goal</p>
            <div className="w-full bg-[var(--background)] rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[var(--secondary)] w-[60%]" />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              36 / 60 minutes
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
