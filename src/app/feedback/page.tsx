"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext, FeedbackData } from '@/lib/context/AppContext';

export default function FeedbackPage() {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { audioData, topic, speechText, feedback } = useAppContext();
  
  // Check if audio data exists
  useEffect(() => {
    if (!audioData.blob && !audioData.url) {
      // No recording found, redirect to home page
      router.push('/');
    }
  }, [audioData, router]);
  
  const handleCopyFeedback = () => {
    if (!feedback) return;

    const feedbackText = `
Speech Feedback for Topic: "${topic || 'N/A'}"

Structure (${feedback.structure.score}/10): ${feedback.structure.comments}

Coherence (${feedback.coherence.score}/10): ${feedback.coherence.comments}

Speaking Pace (${feedback.speed.wordsPerMinute} WPM): ${feedback.speed.comments}

Filler Words (Count: ${feedback.fillerWords.count}): ${feedback.fillerWords.comments}
${feedback.fillerWords.examples.length > 0 ? `Examples: ${feedback.fillerWords.examples.join(", ")}` : ''}

Repetitive Phrases (Instances: ${feedback.repetition.instances}): ${feedback.repetition.comments}
${feedback.repetition.examples.length > 0 ? `Examples: ${feedback.repetition.examples.join(", ")}` : ''}

Time Management (${feedback.timeManagement.score}/10): ${feedback.timeManagement.comments}

Overall: ${feedback.overallFeedback}
    `.trim();
    
    navigator.clipboard.writeText(feedbackText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy feedback: ', err);
      });
  };
  
  // Function to play the recorded audio
  const handlePlayRecording = () => {
    if (audioData.url) {
      const audio = new Audio(audioData.url);
      audio.play();
    }
  };
  
  // Loading state while feedback is being fetched (though practice page handles actual fetching)
  // This page receives the feedback once it's set in context.
  if (!feedback) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Speech Feedback</h1>
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-3xl w-full text-center">
          <p className="text-xl mb-4">Loading feedback or feedback is unavailable...</p>
          <p className="text-muted-foreground mb-6">
            If you just completed a speech, your feedback should appear shortly.
            Otherwise, please try a new speech session.
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-6"></div>
          <Link 
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Speech Feedback</h1>
      
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-3xl w-full">
        {topic && (
          <div className="mb-6">
            <h2 className="text-xl font-medium">Topic:</h2>
            <p className="text-lg font-semibold">{topic}</p>
          </div>
        )}
        
        {audioData.url && (
          <div className="mb-8 bg-primary/5 p-4 rounded-md">
            <h2 className="text-xl font-medium mb-3">Your Recording</h2>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={handlePlayRecording}
                className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Play Recording
              </button>
              <span className="text-sm">Duration: {audioData.duration} seconds</span>
              {speechText && speechText.trim() !== "" && (
                <button
                  onClick={() => router.push('/transcript')}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
                >
                  Show Transcript
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overall Assessment</h2>
          <p className="text-lg">{feedback.overallFeedback}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2 flex items-center">
              Structure
              <span className="ml-auto bg-primary/10 px-2 py-1 rounded text-sm">
                {feedback.structure.score}/10
              </span>
            </h3>
            <p>{feedback.structure.comments}</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2 flex items-center">
              Coherence
              <span className="ml-auto bg-primary/10 px-2 py-1 rounded text-sm">
                {feedback.coherence.score}/10
              </span>
            </h3>
            <p>{feedback.coherence.comments}</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2">Speaking Pace</h3>
            <p className="mb-2">
              <span className="font-medium">{feedback.speed.wordsPerMinute} words per minute</span>
            </p>
            <p>{feedback.speed.comments}</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2">Filler Words</h3>
            <p className="mb-2">
              <span className="font-medium">Count: {feedback.fillerWords.count}</span>
            </p>
            {feedback.fillerWords.examples && feedback.fillerWords.examples.length > 0 && (
              <p className="mb-2">
                <span className="font-medium">Examples: </span>
                {feedback.fillerWords.examples.join(", ")}
              </p>
            )}
            <p>{feedback.fillerWords.comments}</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2">Repetitive Phrases</h3>
            <p className="mb-2">
              <span className="font-medium">Instances: {feedback.repetition.instances}</span>
            </p>
            {feedback.repetition.examples && feedback.repetition.examples.length > 0 && (
              <p className="mb-2">
                <span className="font-medium">Examples: </span>
                {feedback.repetition.examples.join(", ")}
              </p>
            )}
            <p>{feedback.repetition.comments}</p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-xl font-medium mb-2 flex items-center">
              Time Management
              <span className="ml-auto bg-primary/10 px-2 py-1 rounded text-sm">
                {feedback.timeManagement.score}/10
              </span>
            </h3>
            <p>{feedback.timeManagement.comments}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleCopyFeedback}
            disabled={!feedback}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy Feedback'}
          </button>
          
          <Link 
            href="/"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors flex items-center justify-center"
          >
            Start New Speech
          </Link>
        </div>
      </div>
    </div>
  );
} 