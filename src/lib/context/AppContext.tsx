"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type Difficulty = 'easy' | 'medium' | 'hard';

export type FeedbackData = {
  structure: {
    score: number;
    comments: string;
  };
  coherence: {
    score: number;
    comments: string;
  };
  speed: {
    wordsPerMinute: number;
    comments: string;
  };
  fillerWords: {
    count: number;
    examples: string[];
    comments: string;
  };
  repetition: {
    instances: number;
    examples: string[];
    comments: string;
  };
  timeManagement: {
    score: number;
    comments: string;
  };
  overallFeedback: string;
};

export type AudioData = {
  blob: Blob | null;
  url: string | null;
  duration: number;
};

type AppContextType = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  speechText: string;
  setSpeechText: (text: string) => void;
  feedback: FeedbackData | null;
  setFeedback: (feedback: FeedbackData | null) => void;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  audioData: AudioData;
  setAudioData: (audioData: AudioData) => void;
  topic: string;
  setTopic: (topic: string) => void;
};

// Default context value
const defaultContextValue: AppContextType = {
  difficulty: 'easy',
  setDifficulty: () => {},
  speechText: '',
  setSpeechText: () => {},
  feedback: null,
  setFeedback: () => {},
  isRecording: false,
  setIsRecording: () => {},
  audioData: {
    blob: null,
    url: null,
    duration: 0,
  },
  setAudioData: () => {},
  topic: '',
  setTopic: () => {},
};

// Create context
export const AppContext = createContext<AppContextType>(defaultContextValue);

// Context provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [speechText, setSpeechText] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<AudioData>({
    blob: null,
    url: null,
    duration: 0,
  });
  const [topic, setTopic] = useState<string>('');

  return (
    <AppContext.Provider
      value={{
        difficulty,
        setDifficulty,
        speechText,
        setSpeechText,
        feedback,
        setFeedback,
        isRecording,
        setIsRecording,
        audioData,
        setAudioData,
        topic,
        setTopic,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for using the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 