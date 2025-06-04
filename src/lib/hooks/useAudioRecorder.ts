import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder: MediaRecorder | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
}

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    mediaRecorder: null,
    audioBlob: null,
    audioUrl: null,
    error: null,
    permissionStatus: 'prompt',
  });

  // Use refs to track state without causing re-renders
  const isRecordingRef = useRef(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check browser support
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setState(prev => ({ ...prev, permissionStatus: 'unsupported', error: 'Your browser does not support audio recording' }));
    }
  }, []);

  // Request microphone permissions
  const requestPermission = useCallback(async () => {
    console.log("useAudioRecorder: requestPermission called");

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error('useAudioRecorder: navigator.mediaDevices.getUserMedia is not available.');
      setState(prev => ({
        ...prev,
        permissionStatus: 'unsupported',
        error: 'Audio recording is not supported by your browser or the page is not loaded securely (HTTPS). Please ensure you are using HTTPS.'
      }));
      return false;
    }

    // Close any existing audio context to prevent duplicates
    if (audioContextRef.current) {
      console.log("useAudioRecorder: Closing existing audio context");
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop any existing stream tracks
    if (streamRef.current) {
      console.log("useAudioRecorder: Stopping existing stream tracks");
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("useAudioRecorder: Got media stream");
      streamRef.current = stream;
      
      // Set up audio context and analyser for visualization
      const audioContext = new AudioContext();
      console.log("useAudioRecorder: AudioContext created");
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      console.log("useAudioRecorder: Analyser setup complete");

      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setState(prev => ({ 
        ...prev, 
        permissionStatus: 'denied', 
        error: 'Microphone access denied. Please enable microphone access in your browser settings.'
      }));
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    console.log("useAudioRecorder: startRecording called. Current state:", state.isRecording, state.permissionStatus);
    
    // Fix the logic error - only return if already recording
    if (state.isRecording) {
      console.log("useAudioRecorder: Already recording, returning.");
      return;
    }
    
    const permissionGranted = state.permissionStatus === 'granted' || await requestPermission();
    if (!permissionGranted || !streamRef.current) {
      console.log("useAudioRecorder: Permission denied or no stream available");
      return;
    }
    
    try {
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      console.log("useAudioRecorder: MediaRecorder created");
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log("useAudioRecorder: MediaRecorder stopped");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update the ref first to prevent race conditions
        isRecordingRef.current = false;
        
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl
        }));
      };
      
      mediaRecorder.start();
      console.log("useAudioRecorder: MediaRecorder started");
      
      // Start timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);
      
      // Update the ref first to prevent race conditions
      isRecordingRef.current = true;
      
      setState(prev => ({ ...prev, isRecording: true, mediaRecorder }));
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ ...prev, error: `Failed to start recording: ${error}` }));
    }
  }, [state.isRecording, state.permissionStatus, requestPermission]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("useAudioRecorder: stopRecording called");
    
    if (!state.isRecording || !state.mediaRecorder) {
      console.log("useAudioRecorder: Not recording or no mediaRecorder, can't stop");
      return;
    }
    
    try {
      state.mediaRecorder.stop();
      console.log("useAudioRecorder: MediaRecorder stop command issued");
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Don't set isRecording to false here - let the onstop handler do it
      // to ensure we have the audio blob before changing state
    } catch (error) {
      console.error('Error stopping recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to stop recording', isRecording: false }));
    }
  }, [state.isRecording, state.mediaRecorder]);

  // Get audio data for visualization
  const getAudioData = useCallback(() => {
    if (!analyserRef.current) return new Uint8Array(0);
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  // Clean up resources
  const cleanup = useCallback(() => {
    console.log("useAudioRecorder: cleanup called");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      if (state.mediaRecorder && state.isRecording) {
        state.mediaRecorder.stop();
      }
    } catch (e) {
      console.error("Error stopping mediaRecorder during cleanup:", e);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
      audioContextRef.current = null;
    }
    
    // Use a functional update to avoid stale state
    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      mediaRecorder: null,
      audioBlob: null,
      audioUrl: null,
      error: null,
      permissionStatus: 'prompt',
    });
    
    isRecordingRef.current = false;
  }, []);  // Removed state dependencies to prevent infinite loops

  // Clean up on unmount only
  useEffect(() => {
    return () => {
      console.log("useAudioRecorder: unmount cleanup");
      cleanup();
    };
  }, []); // Intentionally empty to run only on unmount

  return {
    ...state,
    startRecording,
    stopRecording,
    getAudioData,
    requestPermission,
    cleanup
  };
}; 