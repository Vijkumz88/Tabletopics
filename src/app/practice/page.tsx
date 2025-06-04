"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { useAppContext } from '@/lib/context/AppContext';
import CircularProgress from '@/components/ui/CircularProgress';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { allTopics, shuffleArray } from '@/lib/topics';

export default function PracticePage() {
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const router = useRouter();
  
  const { setTopic, audioData, setAudioData, speechText, setSpeechText, setFeedback } = useAppContext();
  const [stage, setStage] = useState<'prep' | 'speaking' | 'completed' | 'transcribing' | 'generatingFeedback'>('prep');
  const [localTopic, setLocalTopic] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [speakingTime, setSpeakingTime] = useState<number>(120);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Audio recording
  const {
    isRecording,
    startRecording,
    stopRecording,
    getAudioData,
    audioBlob,
    audioUrl,
    //next 2 added from
    permissionStatus,
    error,
    requestPermission,
    cleanup
  } = useAudioRecorder();
  
  // Animation frame for visualization
  const animationFrameRef = useRef<number | null>(null);
  const [audioVisualizerData, setAudioVisualizerData] = useState<Uint8Array>(new Uint8Array(0));
  
  // Initialize topic
  useEffect(() => {
    const difficultyKey = difficulty as keyof typeof allTopics;
    const availableTopics = allTopics[difficultyKey] || allTopics.easy;
    const shuffledTopics = shuffleArray([...availableTopics]);
    const newTopic = shuffledTopics.length > 0 ? shuffledTopics[0] : "No topics available for this difficulty.";

    setLocalTopic(newTopic);
    setTopic(newTopic);
    
    // Request microphone permission early
    requestPermission();
  }, [difficulty, setTopic, requestPermission]);
  
  // Preparation countdown
  useEffect(() => {
    if (stage !== 'prep' || countdown <= 0) return;
    //from gemini
    console.log("Prep countdown running:", countdown);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage('speaking');
          // Start recording when speaking stage begins
          //
          console.log("Attempting to start recording from prep countdown...");
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
     // Add this console log from
     console.log("Visualization Effect: stage =", stage, "isRecording =", isRecording);
    if (stage !== 'speaking' || speakingTime <= 0) return;
    
    const timer = setInterval(() => {
      setSpeakingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage('completed');
          // Stop recording when time is up
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [stage, speakingTime, stopRecording]);
  
  // Update audio data in context when recording is completed
  useEffect(() => {
    if (stage === 'completed' && audioBlob && audioUrl) {
      setAudioData({
        blob: audioBlob,
        url: audioUrl,
        duration: 120 - speakingTime,
      });
      // Transition to transcribing stage once audio data is set
      setStage('transcribing'); 
    }
  }, [stage, audioBlob, audioUrl, speakingTime, setAudioData]);
  
  // New useEffect for transcription
  useEffect(() => {
    if (stage === 'transcribing' && audioBlob) {
      const transcribeAndFeedbackAudio = async () => {
        let currentTranscript = '';
        try {
          console.log("Starting transcription process...");
          const formData = new FormData();
          formData.append('audio', audioBlob, `recording.${audioBlob.type.split('/')[1] || 'webm'}`);

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
            currentTranscript = transcribeData.transcript; // Store for feedback call
            console.log("Transcription successful:", currentTranscript);
          } else {
            console.error("Transcription successful, but no transcript in response:", transcribeData);
            setSpeechText('');
            throw new Error("Transcription succeeded but returned no text.");
          }

          // Transition to feedback generation stage
          setStage('generatingFeedback');
          console.log("Starting feedback generation process...");

          if (!currentTranscript || audioData.duration === undefined || audioData.duration <= 0) {
            console.error("Cannot generate feedback: Missing transcript or valid audio duration.", { currentTranscript, duration: audioData.duration });
            setFeedback(null); // Clear any previous feedback
            throw new Error("Missing transcript or valid audio duration for feedback generation.");
          }

          const feedbackResponse = await fetch('/api/generate-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript: currentTranscript, duration: audioData.duration }),
          });

          if (!feedbackResponse.ok) {
            const errorData = await feedbackResponse.json();
            throw new Error(errorData.error || `Feedback API HTTP error! status: ${feedbackResponse.status}`);
          }

          const feedbackData = await feedbackResponse.json();
          setFeedback(feedbackData);
          console.log("Feedback generation successful:", feedbackData);

        } catch (processError: any) {
          console.error("Error during transcription or feedback generation:", processError.message);
          setSpeechText(currentTranscript || ''); // Ensure transcript is set even if feedback fails
          setFeedback(null); // Clear feedback on error
          // Optionally, set an error message in context/state to display on feedback page
        } finally {
          console.log("Navigating to feedback page after all processing attempts...");
          router.push('/feedback');
        }
      };

      transcribeAndFeedbackAudio();
    }
  }, [stage, audioBlob, setSpeechText, router, setFeedback, audioData.duration]);
  
  // Audio visualization animation loop
  useEffect(() => {
    if (stage !== 'speaking' || !isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    const updateVisualization = () => {
      const audioData = getAudioData();
      setAudioVisualizerData(audioData);
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateVisualization);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [stage, isRecording, getAudioData]);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleCancelClick = () => {
    if (stage === 'speaking') {
      // Show confirmation dialog if recording is in progress
      setShowConfirmDialog(true);
    } else {
      // Just go back to home if not recording
      router.push('/');
    }
  };
  
  const handleConfirmCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowConfirmDialog(false);
    router.push('/');
  };
  
  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
  };

  const handleEndSpeechEarly = () => {
    console.log("handleEndSpeechEarly called. Current speakingTime:", speakingTime);
    if (isRecording) {
      stopRecording(); // This will trigger the onstop event for MediaRecorder
    }
    // Important: We need to ensure the speaking timer is also stopped here
    // to prevent it from continuing to count down and potentially calling stopRecording() again
    // or interfering with stage transitions.
    // The main speaking countdown useEffect already clears its interval when stage changes from 'speaking',
    // so explicitly clearing here might be redundant if setStage happens fast enough,
    // but it's safer to be explicit if there's any doubt.
    // For now, we rely on the existing useEffect cleanup for the speaking timer.

    setStage('completed'); // This will trigger the useEffect for audio data processing and feedback generation
  };
  
  // Calculate progress percentages for circular progress
  const prepProgress = ((10 - countdown) / 10) * 100;
  const speakingProgress = ((120 - speakingTime) / 120) * 100;
  
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      {stage === 'prep' && (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">Prepare Your Speech</h1>
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-semibold mb-6 text-center">Topic: {localTopic}</h2>
            <div className="flex flex-col items-center mb-8">
              <CircularProgress 
                progress={prepProgress} 
                size={120} 
                text={countdown} 
                progressColor="#3b82f6"
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
                progressColor={speakingTime <= 30 ? "#eab308" : "#3b82f6"} 
                className={`mb-4 ${speakingTime <= 30 ? "animate-pulse" : ""}`}
              />
            </div>
            <div className="flex justify-center items-center mb-8">
              <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <div className="h-16 w-full max-w-md bg-gray-100 rounded-lg overflow-hidden p-2">
                <AudioVisualizer 
                  audioData={audioVisualizerData}
                  width={400}
                  height={50}
                  barWidth={4}
                  barGap={2}
                  barColor="#ef4444"
                  className="w-full"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
                <p className="text-sm">Please ensure your microphone is connected and permissions are granted.</p>
              </div>
            )}
            {permissionStatus === 'denied' && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p>Microphone access is required. Please grant permission to continue.</p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleEndSpeechEarly}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
      
      {stage === 'completed' && ( // Show this briefly before transcribing starts
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Speech Completed!</h1>
          <p className="text-xl mb-8">Processing your audio...</p>
          {/* You can add a spinner here if desired */}
        </div>
      )}

      {stage === 'transcribing' && (
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Processing Your Speech</h1>
          <p className="text-xl mb-8">Transcribing your audio, please wait...</p>
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      )}

      {stage === 'generatingFeedback' && (
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Analyzing Your Speech</h1>
          <p className="text-xl mb-8">Generating your personalized feedback, please wait...</p>
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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