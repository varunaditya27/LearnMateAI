/**
 * Skill Selection Component
 * 
 * Interactive UI for selecting Domain → Subdomain → Topic → Concept
 * or directly searching for a topic.
 * 
 * TODO: Add search functionality with autocomplete
 * TODO: Add recently viewed topics
 * TODO: Add popular/trending topics section
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Domain, Subdomain, Topic } from '@/types';
import { motion } from 'framer-motion';

interface SkillSelectorProps {
  domains: Domain[];
  onSelect: (topicId: string) => void;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ domains, onSelect }) => {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<Subdomain | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    setSelectedSubdomain(null);
    setSelectedTopic(null);
  };

  const handleSubdomainSelect = (subdomain: Subdomain) => {
    setSelectedSubdomain(subdomain);
    setSelectedTopic(null);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleStartLearning = () => {
    if (selectedTopic) {
      onSelect(selectedTopic.id);
    }
  };

  const handleReset = () => {
    setSelectedDomain(null);
    setSelectedSubdomain(null);
    setSelectedTopic(null);
  };

  const getDifficultyColor = (difficulty: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="🔍 Search for any topic (e.g., React, Machine Learning, UI Design)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Or browse by category below
          </p>
        </CardContent>
      </Card>

      {/* Breadcrumb */}
      {(selectedDomain || selectedSubdomain || selectedTopic) && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            🏠 Start Over
          </Button>
          <span className="text-[var(--muted-foreground)]">/</span>
          {selectedDomain && (
            <>
              <span className="font-medium">{selectedDomain.name}</span>
              {selectedSubdomain && (
                <>
                  <span className="text-[var(--muted-foreground)]">/</span>
                  <span className="font-medium">{selectedSubdomain.name}</span>
                </>
              )}
              {selectedTopic && (
                <>
                  <span className="text-[var(--muted-foreground)]">/</span>
                  <span className="font-medium text-[var(--primary)]">{selectedTopic.name}</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Domain Selection */}
      {!selectedDomain && (
        <div>
          <h2 className="text-2xl font-heading font-bold mb-4">Choose Your Domain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <motion.div
                key={domain.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card hoverable onClick={() => handleDomainSelect(domain)} className="cursor-pointer">
                  <CardHeader>
                    <div className="text-4xl mb-2">{domain.icon}</div>
                    <CardTitle>{domain.name}</CardTitle>
                    <CardDescription>{domain.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="default" size="sm">
                      {domain.subdomains.length} subdomains
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Subdomain Selection */}
      {selectedDomain && !selectedSubdomain && (
        <div>
          <h2 className="text-2xl font-heading font-bold mb-4">Select a Subdomain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDomain.subdomains.map((subdomain) => (
              <motion.div
                key={subdomain.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card hoverable onClick={() => handleSubdomainSelect(subdomain)} className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>{subdomain.name}</CardTitle>
                    <CardDescription>{subdomain.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="default" size="sm">
                      {subdomain.topics.length} topics
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Selection */}
      {selectedSubdomain && !selectedTopic && (
        <div>
          <h2 className="text-2xl font-heading font-bold mb-4">Choose Your Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedSubdomain.topics.map((topic) => (
              <motion.div
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card hoverable onClick={() => handleTopicSelect(topic)} className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>{topic.name}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                      <Badge variant="default">
                        ⏱️ {topic.estimatedHours}h
                      </Badge>
                    </div>
                    {topic.concepts.length > 0 && (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {topic.concepts.length} concepts to learn
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Details & Start */}
      {selectedTopic && (
        <Card className="bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-white text-2xl">{selectedTopic.name}</CardTitle>
            <CardDescription className="text-white/80">{selectedTopic.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="accent">
                {selectedTopic.difficulty}
              </Badge>
              <Badge variant="accent">
                ⏱️ {selectedTopic.estimatedHours} hours
              </Badge>
              <Badge variant="accent">
                📚 {selectedTopic.concepts.length} concepts
              </Badge>
            </div>

            {selectedTopic.concepts.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="font-semibold mb-2">What you will learn:</p>
                <ul className="space-y-1">
                  {selectedTopic.concepts.slice(0, 5).map((concept) => (
                    <li key={concept.id} className="text-sm flex items-center gap-2">
                      <span>✓</span>
                      <span>{concept.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="accent"
              size="lg"
              fullWidth
              onClick={handleStartLearning}
            >
              🚀 Start Learning Path
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
