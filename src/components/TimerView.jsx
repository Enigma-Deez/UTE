/* src/components/TimerView.jsx */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import clsx from 'clsx';

import useTimerStore from '../store/useTimerStore';
import { audioEngine } from '../services/AudioEngine';
import { useWakeLock } from '../hooks/useWakeLock';
import TimerWorker from '../workers/timer.worker?worker';

import ModeSelector from './controls/ModeSelector';
import AmbientToggle from './controls/AmbientToggle';
import SettingsModal from './SettingsModal';
import TimerInput from './controls/TimerInput'; // NEW
import CreditsFooter from './CreditsFooter'; // NEW

const TimerView = () => {
  const { 
    status, remaining, elapsed, duration, progress, mode,
    pomoPhase, nextPomoPhase, 
    tick, setStatus, reset 
  } = useTimerStore();

  const [showSettings, setShowSettings] = useState(false);
  const workerRef = useRef(null);
  
  useWakeLock(status === 'running');

  useEffect(() => {
    workerRef.current = new TimerWorker();
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'TICK') tick(payload);
      else if (type === 'COMPLETED') {
        if (mode === 'pomodoro') {
          audioEngine.playBell('bowl', 1.0, 10); // 10s max
          nextPomoPhase(); 
        } else {
          setStatus('completed');
          audioEngine.playBell('bowl', 1.0, 10); // 10s max
          audioEngine.stopAll(5);
        }
      }
    };
    
    // Load Assets
    const loadAssets = async () => {
       audioEngine.loadSound('bowl', '/sounds/bowl.mp3'); 
       audioEngine.loadSound('chime', '/sounds/chime.mp3');
       audioEngine.loadSound('rain', '/sounds/rain.mp3');
       audioEngine.loadSound('forest', '/sounds/forest.mp3');
    };
    loadAssets();

    // Listener for Interval Bells (Meditation)
    // NOTE: Max duration 10s applied here
    const handleInterval = () => audioEngine.playBell('chime', 0.8, 10); 
    window.addEventListener('interval-bell', handleInterval);

    return () => {
      workerRef.current.terminate();
      window.removeEventListener('interval-bell', handleInterval);
    };
  }, [mode]); 

  const toggleTimer = () => {
    audioEngine.init();
    if (status === 'running') {
      workerRef.current.postMessage({ type: 'PAUSE' });
      setStatus('paused');
      // Only stop bells/ambients if you want silence on pause. 
      // Usually ambient continues in premium apps, but we'll dim it.
      // For now, let's leave ambient running but stop bells?
      // User requested "Sub alarms always ring". 
    } else {
      workerRef.current.postMessage({ 
        type: 'START', 
        payload: { durationSeconds: remaining } 
      });
      setStatus('running');
      if (status === 'idle') audioEngine.playBell('bowl', 1.0, 10);
    }
  };

  const handleReset = () => {
    workerRef.current.postMessage({ type: 'STOP' });
    audioEngine.stopAll();
    reset();
  };

  // Visuals
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = mode === 'flow' ? circumference : circumference * (1 - progress); 

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-between p-6 overflow-hidden relative">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <CreditsFooter />

      {/* HEADER */}
      <header className="w-full flex justify-center pt-4 z-10">
        <ModeSelector />
      </header>

      {/* STAGE */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Ring */}
            <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-2xl pointer-events-none" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={radius} stroke="#1f2937" strokeWidth="6" fill="transparent" />
                <motion.circle
                    cx="150" cy="150" r={radius}
                    stroke={mode === 'pomodoro' && pomoPhase !== 'work' ? "#10b981" : "#C41E3A"} 
                    strokeWidth="8" fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </svg>

            {/* Editable Time Display */}
            <TimerInput />
        </div>
      </main>

      {/* DASHBOARD */}
      <footer className="w-full max-w-lg flex flex-col items-center gap-8 pb-8 z-10">
        <div className="flex items-center gap-10">
          <button 
            onClick={handleReset}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
          >
            <RotateCcw size={22} />
          </button>

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
          
          <button 
             className={clsx(
               "p-4 rounded-full transition-all border border-white/5",
               showSettings ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"
             )}
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