"use client";

import { useState, useEffect, useRef, Suspense } from 'react'; // Added Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { useAppContext } from '@/lib/context/AppContext';
import CircularProgress from '@/components/ui/CircularProgress';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { allTopics, shuffleArray } from '@/lib/topics';

// Renamed original component
function PracticePageContent() {
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const router = useRouter();
  
  const { setTopic, audioData, setAudioData, speechText, setSpeechText, setFeedback } = useAppContext();
  const [stage, setStage] = useState<'prep' | 'speaking' | 'completed' | 'transcribing' | 'generatingFeedback'>('prep');
  const [localTopic, setLocalTopic] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [speakingTime, setSpeakingTime] = useState<number>(120); // Default 2 minutes
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    getAudioData,
    audioBlob,
    audioUrl,
    permissionStatus,
    error: audioError, // Renamed to avoid conflict with other errors if any
    requestPermission,
    cleanup
  } = useAudioRecorder();
  
  const animationFrameRef = useRef<number | null>(null);
  const [audioVisualizerData, setAudioVisualizerData] = useState<Uint8Array>(new Uint8Array(0));

  // Initialize topic
  useEffect(() => {
    const difficultyKey = difficulty as keyof typeof allTopics;
    const availableTopics = allTopics[difficultyKey] || allTopics.easy;
    const shuffledTopics = shuffleArray([...availableTopics]); // Shuffle a copy
    const newTopic = shuffledTopics.length > 0 ? shuffledTopics[0] : "No topics available for this difficulty.";

    setLocalTopic(newTopic);
    setTopic(newTopic);
    
    requestPermission();
  }, [difficulty, setTopic, requestPermission]);
  
  // Preparation countdown
  useEffect(() => {
    if (stage !== 'prep' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage('speaking');
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, countdown, startRecording]);
  
  // Speaking countdown
  useEffect(() => {
    if (stage !== 'speaking' || speakingTime <= 0) return;
    const timer = setInterval(() => {
      setSpeakingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage('completed');
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, speakingTime, stopRecording]);
  
  // Update audio data in context
  useEffect(() => {
    if (stage === 'completed' && audioBlob && audioUrl) {
      setAudioData({
        blob: audioBlob,
        url: audioUrl,
        duration: 120 - speakingTime, // Assuming speakingTime was for 120 seconds max
      });
      setStage('transcribing'); 
    }
  }, [stage, audioBlob, audioUrl, speakingTime, setAudioData]);
  
  // Transcription and Feedback
  useEffect(() => {
    if (stage === 'transcribing' && audioBlob) {
      const transcribeAndFeedbackAudio = async () => {
        let currentTranscript = '';
        try {
          console.log("Starting transcription process...");
          const formData = new FormData();
          // --- Start of change ---
          const fileExtension = (audioBlob.type.split('/')[1] || 'webm').split(';')[0];
          formData.append('audio', audioBlob, `recording.${fileExtension}`);
          // --- End of change ---
          
          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json();
            throw new Error(errorData.error || `Transcription HTTP error! status: ${transcribeResponse.status}`);
          }
          const transcribeData = await transcribeResponse.json();
          if (transcribeData.transcript) {
            setSpeechText(transcribeData.transcript);
            currentTranscript = transcribeData.transcript;
          } else {
            setSpeechText('');
            throw new Error("Transcription succeeded but returned no text.");
          }

          setStage('generatingFeedback');
          if (!currentTranscript || (audioData.duration !== undefined && audioData.duration <= 0)) {
             setFeedback(null);
            throw new Error("Missing transcript or valid audio duration for feedback generation.");
          }

          const feedbackResponse = await fetch('/api/generate-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: currentTranscript, duration: audioData.duration }),
          });

          if (!feedbackResponse.ok) {
            const errorData = await feedbackResponse.json();
            throw new Error(errorData.error || `Feedback API HTTP error! status: ${feedbackResponse.status}`);
          }
          const feedbackData = await feedbackResponse.json();
          setFeedback(feedbackData);

        } catch (processError: any) {
          console.error("Error during transcription or feedback generation:", processError.message);
          setSpeechText(currentTranscript || '');
          setFeedback(null);
        } finally {
          router.push('/feedback');
        }
      };
      transcribeAndFeedbackAudio();
    }
  }, [stage, audioBlob, setSpeechText, router, setFeedback, audioData.duration]);
  
  // Audio visualization
  useEffect(() => {
    if (stage !== 'speaking' || !isRecording) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      return;
    }
    const updateVisualization = () => {
      setAudioVisualizerData(getAudioData());
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    animationFrameRef.current = requestAnimationFrame(updateVisualization);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stage, isRecording, getAudioData]);

  // Cleanup
  useEffect(() => () => cleanup(), [cleanup]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelClick = () => {
    if (stage === 'speaking') {
      setShowConfirmDialog(true);
    } else {
      router.push('/');
    }
  };

  const handleConfirmCancel = () => {
    if (isRecording) stopRecording();
    setShowConfirmDialog(false);
    router.push('/');
  };

  const handleCancelDialog = () => setShowConfirmDialog(false);

  const handleEndSpeechEarly = () => {
    if (isRecording) stopRecording();
    setStage('completed');
  };

  const prepProgress = ((10 - countdown) / 10) * 100;
  const speakingProgress = ((120 - speakingTime) / 120) * 100;

  // JSX for PracticePageContent
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-12 px-4">
      {stage === 'prep' && (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">Prepare Your Speech</h1>
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-semibold mb-6 text-center">Topic: {localTopic}</h2>
            <div className="flex flex-col items-center mb-8">
              <CircularProgress 
                progress={prepProgress} 
                size={120} 
                text={String(countdown)}
                progressColor="hsl(var(--primary))"
                className="mb-4"
              />
              <p className="text-xl">
                You have <span className="font-bold">{countdown} seconds</span> to prepare.
              </p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={handleCancelClick}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      
      {stage === 'speaking' && (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">Your Speech</h1>
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-semibold mb-6 text-center">Topic: {localTopic}</h2>
            <div className="flex flex-col items-center mb-8">
              <CircularProgress 
                progress={speakingProgress} 
                size={120} 
                text={formatTime(speakingTime)}
                progressColor={speakingTime <= 30 ? "hsl(var(--warning))" : "hsl(var(--primary))"}
                className={`mb-4 ${speakingTime <= 30 ? "animate-pulse" : ""}`}
              />
            </div>
            <div className="flex justify-center items-center mb-8">
              <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <div className="h-16 w-full max-w-md bg-muted rounded-lg overflow-hidden p-2">
                <AudioVisualizer 
                  audioData={audioVisualizerData}
                  barColor="hsl(var(--primary))"
                  className="w-full h-full"
                />
              </div>
            </div>
            {audioError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                <p>{audioError}</p>
                <p className="text-sm">Please ensure your microphone is connected and permissions are granted.</p>
              </div>
            )}
            {permissionStatus === 'denied' && !audioError && (
              <div className="bg-warning/10 border border-warning text-warning-foreground px-4 py-3 rounded mb-4">
                <p>Microphone access is required. Please grant permission to continue.</p>
              </div>
            )}
             {permissionStatus === 'unsupported' && !audioError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                <p>Audio recording is not supported by your browser or the page is not loaded securely (HTTPS). Please ensure you are using HTTPS.</p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleEndSpeechEarly}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                End Speech
              </button>
              <button 
                onClick={handleCancelClick}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      
      {(stage === 'completed' || stage === 'transcribing' || stage === 'generatingFeedback') && (
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">
            {stage === 'completed' && "Speech Completed!"}
            {stage === 'transcribing' && "Processing Your Speech"}
            {stage === 'generatingFeedback' && "Analyzing Your Speech"}
          </h1>
          <p className="text-xl mb-8">
            {stage === 'completed' && "Processing your audio..."}
            {stage === 'transcribing' && "Transcribing your audio, please wait..."}
            {stage === 'generatingFeedback' && "Generating your personalized feedback, please wait..."}
          </p>
          <div className="flex justify-center items-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${stage === 'generatingFeedback' ? 'border-green-500' : 'border-primary'}`}></div>
          </div>
        </div>
      )}
      
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        title="Cancel Speech?"
        message="Are you sure you want to cancel your speech? Your recording will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Speaking"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDialog}
      />
    </div>
  );
}

// New default export for the page
export default function PracticePageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading practice session...</div>}>
      <PracticePageContent />
    </Suspense>
  );
}