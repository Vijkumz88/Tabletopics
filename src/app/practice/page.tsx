"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { useAppContext } from '@/lib/context/AppContext';
import CircularProgress from '@/components/ui/CircularProgress';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  
  // Mock topics based on difficulty
  const getTopicByDifficulty = (diff: string): string => {
    const topics = {
      easy: [
        "Tell me about your favourite holiday.",
        "What is your favourite drink?",
        "When was the last time you tried something new?",
        "Describe your perfect weekend.",
        "What's your favourite book and why?",
        "What hobby would you pick up if you had more time?",
        "Describe your childhood in three words.",
        "What's your go-to comfort food?",
        "Do you prefer mountains or beaches?",
        "What's your favourite movie and why?",
        "What was your favorite toy growing up?",
        "What's your morning routine like?",
        "What's your dream travel destination?",
        "What's the best gift you've ever received?",
        "What's your favourite subject in school and why?",
        "If you could have any pet, what would it be?",
        "What's your favourite season and why?",
        "Do you enjoy cooking or eating out more?",
        "What's a fun activity you enjoyed recently?",
        "Who is your favourite superhero?",
        "What's your favourite childhood memory?",
        "What's your favourite song to sing along to?",
        "Do you prefer tea or coffee?",
        "What's your favourite festival and how do you celebrate it?",
        "Describe your ideal home.",
        "What's your favorite dessert?",
        "What's your idea of a relaxing day?",
        "Do you like working alone or in a group?",
        "What's your favourite family tradition?",
        "What's a simple pleasure you enjoy?",
        "Describe your favorite meal.",
        "What do you enjoy doing on a rainy day?",
        "Who is someone you admire and why?",
        "What's your favourite day of the week and why?",
        "What's a place you've visited that left a big impression on you?",
        "Do you prefer sunrises or sunsets?",
        "What's your favourite indoor activity?",
        "What kind of music do you enjoy?",
        "Do you like reading books or watching movies more?",
        "What's your favourite ice cream flavour?",
        "Have you ever had a pet?",
        "What's the last good movie you watched?",
        "What's your favourite childhood cartoon?",
        "What's your dream job as a kid?",
        "Describe your favourite teacher.",
        "What's your favourite app on your phone?",
        "What's your go-to snack?",
        "What's your favourite holiday tradition?",
        "What's a new hobby you'd like to try?",
        "What's your favourite time of the day?",
        "If you could live in any city, which one would you choose?",
        "Do you prefer texting or calling?",
        "What's your favourite outdoor activity?",
        "What's the best meal you've ever had?",
        "What's your favourite quote?",
        "What's a sport you enjoy watching or playing?",
        "Do you like surprises?",
        "What's something you're really good at?",
        "Do you enjoy shopping or not?",
        "What's your favourite piece of clothing?",
        "What's your dream vacation?",
        "Do you enjoy going to museums?",
        "What's your favourite childhood game?",
        "What's the last book you read?",
        "What's your favourite smell?",
        "What's your favourite festival food?",
        "What do you love most about your hometown?",
        "What's your favourite ride at an amusement park?",
        "What's your favourite type of weather?",
        "Do you enjoy working out?",
        "What's your favourite holiday memory?",
        "What's your favourite subject to talk about?",
        "What's a movie you can watch over and over again?",
        "Do you like big cities or small towns?",
        "What's a fun fact about you?",
        "What's your favourite restaurant?",
        "What's your favourite fruit?",
        "Have you ever tried a new food and liked it?",
        "What's your least favourite chore?",
        "Do you like early mornings or late nights?",
        "What's your favourite thing to do on a weekend?",
        "What's your favourite public holiday?",
        "Do you prefer books or ebooks?",
        "What's your favourite type of cuisine?",
        "What's your favourite board game?",
        "What's your favourite animal?",
        "What's your favourite app for fun?",
        "What's your idea of a perfect Sunday?",
        "What's your favourite type of movie (comedy, drama, etc.)?",
        "What's your favourite family meal?",
        "Do you enjoy singing or dancing more?",
        "What's your favourite picnic spot?",
        "Have you ever gone camping?",
        "What's your favourite sports team?",
        "What's your go-to breakfast?",
        "What's your dream house like?",
        "What's your favourite weekend getaway?",
        "What's a tradition you want to start?",
        "Do you like to plan or go with the flow?",
        "What's your favourite memory with friends?"
      ],
      medium: [
        "Describe a time when you failed and what you learned",
        "How has technology changed your life for better or worse?",
        "What is the most difficult decision you've made?",
        "Discuss a controversial topic you feel strongly about",
        "What would you change about your country's education system?",
        "Describe how social media affects modern relationships",
        "What does success mean to you?",
        "How would you solve homelessness in your city?",
        "Describe a cultural tradition you respect but don't agree with",
        "How has your upbringing shaped your worldview?", 
        "What are the biggest environmental challenges today?", 
        "What responsibility do corporations have to society?", 
        "How do you handle criticism?", 
        "Discuss the ethics of artificial intelligence", 
        "What defines a good leader in today's world?",
        "What's a belief you hold that many people will disagree with?",
        "If you had just 100 days to live, what would you do?",
        "Explain taxes like I'm 5 years old.",
        "Why do people love football?",
        "What does tea mean to you?",
        "How do tariffs affect daily life?",
        "What's a habit that changed your life?",
        "If you had to move to another country, where would you go and why?",
        "Is lying ever justified?",
        "Describe your relationship with social media.",
        "What's your biggest accomplishment?",
        "How do you define success?",
        "What's a moment you're really proud of?",
        "How do you deal with stress?",
        "What's your opinion on climate change?",
        "What's a lesson you learned the hard way?",
        "What does happiness mean to you?",
        "How would you spend a million dollars?",
        "What do you think about remote work?",
        "How do you stay motivated?",
        "What do you think about the education system?",
        "Should voting be mandatory?",
        "What are your thoughts on cryptocurrencies?",
        "Should animals be used in scientific testing?",
        "What does 'freedom' mean to you?",
        "What is the importance of travel?",
        "Should we colonize other planets?",
        "What's a book that changed your perspective?",
        "How do you balance personal and professional life?",
        "What is one piece of advice you would give to your younger self?",
        "Is technology making us smarter or dumber?",
        "Do we have control over our destiny?",
        "How do you define love?",
        "What's the role of art in society?",
        "What do you think about cancel culture?",
        "What would you do if you had no fear?",
        "What's your take on work-life balance?",
        "What's one tradition you think should end?",
        "What's the role of sports in national pride?",
        "How do you think AI will change our lives?",
        "What's the impact of fast fashion?",
        "What's your opinion on universal basic income?",
        "How do you see the future of education?",
        "What does success mean in your culture?",
        "Is ambition always a good thing?",
        "What makes someone wise?",
        "Is honesty always the best policy?",
        "Should people always follow their passion?",
        "Is social media a force for good or bad?",
        "What would your autobiography be called?",
        "How would you describe your generation?",
        "What do you think about space exploration?",
        "What do you think is the biggest threat to humanity?",
        "Should governments regulate the internet?",
        "How can we bridge the gap between rich and poor?",
        "What makes a great leader?",
        "What role should religion play in modern life?",
        "Should voting age be lowered?",
        "What is the role of failure in success?",
        "What does it mean to be a global citizen?",
        "What's your view on arranged marriages?",
        "Should schools teach emotional intelligence?",
        "How do you handle criticism?",
        "Is patriotism still relevant today?",
        "Should college education be free?",
        "What's the impact of globalization?",
        "What should be the priority in public policy: economy or environment?",
        "How can we improve healthcare systems?",
        "How do you define personal freedom?",
        "What is your opinion on gender roles?",
        "How should we measure intelligence?",
        "Is fame worth pursuing?",
        "How do you deal with change?",
        "What is something you strongly believe in?",
        "Do you think money can buy happiness?",
        "Is there such a thing as a selfless act?",
        "What's your take on nuclear energy?",
        "What's the importance of mentorship?",
        "Should everyone learn to code?",
        "What does it mean to have integrity?",
        "What role does humor play in your life?",
        "How do you define creativity?",
        "Should we fear artificial intelligence?",
        "What's a modern invention you can't live without?",
        "Do you think failure should be celebrated?",
        "Is freedom of speech absolute?",
        "What is your view on climate activism?",
        "What is the meaning of responsibility?",
        "What is a nation's role in global peace?",
        "Do traditions limit or liberate us?",
        "How do you deal with uncertainty?",
        "What is something the world needs more of?",
        "Is peace achievable in today's world?",
        "What does your name mean to you?",
        "Is privacy a right or a privilege?",
        "How would you solve unemployment?",
        "What's a personal value you won't compromise on?",
        "Should governments fund space research?",
        "What's the future of transportation?",
        "Is there beauty in imperfection?"
      ],
      hard: [
        "When was the last time you failed?",
        "Are you afraid of social networks?",
        "Could India and Pakistan go to war?",
        "What's a quirk of yours that people find surprising?",
        "How would you fix the education system?",
        "Describe a world without money.",
        "Can AI ever replace human creativity?",
        "If you had to run for political office, what would be your campaign?",
        "What does 'freedom' mean in today's world?",
        "Is cancel culture helpful or harmful?",
        "What scares you the most about the future?",
        "How would you define your legacy?",
        "If you had to break a law, which one would it be and why?",
        "Is death a necessary part of life?",
        "Would humanity benefit from a single global language?",
        "If aliens visited Earth, what would you tell them?",
        "What's a modern myth you think people blindly follow?",
        "Can love exist without pain?",
        "Would you rather be feared or respected?",
        "If you could remove one human trait, what would it be?",
        "What does it mean to be truly alive?",
        "Is there such a thing as destiny?",
        "What if you woke up as a different person every day?",
        "Is there a limit to human potential?",
        "Should there be limits to free speech?",
        "How do you define 'truth'?",
        "What's your biggest internal conflict?",
        "Would you sacrifice happiness for success?",
        "If emotions could be controlled, should we do it?",
        "What is more important: justice or mercy?",
        "Would you choose to know how and when you'll die?",
        "Should people be allowed to choose their dreams?",
        "Can machines ever have consciousness?",
        "Should every country open its borders?",
        "What's the impact of power on morality?",
        "Would you give up all technology to live forever?",
        "If you had to restart civilization, what would you keep from ours?",
        "Do we live in a simulation?",
        "What is more dangerous: ignorance or apathy?",
        "Would you prefer peace or truth if you could only choose one?",
        "Is human conflict inevitable?",
        "Can war ever be moral?",
        "How would you design a utopia?",
        "Should governments have the right to monitor citizens?",
        "What is the true cost of convenience?",
        "If you could time travel, would you go to the past or future?",
        "Is inequality natural or man-made?",
        "What if money didn't exist?",
        "What's a moment that changed your entire worldview?",
        "If you could implant one idea into everyone's mind, what would it be?",
        "Should we eliminate prisons?",
        "Can anything truly be objective?",
        "How should humans deal with overpopulation?",
        "Would you rather be alone with truth or surrounded by lies?",
        "What role should emotion play in decision making?",
        "What is a belief you've recently changed?",
        "How do you define failure?",
        "Should humans strive to be immortal?",
        "What's more valuable: hope or knowledge?",
        "If you were invisible, what would you do?",
        "What's a lie you once believed?",
        "Can one person truly make a difference?",
        "Is freedom just an illusion?",
        "What's the purpose of suffering?",
        "Do leaders create followers or do followers create leaders?",
        "What's a question you're afraid to ask yourself?",
        "What's a belief you had as a child but no longer hold?",
        "Should morality evolve with time?",
        "What would you do if you had unlimited power for a day?",
        "What does 'humanity' mean to you?",
        "Can you ever truly know someone?",
        "If you could erase one memory, would you?",
        "Is forgiveness for others or for ourselves?",
        "How do you want to be remembered?",
        "If truth is subjective, how do we agree on anything?",
        "Can we live without expectations?",
        "Should there be a limit to how much wealth a person can have?",
        "Is it better to be needed or wanted?",
        "Is perfection a goal worth chasing?",
        "What would you do if no one judged you?",
        "What if you could read minds?",
        "What does it mean to live authentically?",
        "Would you prefer certainty or curiosity?",
        "Are we more than the sum of our experiences?",
        "Would you accept a peaceful but boring life over a chaotic meaningful one?",
        "What's a question you've never found the answer to?",
        "Should we fear the unknown or embrace it?",
        "What if we had to start society from scratch tomorrow?",
        "Would you give up comfort for meaning?",
        "What role does regret play in your life?",
        "What's something you'd fight for even if it cost you everything?",
        "Is love a choice or a feeling?",
        "What is the most courageous act you've witnessed?",
        "What's something you pretend to understand but don't?",
        "What if everyone could live forever?",
        "Should emotions be part of leadership?",
        "Is ambition a virtue or a vice?",
        "What if time stopped for everyone but you?",
        "Would you rather inspire love or fear?",
        "Should truth always be spoken, no matter the cost?"
      ]
    };
    
    const difficultyTopics = topics[difficulty as keyof typeof topics] || topics.easy;
    const randomIndex = Math.floor(Math.random() * difficultyTopics.length);
    return difficultyTopics[randomIndex];
  };
  //added from gemini
  useEffect(() => {
    console.log("Audio Hook State Update:");
    console.log("isRecording:", isRecording);
    console.log("permissionStatus:", permissionStatus);
    console.log("error:", error);
    if (audioBlob) console.log("Audio Blob:", audioBlob);
  }, [isRecording, permissionStatus, error, audioBlob]);

  // Initialize topic
  useEffect(() => {
    const newTopic = getTopicByDifficulty(difficulty);
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