/* src/components/TimerView.jsx */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useTimerStore from '../store/useTimerStore';
import { audioEngine } from '../services/AudioEngine';
import { useWakeLock } from '../hooks/useWakeLock';
import TimerWorker from '../workers/timer.worker?worker'; // Vite Worker Import

const TimerView = () => {
  // State
  const { 
    status, remaining, duration, progress, 
    tick, setStatus, reset 
  } = useTimerStore();

  // Refs
  const workerRef = useRef(null);

  // Wake Lock (Active only when running)
  useWakeLock(status === 'running');

  // Initialize Worker & Audio
  useEffect(() => {
    workerRef.current = new TimerWorker();

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'TICK') {
        tick(payload);
      } else if (type === 'COMPLETED') {
        setStatus('completed');
        audioEngine.playBell('bowl_end', 1.0); // End bell
        audioEngine.stopAll(5); // Fade out ambient over 5s
      }
    };

    // Preload Audio (Replace with real URLs)
    audioEngine.loadSound('bowl_start', '/sounds/bowl_start.mp3');
    audioEngine.loadSound('bowl_end', '/sounds/bowl_end.mp3');
    audioEngine.loadSound('rain', '/sounds/rain_loop.mp3');

    // Listen for Checkpoints (from store logic)
    const handleCheckpoint = () => audioEngine.playBell('bowl_start', 0.5);
    window.addEventListener('checkpoint-reached', handleCheckpoint);

    return () => {
      workerRef.current.terminate();
      window.removeEventListener('checkpoint-reached', handleCheckpoint);
    };
  }, []);

  // Timer Controls
  const toggleTimer = () => {
    audioEngine.init(); // Unlock AudioContext

    if (status === 'running') {
      workerRef.current.postMessage({ type: 'PAUSE' });
      setStatus('paused');
      audioEngine.stopAll(1); // Quick fade out on pause
    } else {
      // START or RESUME
      workerRef.current.postMessage({ 
        type: 'START', 
        payload: { durationSeconds: duration } 
      });
      setStatus('running');
      
      // If just starting, play ambient
      if (status === 'idle') {
        audioEngine.playBell('bowl_start');
        audioEngine.playAmbient('rain');
      } else {
        // Resuming ambient
        audioEngine.playAmbient('rain');
      }
    }
  };

  const handleReset = () => {
    workerRef.current.postMessage({ type: 'STOP' });
    audioEngine.stopAll();
    reset();
  };

  // SVG Math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Time Formatter
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      
      {/* Timer Container - Glassmorphism */}
      <div className="relative w-80 h-80 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-full shadow-2xl border border-white/10">
        
        {/* SVG Ring */}
        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Track */}
          <circle
            cx="150" cy="150" r={radius}
            stroke="#1f2937" strokeWidth="8" fill="transparent"
          />
          {/* Progress Indicator */}
          <motion.circle
            cx="150" cy="150" r={radius}
            stroke="#C41E3A" strokeWidth="8" fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }} // Smooth 1s transition matching worker
          />
        </svg>

        {/* Text Display */}
        <div className="z-10 text-center">
          <div className="text-6xl font-light tracking-widest font-mono">
            {formatTime(remaining)}
          </div>
          <div className="text-gray-400 mt-2 uppercase text-sm tracking-widest">
            {status === 'idle' ? 'Ready' : status}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-12 flex gap-6">
        <button 
          onClick={handleReset}
          className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
        >
          Reset
        </button>

        <button 
          onClick={toggleTimer}
          className="px-8 py-3 rounded-full bg-red-700 hover:bg-red-600 text-white font-semibold tracking-wide shadow-lg shadow-red-900/50 transition-all transform active:scale-95"
        >
          {status === 'running' ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
};

export default TimerView;