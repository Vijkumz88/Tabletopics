'use client';

import React from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assuming shadcn Button, adjust if not

export default function TranscriptPage() {
  const { speechText } = useAppContext();
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Speech Transcript</h1>
        <Button onClick={() => router.push('/feedback')} variant="outline">
          Back to Feedback
        </Button>
      </div>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg">
        {speechText && speechText.trim() !== '' ? (
          <p className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
            {speechText}
          </p>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground mb-4">No transcript available.</p>
            <p className="text-muted-foreground mb-6">
              It seems there was an issue generating the transcript or you haven't completed a speech practice session yet.
            </p>
            <Button onClick={() => router.push('/')}>
              Practice New Speech
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 