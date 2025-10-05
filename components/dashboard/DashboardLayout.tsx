/**
 * Dashboard Layout Component
 * 
 * Clean top navigation with CSS variable-based theming
 * Includes user avatar, logout functionality, and responsive design
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Progress', href: '/dashboard/progress' },
  { label: 'Screen Time', href: '/dashboard/screen-time' },
  { label: 'Community', href: '/dashboard/community' },
  { label: 'Motivation', href: '/dashboard/motivation' },
  { label: 'Roadmap', href: '/dashboard/roadmap' },
  { label: 'Quiz Center', href: '/dashboard/quiz' },
  { label: 'Resources', href: '/dashboard/resources' },
  { label: 'Leaderboard', href: '/dashboard/leaderboard' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user from Zustand store
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error('[DashboardLayout] Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Get user avatar display
  const getUserAvatar = () => {
    if (user?.photoURL) {
      return (
        <Image
          src={user.photoURL}
          alt={user.displayName || 'User'}
          width={44}
          height={44}
          className="rounded-full border-2 border-[var(--border)] object-cover"
        />
      );
    }

    const initial = user?.displayName?.[0]?.toUpperCase() || 'U';
    return (
      <div className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-bold shadow-lg">
        {initial}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight hover:opacity-80 transition-opacity">
                LearnMateAI
              </h1>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`px-5 py-2.5 rounded-lg font-medium transition-all ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--foreground)] hover:bg-[var(--muted)]'}`}>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="hidden md:block">
                {getUserAvatar()}
              </div>

              {/* Desktop Logout Button */}
<button
  onClick={handleLogout}
  disabled={isLoggingOut}
  className="hidden md:flex items-center gap-2 !px-5 !py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-600 dark:text-red-400 text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoggingOut ? (
    <>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      Logging out...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </>
  )}
</button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[var(--border)] bg-[var(--card)]"
            >
              <nav className="px-6 py-4 space-y-2">
                {/* User Info in Mobile Menu */}
                <div className="flex items-center gap-3 px-4 py-3 mb-2 border-b border-[var(--border)]">
                  {getUserAvatar()}
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                {/* Navigation Links */}
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block !px-4 !py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--foreground)] hover:bg-[var(--muted)]'}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Mobile Logout Button */}
<button
  onClick={handleLogout}
  disabled={isLoggingOut}
  className="flex items-center gap-2 w-full text-left !px-4 !py-3 rounded-lg font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoggingOut ? (
    <>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      Logging out...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </>
  )}
</button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8 lg:pt-20 lg:pb-12">
        {children}
      </main>
    </div>
  );
};