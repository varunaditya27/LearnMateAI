/**
 * Login Component
 * 
 * User authentication page with email/password and Google OAuth.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#10b981] p-8">
      <Card className="w-full max-w-2xl bg-white border-[#e2e8f0] shadow-xl">
        <CardHeader className="text-center space-y-8 pb-12">
          <div className="text-6xl font-heading font-bold text-[#4f46e5] mb-6">
            LearnMate
          </div>
          <div className="space-y-6">
            <CardTitle className="text-4xl text-[#0f172a] font-bold">Welcome Back!</CardTitle>
            <CardDescription className="text-2xl text-[#64748b] font-medium">
              Sign in to continue your learning journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-[#4f46e5] text-xl font-semibold mb-3">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#0f172a] placeholder-[#64748b]/60 rounded-lg text-lg h-12 focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-[#4f46e5] text-xl font-semibold mb-3">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-3 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#0f172a] placeholder-[#64748b]/60 rounded-lg text-lg h-12 focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] transition-all"
              />
            </div>

            <div className="pt-6 flex justify-center">
              <Button 
                type="submit" 
                isLoading={isLoading}
                className="py-4 text-xl font-bold rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-white transition-all hover:scale-105 h-14 w-64"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-white text-[#64748b] text-xl font-semibold">
                Or continue with
              </span>
            </div>
          </div>

          <div className="pt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
              disabled={isLoading}
              className="py-4 text-xl font-bold rounded-lg border-2 border-[#e2e8f0] text-[#0f172a] bg-white hover:bg-[#f1f5f9] hover:border-[#d1d5db] transition-all hover:scale-105 h-14 w-64"
            >
              Sign in with Google
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-12 pb-12">
          <p className="text-xl text-[#64748b]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#4f46e5] font-bold hover:text-[#3730a3] hover:underline transition-colors text-xl">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}