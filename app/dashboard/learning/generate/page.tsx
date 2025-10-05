/**
 * Learning Path Generator Page
 * 
 * Allows users to generate AI-powered personalized learning paths
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const domains = [
  { id: 'web-dev', name: 'Web Development', icon: '🌐' },
  { id: 'mobile-dev', name: 'Mobile Development', icon: '📱' },
  { id: 'data-science', name: 'Data Science', icon: '📊' },
  { id: 'ai-ml', name: 'AI & Machine Learning', icon: '🤖' },
  { id: 'cloud', name: 'Cloud Computing', icon: '☁️' },
  { id: 'devops', name: 'DevOps', icon: '🚀' },
];

const subdomains: Record<string, Array<{ id: string; name: string }>> = {
  'web-dev': [
    { id: 'frontend', name: 'Frontend Development' },
    { id: 'backend', name: 'Backend Development' },
    { id: 'fullstack', name: 'Full Stack Development' },
  ],
  'mobile-dev': [
    { id: 'ios', name: 'iOS Development' },
    { id: 'android', name: 'Android Development' },
    { id: 'cross-platform', name: 'Cross-Platform' },
  ],
  'data-science': [
    { id: 'analytics', name: 'Data Analytics' },
    { id: 'visualization', name: 'Data Visualization' },
    { id: 'engineering', name: 'Data Engineering' },
  ],
  'ai-ml': [
    { id: 'ml-basics', name: 'Machine Learning Basics' },
    { id: 'deep-learning', name: 'Deep Learning' },
    { id: 'nlp', name: 'Natural Language Processing' },
  ],
  cloud: [
    { id: 'aws', name: 'AWS' },
    { id: 'azure', name: 'Azure' },
    { id: 'gcp', name: 'Google Cloud' },
  ],
  devops: [
    { id: 'ci-cd', name: 'CI/CD' },
    { id: 'containers', name: 'Containers & Orchestration' },
    { id: 'monitoring', name: 'Monitoring & Logging' },
  ],
};

export default function GenerateLearningPathPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedDomain || !selectedSubdomain || !topic) {
      setError('Please complete all steps');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.learning.generatePath(selectedDomain, selectedSubdomain, topic);

      if (response.success && response.data) {
        router.push(`/dashboard/learning/paths/${response.data.id}`);
      } else {
        throw new Error(response.error || 'Failed to generate learning path');
      }
    } catch (err) {
      console.error('Generate path error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate learning path');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Generate Learning Path</h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            Let AI create a personalized learning journey tailored to your goals
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-4"
        >
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= num
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 transition-all ${
                    step > num ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Step 1: Select Domain */}
        {step === 1 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Choose Your Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {domains.map((domain) => (
                    <motion.button
                      key={domain.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDomain(domain.id);
                        setSelectedSubdomain('');
                        setStep(2);
                      }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedDomain === domain.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="text-4xl mb-3">{domain.icon}</div>
                      <div className="font-semibold">{domain.name}</div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Subdomain */}
        {step === 2 && selectedDomain && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Choose Your Subdomain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subdomains[selectedDomain]?.map((subdomain) => (
                    <motion.button
                      key={subdomain.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedSubdomain(subdomain.id);
                        setStep(3);
                      }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedSubdomain === subdomain.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="font-semibold text-lg">{subdomain.name}</div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Enter Topic */}
        {step === 3 && selectedDomain && selectedSubdomain && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Step 3: What do you want to learn?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic or Technology</label>
                  <Input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., React, Python, Docker, Machine Learning..."
                    className="w-full"
                  />
                  <p className="text-sm text-[var(--muted-foreground)] mt-2">
                    Be specific about what you want to learn
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={loading || !topic}
                    className="flex-1"
                  >
                    {loading ? 'Generating...' : '✨ Generate Learning Path'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <Card className="max-w-md">
              <CardContent className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6 border-4 border-[var(--primary)] border-t-transparent rounded-full"
                />
                <h3 className="text-2xl font-bold mb-2">Creating Your Path</h3>
                <p className="text-[var(--muted-foreground)]">
                  AI is generating a personalized learning journey...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
