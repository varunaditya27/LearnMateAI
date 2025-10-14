'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/lib/auth';
import {
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Users,
  Sun,
  Zap,
  Award,
  BookOpen,
  GraduationCap,
  FolderGit2,
  BotMessageSquare,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutGrid },
  { label: 'Progress', href: '/dashboard/progress', icon: BarChart2 },
  { label: 'Screen Time', href: '/dashboard/screen-time', icon: Sun },
  { label: 'Community', href: '/dashboard/community', icon: Users },
  { label: 'Motivation', href: '/dashboard/motivation', icon: Zap },
  { label: 'Roadmap', href: '/dashboard/roadmap', icon: Award },
  { label: 'Quiz Center', href: '/dashboard/quiz', icon: BookOpen },
  { label: 'Resources', href: '/dashboard/resources', icon: FolderGit2 },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Award },
  {
    label: 'Learning',
    href: '/dashboard/learning',
    icon: GraduationCap,
    subItems: [
      { label: 'Paths', href: '/dashboard/learning/paths', icon: FolderGit2 },
      { label: 'Generate', href: '/dashboard/learning/generate', icon: BotMessageSquare },
    ],
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAuthStore((state) => state.user);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isSubmenuOpen = (label: string) => openSubmenus[label] || false;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error('[Sidebar] Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const getUserAvatar = () => {
    if (user?.photoURL) {
      return (
        <Image
          src={user.photoURL}
          alt={user.displayName || 'User'}
          width={40}
          height={40}
          className="rounded-full border-2 border-[var(--border)] object-cover"
        />
      );
    }
    const initial = user?.displayName?.[0]?.toUpperCase() || 'U';
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-bold">
        {initial}
      </div>
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const isSubmenuActive = item.subItems?.some(sub => pathname.startsWith(sub.href));

    if (item.subItems) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleSubmenu(item.label)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
              isSubmenuActive ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
            } hover:bg-[var(--muted)]`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${isSubmenuOpen(item.label) ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {isSubmenuOpen(item.label) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-4 pl-3 mt-1 space-y-1 border-l border-[var(--border)]"
              >
                {item.subItems.map(renderNavItem)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
          isActive
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 w-56 h-screen bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-40">
      <div className="h-20 flex items-center px-6 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onLinkClick}>
          <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight hover:opacity-80 transition-opacity">
            LearnMateAI
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3 mb-4">
          {getUserAvatar()}
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm text-[var(--foreground)] truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[var(--foreground)] bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;