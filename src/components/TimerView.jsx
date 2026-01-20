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
    flowState, distractions, addDistraction, finishSession,
    pomoPhase, nextPomoPhase, 
    tick, setStatus, reset 
  } = useTimerStore();

  const [showSettings, setShowSettings] = useState(false);
  const workerRef = useRef(null);
  
  useWakeLock(status === 'running');

  // --- ENGINE SETUP ---
  useEffect(() => {
    workerRef.current = new TimerWorker();
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'TICK') tick(payload);
      else if (type === 'COMPLETED') {
        if (mode === 'pomodoro') {
          audioEngine.playBell('bowl', 1.0, 10);
          nextPomoPhase(); 
        } else {
          setStatus('completed');
          const soundKey = settings?.meditation?.soundEnd || 'bowl';
          audioEngine.playBell(soundKey, 1.0, 10);
          audioEngine.stopAll(5);
        }
      }
    };
    
    // --- LOCAL ASSETS RESTORED ---
    // User must put bowl.mp3, chime.mp3, rain.mp3, forest.mp3 in /public/sounds/
    const loadAssets = async () => {
       await audioEngine.loadSound('bowl', '/sounds/bowl.mp3'); 
       await audioEngine.loadSound('chime', '/sounds/chime.mp3');
       await audioEngine.loadSound('rain', '/sounds/rain.mp3');
       await audioEngine.loadSound('forest', '/sounds/forest.mp3');
    };
    loadAssets();

    const handleInterval = () => {
        const soundKey = settings?.meditation?.soundInterval || 'chime';
        audioEngine.playBell(soundKey, 0.8, 8);
    };
    const handleUltradian = () => {
        const soundKey = settings?.flow?.sound90Min || 'chime';
        audioEngine.playBell(soundKey, 0.5, 5);
    };

    window.addEventListener('interval-bell', handleInterval);
    window.addEventListener('ultradian-bell', handleUltradian);

    return () => {
      workerRef.current.terminate();
      window.removeEventListener('interval-bell', handleInterval);
      window.removeEventListener('ultradian-bell', handleUltradian);
    };
  }, [mode, settings]);

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
      if (status === 'idle') audioEngine.playBell('bowl', 1.0, 10);
    }
  };

  const handleStop = () => {
    workerRef.current.postMessage({ type: 'STOP' });
    audioEngine.stopAll();
    
    // FLOW MODE: Stop triggers the Summary Card
    if (mode === 'flow') {
      finishSession(); 
    } else {
      reset();
    }
  };

  // --- RENDER HELPERS ---
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const isInfinite = mode === 'flow' || mode === 'stopwatch' || (mode === 'meditation' && settings.meditation.infinite);
  const dashOffset = isInfinite ? 0 : circumference * (1 - progress); 
  
  const getStrokeColor = () => {
    if (mode === 'pomodoro' && pomoPhase !== 'work') return "#10b981"; 
    if (mode === 'flow') {
       if (flowState === 'flow_zone') return "#8b5cf6"; // Deep Focus Violet
       if (flowState === 'ultradian_limit') return "#f59e0b"; // Warning Orange
    }
    return "#C41E3A"; 
  };

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
            
            {/* Flow Zone Glow Effect */}
            {flowState === 'flow_zone' && status === 'running' && (
               <div className="absolute inset-0 rounded-full blur-3xl bg-violet-900/40 animate-pulse" />
            )}

            <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-2xl pointer-events-none" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={radius} stroke="#1f2937" strokeWidth="6" fill="transparent" />
                <motion.circle
                    cx="150" cy="150" r={radius}
                    stroke={getStrokeColor()}
                    strokeWidth="8" fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </svg>
            
            <TimerInput />
            
            {/* Distraction Button */}
            {mode === 'flow' && status === 'running' && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={addDistraction}
                className="absolute bottom-16 flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 text-gray-400 hover:text-white transition-colors border border-white/5"
              >
                <AlertCircle size={12} />
                <span>Distracted ({distractions})</span>
              </motion.button>
            )}
        </div>
      </main>

      <footer className="w-full max-w-lg flex flex-col items-center gap-8 pb-8 z-10">
        <div className="flex items-center gap-10">
          
          {/* RESET / FINISH BUTTON */}
          <button 
            onClick={handleStop}
            className={clsx(
              "p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5",
              mode === 'flow' && status !== 'idle' && "bg-violet-900/20 text-violet-300 border-violet-500/30 hover:bg-violet-900/40"
            )}
            title={mode === 'flow' ? "Finish Session" : "Reset Timer"}
          >
            {mode === 'flow' && status !== 'idle' ? <StopCircle size={22} /> : <RotateCcw size={22} />}
          </button>

          {/* PLAY / PAUSE */}
          <button 
            onClick={toggleTimer}
            className={clsx(
              "p-7 rounded-[2.5rem] text-white shadow-lg transition-all active:scale-95 border-t",
              mode === 'pomodoro' && pomoPhase !== 'work' 
                 ? "bg-gradient-to-b from-emerald-600 to-emerald-800 shadow-emerald-900/40 border-emerald-500"
                 : "bg-gradient-to-b from-red-600 to-red-800 shadow-red-900/40 border-red-500"
            )}
          >
            {status === 'running' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          {/* SETTINGS */}
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