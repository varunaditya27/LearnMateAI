/**
 * Screen Time Page
 * 
 * Detailed screen time analytics and tracking.
 */

'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScreenTimeWidget } from '@/components/dashboard/ScreenTimeWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function ScreenTimePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">
            ⏱️ Screen Time Tracker
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Monitor your app usage and stay focused
          </p>
        </div>

        <ScreenTimeWidget />

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--primary)]">2h 15m</div>
                <div className="text-sm text-[var(--muted-foreground)]">Learning Time</div>
              </div>
              <div className="text-center p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">45m</div>
                <div className="text-sm text-[var(--muted-foreground)]">Social Media</div>
              </div>
              <div className="text-center p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--secondary)]">85%</div>
                <div className="text-sm text-[var(--muted-foreground)]">Focus Score</div>
              </div>
              <div className="text-center p-4 bg-[var(--muted)] rounded-lg">
                <div className="text-2xl font-bold text-red-500">3</div>
                <div className="text-sm text-[var(--muted-foreground)]">Distractions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
