"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';

export default function Home() {
  const { setAudioData, setTopic } = useAppContext();
  
  // Reset app state when returning to home page
  useEffect(() => {
    setAudioData({
      blob: null,
      url: null,
      duration: 0,
    });
    setTopic('');
  }, [setAudioData, setTopic]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Speech Ninja</h1>
      <p className="text-xl mb-12 text-center max-w-2xl">
        Improve your impromptu speaking skills with AI-powered feedback. Select a difficulty level to begin.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <Link 
          href="/practice?difficulty=easy"
          className="flex flex-col items-center p-6 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Easy</h2>
          <p className="text-center text-muted-foreground">
            Simple topics for beginners to practice basic speaking skills.
          </p>
        </Link>
        
        <Link 
          href="/practice?difficulty=medium"
          className="flex flex-col items-center p-6 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Medium</h2>
          <p className="text-center text-muted-foreground">
            Moderate topics requiring some critical thinking and structure.
          </p>
        </Link>
        
        <Link 
          href="/practice?difficulty=hard"
          className="flex flex-col items-center p-6 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Hard</h2>
          <p className="text-center text-muted-foreground">
            Complex topics for advanced speakers to challenge themselves.
          </p>
        </Link>
      </div>
    </div>
  );
} 