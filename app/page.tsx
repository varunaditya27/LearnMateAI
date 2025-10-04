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
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-purple-600 to-[var(--secondary)]">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-heading font-bold mb-6">
            📚 LearnMate
          </h1>
          <p className="text-2xl mb-4 font-medium">
            AI That Makes Learning Addictive
          </p>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Your personal AI-powered learning companion. Structured paths, smart reminders,
            gamified progress tracking, and community-driven growth.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button variant="accent" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
              icon: '⏱️',
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
              className="bg-white/10 backdrop-blur rounded-xl p-6 text-white"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
              <p className="opacity-90">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center text-white">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="opacity-80">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="opacity-80">Topics Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="opacity-80">Goal Achievement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
