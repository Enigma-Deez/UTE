import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings2, AlertCircle, StopCircle } from 'lucide-react';
import clsx from 'clsx';

import useTimerStore from '../store/useTimerStore';
import { audioEngine } from '../services/AudioEngine';
import { useWakeLock } from '../hooks/useWakeLock';
import TimerWorker from '../workers/timer.worker?worker';

import ModeSelector from './controls/ModeSelector';
import AmbientToggle from './controls/AmbientToggle';
import SettingsModal from './SettingsModal';
import SessionSummary from './SessionSummary';
import TimerInput from './controls/TimerInput';
import CreditsFooter from './CreditsFooter';

const TimerView = () => {
  const { 
    status, remaining, elapsed, progress, mode, settings,
    flowState, distractions, 
    currentStepIndex, 
    addDistraction, finishSession, nextSequenceStep, 
    tick, setStatus, reset 
  } = useTimerStore();

  const [showSettings, setShowSettings] = useState(false);
  const workerRef = useRef(null);
  
  useWakeLock(status === 'running');

  // --- ENGINE & AUDIO ---
  useEffect(() => {
    workerRef.current = new TimerWorker();
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'TICK') tick(payload);
      else if (type === 'COMPLETED') {
        if (mode === 'pomodoro') {
           // Sequence Logic
           nextSequenceStep(); 
        } else {
          setStatus('completed');
          const soundKey = settings?.meditation?.soundEnd || 'bowl';
          audioEngine.playBell(soundKey, 1.0, 10);
          audioEngine.stopAll(5);
        }
      }
    };
    
    const loadAssets = async () => {
       await audioEngine.loadSound('bowl', '/sounds/bowl.mp3'); 
       await audioEngine.loadSound('chime', '/sounds/chime.mp3');
       await audioEngine.loadSound('rain', '/sounds/rain.mp3');
       await audioEngine.loadSound('forest', '/sounds/forest.mp3');
    };
    loadAssets();

    // Event Listeners
    const handleInterval = () => audioEngine.playBell(settings?.meditation?.soundInterval || 'chime', 0.8, 8);
    const handleUltradian = () => audioEngine.playBell(settings?.flow?.sound90Min || 'chime', 0.5, 5);
    
    const handlePhaseChange = (e) => {
      const nextType = e.detail.type; 
      const soundKey = nextType === 'focus' 
        ? (settings.pomodoro?.soundFocusStart || 'bowl')
        : (settings.pomodoro?.soundBreakStart || 'chime');
      
      if (soundKey !== 'none') {
        audioEngine.playBell(soundKey, 1.0, 10);
      }
    };

    window.addEventListener('interval-bell', handleInterval);
    window.addEventListener('ultradian-bell', handleUltradian);
    window.addEventListener('phase-change', handlePhaseChange);

    return () => {
      workerRef.current.terminate();
      window.removeEventListener('interval-bell', handleInterval);
      window.removeEventListener('ultradian-bell', handleUltradian);
      window.removeEventListener('phase-change', handlePhaseChange);
    };
  }, [mode, settings]);

  // --- AUTO-START ---
  useEffect(() => {
    if (mode === 'pomodoro' && status === 'running') {
      const activeSeq = settings.sequences.find(s => s.id === settings.activeSequenceId);
      const currentStep = activeSeq?.steps[currentStepIndex];
      if (currentStep) {
        workerRef.current.postMessage({ 
          type: 'START', 
          payload: { durationSeconds: currentStep.duration * 60, countUp: false } 
        });
      }
    }
  }, [currentStepIndex, mode]);

  // --- CONTROLS ---
  const toggleTimer = () => {
    audioEngine.init();
    if (status === 'running') {
      workerRef.current.postMessage({ type: 'PAUSE' });
      setStatus('paused');
    } else {
      const isCountUp = mode === 'flow' || mode === 'stopwatch' || (mode === 'meditation' && settings.meditation.infinite);
      const durationVal = mode === 'meditation' ? settings.meditation.duration : remaining;

      workerRef.current.postMessage({ 
        type: 'START', 
        payload: { durationSeconds: durationVal, countUp: isCountUp } 
      });
      setStatus('running');
      
      // Start Sound
      if (status === 'idle') {
        if (mode === 'pomodoro') {
           const sound = settings.pomodoro?.soundFocusStart || 'bowl';
           if (sound !== 'none') audioEngine.playBell(sound, 1.0, 10);
        } else {
           audioEngine.playBell('bowl', 1.0, 10);
        }
      }
    }
  };

  const handleStop = () => {
    workerRef.current.postMessage({ type: 'STOP' });
    audioEngine.stopAll();
    if (mode === 'flow' && elapsed > 60) finishSession(); 
    else reset(); // This is the function that was failing
  };

  // --- VISUAL VARIABLES ---
  const activeSeq = settings.sequences.find(s => s.id === settings.activeSequenceId);
  const currentStep = activeSeq?.steps[currentStepIndex];

  let progressPct = 0;
  let totalRemainingText = "";
  
  // THEME COLOR LOGIC
  const isBreak = mode === 'pomodoro' && currentStep?.type === 'break';
  // If Break: Green. If Focus: Red.
  const activeColorHex = isBreak ? "#10b981" : "#C41E3A"; 
  const activeColorClass = isBreak ? "text-emerald-500" : "text-red-500";

  if (mode === 'pomodoro' && activeSeq) {
    const totalDuration = activeSeq.steps.reduce((acc, step) => acc + (step.duration * 60), 0);
    const prevStepsDuration = activeSeq.steps.slice(0, currentStepIndex).reduce((acc, step) => acc + (step.duration * 60), 0);
    const totalElapsed = prevStepsDuration + elapsed;
    progressPct = totalElapsed / totalDuration;

    const totalSecondsLeft = Math.max(0, totalDuration - totalElapsed);
    const m = Math.floor(totalSecondsLeft / 60);
    const h = Math.floor(m / 60);
    const mDisp = m % 60;
    totalRemainingText = h > 0 ? `${h}h ${mDisp}m left total` : `${mDisp}m left total`;
  } else {
    const isInfinite = mode === 'flow' || mode === 'stopwatch' || (mode === 'meditation' && settings.meditation.infinite);
    progressPct = isInfinite ? 0 : progress; 
  }
  
  if (progressPct > 1) progressPct = 1;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progressPct);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-between p-6 overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <SessionSummary onClose={() => reset()} />
      <CreditsFooter />

      <header className="w-full flex justify-center pt-4 z-10">
        <ModeSelector />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            
            {/* SVG Ring - B&W Style, only stroke is colored */}
            <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-2xl pointer-events-none" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={120} stroke="#1f2937" strokeWidth="6" fill="transparent" />
                <motion.circle
                    cx="150" cy="150" r={120}
                    stroke={mode === 'flow' && flowState === 'flow_zone' ? "#8b5cf6" : activeColorHex}
                    strokeWidth="8" fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </svg>
            
            <div className="flex flex-col items-center z-20">
              <TimerInput />
              
              {/* Status Text (Colored) */}
              <div className="h-6 flex flex-col items-center justify-center mt-2">
                 {mode === 'pomodoro' && (
                   <span className={clsx(
                     "text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300",
                     // Logic: If Idle, gray. If Running, Red/Green.
                     status === 'running' ? activeColorClass : "text-gray-500"
                   )}>
                     {status === 'running' ? currentStep?.type : status}
                   </span>
                 )}

                 {mode === 'pomodoro' && (
                   <span className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">
                     {totalRemainingText}
                   </span>
                 )}
                 
                 {mode !== 'pomodoro' && (
                    <span className={clsx(
                      "text-xs font-bold tracking-[0.2em] uppercase",
                      status === 'running' ? "text-red-500" : "text-gray-500"
                    )}>
                      {status === 'idle' ? 'Ready' : status}
                    </span>
                 )}
              </div>
            </div>
        </div>
      </main>

      {/* Footer Controls (Minimalist B&W) */}
      <footer className="w-full max-w-lg flex flex-col items-center gap-8 pb-8 z-10">
        <div className="flex items-center gap-10">
          
          <button 
            onClick={handleStop}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
          >
            {mode === 'flow' && status !== 'idle' ? <StopCircle size={22} /> : <RotateCcw size={22} />}
          </button>

          <button 
            onClick={toggleTimer}
            className="p-7 rounded-[2.5rem] bg-white text-black hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/10"
          >
            {status === 'running' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
             className={clsx("p-4 rounded-full transition-all border border-white/5", showSettings ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white")}
             onClick={() => setShowSettings(true)}
          >
             <Settings2 size={22} />
          </button>
        </div>
        <AmbientToggle />
      </footer>
    </div>
  );
};

export default TimerView;