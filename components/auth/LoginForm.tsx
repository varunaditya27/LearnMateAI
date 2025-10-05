'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loginUser, loginWithGoogle } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const user = await loginUser(email, password);
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    
    try {
      const user = await loginWithGoogle();
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center relative overflow-hidden font-[family-name:var(--font-orbitron)]">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2" 
             style={{
               backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)`,
               backgroundSize: '50px 50px',
               animation: 'gridMove 20s linear infinite'
             }}>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes glow {
          from { text-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
          to { text-shadow: 0 0 30px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.4); }
        }
        @keyframes slideInDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Auth Container */}
      <div className="w-full max-w-[480px] !px-4 z-10">
        <motion.div 
          className="bg-[rgba(10,10,26,0.8)] backdrop-blur-[20px] border border-[rgba(0,212,255,0.2)] rounded-[20px] px-8 py-12" 
          style={{ 
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="text-center mt-8 mb-8">
            <h1 className="text-4xl font-black text-[#00d4ff] mb-2 tracking-wider" 
                style={{ 
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  animation: 'glow 2s ease-in-out infinite alternate'
                }}>
              WELCOME BACK
            </h1>
            <p className="text-[rgba(255,255,255,0.7)] text-lg">
              Access your learning journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.5)] rounded-[10px] p-4 mb-6 text-[#fca5a5] text-sm text-center"
                 style={{ animation: 'slideInDown 0.3s ease' }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full !px-6 !py-3 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)] rounded-[10px] text-white text-base outline-none transition-all duration-300 focus:bg-[rgba(0,212,255,0.1)] focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="relative">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full !px-6 !py-3 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)] rounded-[10px] text-white text-base outline-none transition-all duration-300 focus:bg-[rgba(0,212,255,0.1)] focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  autoComplete="current-password"
                />
                {password && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-0 text-[rgba(255,255,255,0.6)] cursor-pointer text-xl p-2 rounded transition-all duration-300 z-[5] hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="relative w-full !px-4 !py-3 bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] border-0 rounded-[10px] text-white text-base font-bold tracking-wide cursor-pointer overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-[2px] hover:enabled:shadow-[0_10px_30px_rgba(0,212,255,0.4)]"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              <span className="relative z-[2]">
                {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
              </span>
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent transition-[left] duration-500 hover:left-full"></div>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative text-center my-6">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[rgba(0,212,255,0.2)]"></div>
            <span className="relative inline-block !px-4 bg-[rgba(10,10,26,0.8)] text-[rgba(255,255,255,0.5)] text-lg">
              OR
            </span>
          </div>

          {/* Google Sign In */}
          <motion.button 
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full !px-4 !py-3 bg-white border-0 rounded-[10px] flex items-center justify-center gap-3 text-base font-medium text-[#3c4043] cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:bg-[#f8f9fa] hover:enabled:-translate-y-[2px] hover:enabled:shadow-[0_5px_20px_rgba(0,0,0,0.2)]"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            <svg className="w-9 h-9" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>

          {/* Toggle Mode */}
          <div className="text-center mt-6">
            <p className="text-[rgba(255,255,255,0.6)] mb-2">
              Don&apos;t have an account?
            </p>
            <Link 
              href="/register"
              className="bg-transparent border-0 text-[#00d4ff] text-base font-semibold cursor-pointer px-4 py-2 rounded transition-all duration-300 inline-block hover:bg-[rgba(0,212,255,0.1)]"
              style={{ textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
            >
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}