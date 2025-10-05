/**
 * Landing Page
 * 
 * Main entry point for the application.
 */

'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-purple-600 to-[var(--secondary)] flex flex-col">
      {/* Hero Section - Takes significant portion of viewport */}
      <section className="flex-shrink-0 flex items-center justify-center px-8 py-20 min-h-[45vh]">
        <div className="text-center text-white max-w-5xl w-full flex flex-col items-center">
          <h1 className="text-6xl font-heading font-bold mb-12">
            📚 LearnMate
          </h1>
          <p className="text-2xl mb-10 font-medium">
            AI That Makes Learning Addictive
          </p>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-16 leading-relaxed px-4">
            Your personal AI-powered learning companion. Structured paths, smart reminders,
            gamified progress tracking, and community-driven growth.
          </p>
          
          {/* PROPER RECTANGULAR BUTTONS WITH CENTERED TEXT */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-2xl">
            <Link href="/register" className="w-full sm:w-auto">
              <div className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-20 py-5 rounded-lg transition-all hover:scale-105 w-full sm:w-64 h-20 flex items-center justify-center">
                Get Started Free
              </div>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <div className="border-2 border-white text-white font-bold text-xl px-20 py-5 rounded-lg hover:bg-white/10 transition-all hover:scale-105 w-full sm:w-64 h-20 flex items-center justify-center">
                Sign In
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Takes middle portion */}
      <section className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {[
              {
                icon: '🎯',
                title: 'Personalized Learning',
                description: 'AI-generated learning paths tailored to your goals and pace',
              },
              {
                icon: '🔥',
                title: 'Streak Tracking',
                description: 'Build consistency with daily streaks and habit formation',
              },
              {
                icon: '🏆',
                title: 'Gamification',
                description: 'Earn points, level up, and compete on leaderboards',
              },
              {
                icon: '💡',
                title: 'Smart Reminders',
                description: 'AI-powered nudges to keep you on track',
              },
              {
                icon: '⏱',
                title: 'Screen Time Tracking',
                description: 'Monitor distractions and improve focus',
              },
              {
                icon: '🤖',
                title: 'AI Doubt Clarification',
                description: 'Get instant answers powered by advanced AI',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur rounded-xl p-8 text-white hover:bg-white/15 transition-all hover:scale-105 flex flex-col items-start"
              >
                <div className="text-4xl mb-5">{feature.icon}</div>
                <h3 className="text-xl font-heading font-semibold mb-4">{feature.title}</h3>
                <p className="opacity-90 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}