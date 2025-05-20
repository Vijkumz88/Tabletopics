"use client";

import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';

export default function TestAudioPage() {
  // State for logs
  const [logs, setLogs] = useState<string[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  
  // Audio recording hook
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    permissionStatus,
    error,
    requestPermission,
    cleanup
  } = useAudioRecorder();
  
  // Add log helper function
  const addLog = (message: string) => {
    if (mountedRef.current) {
      const timestamp = new Date().toISOString().substring(11, 23);
      setLogs(prev => [`${timestamp}: ${message}`, ...prev]);
      console.log(`${timestamp}: ${message}`); // Also log to console for debugging
    }
  };
  
  // Initialize audio element when URL is available
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      addLog(`Audio URL created: ${audioUrl.substring(0, 30)}...`);
    }
  }, [audioUrl]);
  
  // Log state changes
  useEffect(() => {
    addLog(`State update - isRecording: ${isRecording}, permissionStatus: ${permissionStatus}`);
    
    if (error) {
      addLog(`ERROR: ${error}`);
    }
    
    if (audioBlob) {
      addLog(`Audio blob created - size: ${Math.round(audioBlob.size / 1024)} KB, type: ${audioBlob.type}`);
    }
  }, [isRecording, permissionStatus, error, audioBlob]);
  
  // Handle start recording
  const handleStartRecording = async () => {
    addLog("Start recording button clicked");
    try {
      if (permissionStatus !== 'granted') {
        addLog("Requesting microphone permission...");
        const granted = await requestPermission();
        addLog(`Permission request result: ${granted ? 'granted' : 'denied'}`);
        
        if (!granted) {
          addLog("Cannot proceed without microphone permission");
          return;
        }
      }
      
      addLog("Calling startRecording()");
      await startRecording();
    } catch (err) {
      addLog(`Error in handleStartRecording: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle stop recording
  const handleStopRecording = () => {
    addLog("Stop recording button clicked");
    try {
      if (!isRecording) {
        addLog("Not currently recording, nothing to stop");
        return;
      }
      
      stopRecording();
    } catch (err) {
      addLog(`Error in handleStopRecording: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle play recording
  const handlePlayRecording = () => {
    addLog("Play recording button clicked");
    try {
      if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play()
          .then(() => addLog("Audio playback started"))
          .catch(err => addLog(`Playback error: ${err.message}`));
      } else {
        addLog("No audio available to play");
      }
    } catch (err) {
      addLog(`Error in handlePlayRecording: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Reset audio recording
  const handleReset = () => {
    addLog("Reset button clicked");
    try {
      cleanup();
      addLog("Audio recording state reset");
    } catch (err) {
      addLog(`Error in handleReset: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      console.log("TestAudioPage: Component unmounting, cleaning up resources");
      cleanup();
    };
  }, [cleanup]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Audio Recording Test</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handleStartRecording}
          disabled={isRecording}
          className={`px-4 py-2 rounded ${
            isRecording 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Start Recording
        </button>
        
        <button
          onClick={handleStopRecording}
          disabled={!isRecording}
          className={`px-4 py-2 rounded ${
            !isRecording 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          Stop Recording
        </button>
        
        <button
          onClick={handlePlayRecording}
          disabled={!audioUrl}
          className={`px-4 py-2 rounded ${
            !audioUrl 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          Play Recording
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
        >
          Reset
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current State:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Recording:</strong> {isRecording ? 'Yes' : 'No'}</p>
          <p><strong>Permission:</strong> {permissionStatus}</p>
          <p><strong>Has Audio:</strong> {audioUrl ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Logs:</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </div>
      </div>
    </div>
  );
} 