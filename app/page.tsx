'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#e0e0e0] overflow-x-hidden relative font-[family-name:var(--font-orbitron)]">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0" 
           style={{
             backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(0, 242, 254, 0.1) 25%, rgba(0, 242, 254, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 242, 254, 0.1) 75%, rgba(0, 242, 254, 0.1) 76%, transparent 77%, transparent),
                              linear-gradient(90deg, transparent 24%, rgba(0, 242, 254, 0.1) 25%, rgba(0, 242, 254, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 242, 254, 0.1) 75%, rgba(0, 242, 254, 0.1) 76%, transparent 77%, transparent)`,
             backgroundSize: '60px 60px',
             animation: 'moveGrid 15s linear infinite'
           }}>
      </div>

      <style jsx>{`
        @keyframes moveGrid {
          0% { background-position: 0 0; }
          100% { background-position: -60px -60px; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[rgba(10,10,26,0.8)] backdrop-blur-[10px] z-[1000] border-b border-[rgba(0,242,254,0.2)]">
        <div className="max-w-[1200px] mx-auto !px-8 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-4xl font-bold text-white" style={{ textShadow: '0 0 5px rgba(0, 242, 254, 0.7)' }}>
              LearnMate
            </span>
          </div>
          
          <button 
            className={`md:hidden flex flex-col cursor-pointer p-2 bg-transparent border-0 ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            <span className="w-[25px] h-[3px] bg-[#00f2fe] my-[3px] transition-all duration-300" style={{ boxShadow: '0 0 5px rgba(0, 242, 254, 0.5)', transform: isMobileMenuOpen ? 'rotate(-45deg) translate(-5px, 6px)' : 'none' }}></span>
            <span className="w-[25px] h-[3px] bg-[#00f2fe] my-[3px] transition-all duration-300" style={{ boxShadow: '0 0 5px rgba(0, 242, 254, 0.5)', opacity: isMobileMenuOpen ? 0 : 1 }}></span>
            <span className="w-[25px] h-[3px] bg-[#00f2fe] my-[3px] transition-all duration-300" style={{ boxShadow: '0 0 5px rgba(0, 242, 254, 0.5)', transform: isMobileMenuOpen ? 'rotate(45deg) translate(-5px, -6px)' : 'none' }}></span>
          </button>
          
          <div className={`md:flex md:gap-10 md:items-center md:mr-0 fixed md:static top-[80px] left-0 w-full md:w-auto h-[calc(100vh-80px)] md:h-auto bg-[rgba(10,10,26,0.95)] md:bg-transparent backdrop-blur-[15px] md:backdrop-blur-0 flex-col md:flex-row justify-start md:justify-center items-center gap-0 md:gap-10 pt-4 md:pt-0 border-t md:border-t-0 border-[rgba(0,242,254,0.2)] transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <a href="#home" className="text-[#e0e0e0] no-underline font-medium text-2xl md:text-xl transition-all duration-300 py-4 md:py-0 px-8 md:px-0 w-full md:w-auto text-center border-b md:border-b-0 border-[rgba(0,242,254,0.2)] hover:text-[#00f2fe]" style={{ textShadow: '0 0 3px rgba(0, 242, 254, 0.3)' }} onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#features" className="text-[#e0e0e0] no-underline font-medium text-2xl md:text-xl transition-all duration-300 py-4 md:py-0 px-8 md:px-0 w-full md:w-auto text-center border-b md:border-b-0 border-[rgba(0,242,254,0.2)] hover:text-[#00f2fe]" style={{ textShadow: '0 0 3px rgba(0, 242, 254, 0.3)' }} onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#about" className="text-[#e0e0e0] no-underline font-medium text-2xl md:text-xl transition-all duration-300 py-4 md:py-0 px-8 md:px-0 w-full md:w-auto text-center border-b md:border-b-0 border-[rgba(0,242,254,0.2)] hover:text-[#00f2fe]" style={{ textShadow: '0 0 3px rgba(0, 242, 254, 0.3)' }} onClick={() => setIsMobileMenuOpen(false)}>About</a>
            <Link href="/register" className="bg-transparent border border-[#00f2fe] text-[#00f2fe] !px-6 !py-2 rounded transition-all duration-300 mt-4 md:mt-0 w-auto hover:bg-[rgba(0,242,254,0.2)]" style={{ boxShadow: '0 0 15px rgba(0, 242, 254, 0.5)' }} onClick={() => setIsMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 md:pt-0 pb-16 !md:pb-0 !px-8 text-white flex items-center justify-center min-h-screen">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-extrabold leading-tight mb-6" 
              style={{ textShadow: '0 0 10px rgba(0, 242, 254, 0.5)' }}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              AI That Makes
              <span className="block text-[#00f2fe]">Learning Addictive</span>
            </motion.h1>
            <motion.p 
              className="text-2xl leading-relaxed max-w-[800px] mb-8 opacity-80"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              Your personal AI-powered learning companion. Structured paths, smart reminders, gamified progress tracking, and community-driven growth.
            </motion.p>
            <motion.div 
              className="flex gap-4 flex-col sm:flex-row justify-center"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <Link href="/register" className="text-2xl !px-8 !py-3 rounded bg-[#00f2fe] text-[#0a0a1a] border border-[#00f2fe] font-semibold text-center transition-all duration-300 hover:bg-transparent hover:text-[#00f2fe]" style={{ boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' }}>
                Sign Up
              </Link>
              <Link href="/login" className="text-2xl !px-8 !py-3 rounded bg-transparent text-white border border-white font-semibold text-center transition-all duration-300 hover:bg-white hover:text-[#0a0a1a]">
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        className="relative bg-transparent !py-20 !px-8 z-[2]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-center text-5xl font-bold mb-12 text-white" style={{ textShadow: '0 0 8px rgba(0, 242, 254, 0.7)' }}>
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: 'Personalized Learning', description: 'AI-generated learning paths tailored to your goals and pace' },
              { icon: '🔥', title: 'Streak Tracking', description: 'Build consistency with daily streaks and habit formation' },
              { icon: '🏆', title: 'Gamification', description: 'Earn points, level up, and compete on leaderboards' },
              { icon: '💡', title: 'Smart Reminders', description: 'AI-powered nudges to keep you on track' },
              { icon: '⏱️', title: 'Screen Time Tracking', description: 'Monitor distractions and improve focus' },
              { icon: '🤖', title: 'AI Doubt Clarification', description: 'Get instant answers powered by advanced AI' }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="!p-8 rounded bg-[rgba(15,23,42,0.8)] border border-[rgba(0,242,254,0.2)] transition-all duration-300 text-center z-[3]"
                style={{ boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-5xl mb-4 text-[#00f2fe]">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="opacity-80 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section 
        id="about" 
        className="py-16 px-4 bg-[#0a0a1a] min-h-screen"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-center text-5xl font-bold mb-12 text-white" style={{ textShadow: '0 0 8px rgba(0, 242, 254, 0.7)' }}>
            About LearnMate
          </h2>
          <div className="mt-12">
            <div className="text-center mb-12">
              <p className="text-lg leading-relaxed text-white max-w-[800px] mx-auto">
                LearnMate is an AI-powered learning platform built to make education engaging, 
                personalized, and addictive in the best way possible. We combine gamification, 
                smart tracking, and community support to transform how you learn.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <motion.div 
                className="bg-[rgba(15,23,42,0.8)] !p-8 rounded-xl border border-[rgba(0,242,254,0.2)] transition-all duration-300 z-[3]" 
                style={{ boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)' }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <h3 className="text-3xl font-bold text-[#f1f5f9] mb-4 flex items-center gap-2">
                  🗝️ Modern Learning Approach
                </h3>
                <p className="text-[#94a3b8] text-lg leading-relaxed">
                  Built with AI at its core to provide personalized learning experiences that 
                  adapt to your pace, style, and goals. Our intelligent system keeps you motivated 
                  and engaged every step of the way.
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-[rgba(15,23,42,0.8)] !p-8 rounded-xl border border-[rgba(0,242,254,0.2)] transition-all duration-300 z-[3]" 
                style={{ boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)' }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <h3 className="text-3xl font-bold text-[#f1f5f9] mb-4 flex items-center gap-2">
                  🚀 Built for Results
                </h3>
                <p className="text-[#94a3b8] text-lg leading-relaxed">
                  Every feature is designed with one goal: helping you learn more effectively. 
                  From smart reminders to progress tracking, we make sure you stay on track 
                  and achieve your learning goals.
                </p>
              </motion.div>
            </div>
            
            <div className="bg-[rgba(15,23,42,0.8)] !p-12 rounded-2xl text-center text-white z-[1000]">
              <h3 className="text-5xl font-bold mb-4">Our Mission</h3>
              <p className="text-2xl leading-relaxed opacity-95 max-w-[600px] mx-auto">
                We believe learning should be engaging, not a chore. LearnMate combines the 
                power of AI with proven learning techniques to create an experience that keeps 
                you coming back for more.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative bg-[#05050e] text-[#a0aec0] py-12 px-8 border-t border-[rgba(0,242,254,0.2)]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-white" style={{ textShadow: '0 0 5px rgba(0, 242, 254, 0.5)' }}>
                LearnMate
              </h3>
              <p className="opacity-70 leading-relaxed">
                The modern way to make learning addictive and effective.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 text-[#e0e0e0]">Quick Links</h4>
              <ul className="list-none p-0 space-y-2">
                <li><a href="#features" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">Features</a></li>
                <li><a href="#about" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">About</a></li>
                <li><Link href="/register" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 text-[#e0e0e0]">Connect</h4>
              <div className="flex flex-col gap-4">
                <a href="#" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">Twitter</a>
                <a href="#" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">GitHub</a>
                <a href="#" className="text-[#a0aec0] no-underline transition-colors duration-300 hover:text-[#00f2fe]">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[rgba(255,255,255,0.1)] text-center opacity-60">
            <p>&copy; 2025 LearnMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}