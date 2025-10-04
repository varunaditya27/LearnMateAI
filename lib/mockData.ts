/**
 * Mock Data for Development
 * 
 * Provides sample data for testing and prototyping.
 * TODO: Replace with actual database queries in production
 */

import { Domain, LeaderboardEntry } from '@/types';

export const mockDomains: Domain[] = [
  {
    id: 'web-dev',
    name: 'Web Development',
    description: 'Modern web development technologies and frameworks',
    icon: '💻',
    subdomains: [
      {
        id: 'frontend',
        domainId: 'web-dev',
        name: 'Frontend Development',
        description: 'User interface and client-side development',
        topics: [
          {
            id: 'react',
            subdomainId: 'frontend',
            name: 'React.js',
            description: 'Build interactive UIs with React',
            estimatedHours: 40,
            difficulty: 'intermediate',
            concepts: [
              {
                id: 'react-basics',
                topicId: 'react',
                name: 'React Fundamentals',
                description: 'Components, Props, and State',
                order: 1,
                estimatedMinutes: 120,
              },
              {
                id: 'react-hooks',
                topicId: 'react',
                name: 'React Hooks',
                description: 'useState, useEffect, and custom hooks',
                order: 2,
                estimatedMinutes: 180,
                prerequisites: ['react-basics'],
              },
            ],
          },
          {
            id: 'typescript',
            subdomainId: 'frontend',
            name: 'TypeScript',
            description: 'Type-safe JavaScript development',
            estimatedHours: 30,
            difficulty: 'intermediate',
            concepts: [
              {
                id: 'ts-basics',
                topicId: 'typescript',
                name: 'TypeScript Basics',
                description: 'Types, Interfaces, and Basic Syntax',
                order: 1,
                estimatedMinutes: 150,
              },
            ],
          },
        ],
      },
      {
        id: 'backend',
        domainId: 'web-dev',
        name: 'Backend Development',
        description: 'Server-side development and APIs',
        topics: [
          {
            id: 'nodejs',
            subdomainId: 'backend',
            name: 'Node.js',
            description: 'JavaScript runtime for server-side development',
            estimatedHours: 50,
            difficulty: 'intermediate',
            concepts: [],
          },
        ],
      },
    ],
  },
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Analytics, machine learning, and data visualization',
    icon: '📊',
    subdomains: [
      {
        id: 'python-ds',
        domainId: 'data-science',
        name: 'Python for Data Science',
        description: 'Data analysis and visualization with Python',
        topics: [
          {
            id: 'pandas',
            subdomainId: 'python-ds',
            name: 'Pandas',
            description: 'Data manipulation and analysis',
            estimatedHours: 25,
            difficulty: 'beginner',
            concepts: [],
          },
        ],
      },
    ],
  },
  {
    id: 'design',
    name: 'UI/UX Design',
    description: 'User experience and interface design',
    icon: '🎨',
    subdomains: [
      {
        id: 'ui-fundamentals',
        domainId: 'design',
        name: 'UI Fundamentals',
        description: 'Visual design principles and patterns',
        topics: [
          {
            id: 'color-theory',
            subdomainId: 'ui-fundamentals',
            name: 'Color Theory',
            description: 'Understanding colors in design',
            estimatedHours: 15,
            difficulty: 'beginner',
            concepts: [],
          },
        ],
      },
    ],
  },
];

export const mockLeaderboardData: LeaderboardEntry[] = [
  {
    userId: 'user-1',
    displayName: 'Alex Johnson',
    photoURL: undefined,
    points: 2850,
    streak: 15,
    rank: 1,
    level: 8,
    badge: '🏆',
  },
  {
    userId: 'user-2',
    displayName: 'Sarah Chen',
    photoURL: undefined,
    points: 2540,
    streak: 12,
    rank: 2,
    level: 7,
    badge: '🥈',
  },
  {
    userId: 'user-3',
    displayName: 'Michael Brown',
    photoURL: undefined,
    points: 2350,
    streak: 10,
    rank: 3,
    level: 7,
    badge: '🥉',
  },
  {
    userId: 'user-4',
    displayName: 'Emily Davis',
    photoURL: undefined,
    points: 2120,
    streak: 8,
    rank: 4,
    level: 6,
  },
  {
    userId: 'user-5',
    displayName: 'David Wilson',
    photoURL: undefined,
    points: 1950,
    streak: 7,
    rank: 5,
    level: 6,
  },
];
