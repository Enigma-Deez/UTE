/* src/components/controls/TimerInput.jsx */
import React, { useState, useEffect, useRef } from 'react';
import useTimerStore from '../../store/useTimerStore';
import clsx from 'clsx';

const TimerInput = () => {
  const { 
    remaining, 
    elapsed, 
    mode, 
    settings, 
    status, 
    setDuration, 
    reset 
  } = useTimerStore();

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // --- 1. DETERMINE IF WE ARE COUNTING UP OR DOWN ---
  const isCountUp = 
    mode === 'flow' || 
    mode === 'stopwatch' || 
    (mode === 'meditation' && settings?.meditation?.infinite);

  // --- 2. SELECT THE CORRECT TIME SOURCE ---
  // The Bug was here: It previously only checked mode === 'flow'
  const displayTime = isCountUp ? elapsed : remaining;

  // Sync input with store when not editing
  useEffect(() => {
    if (!isEditing) {
      const m = Math.floor(displayTime / 60);
      const s = displayTime % 60;
      // Format: MM:SS or HH:MM:SS if > 60 mins
      const h = Math.floor(m / 60);
      const mDisplay = m % 60;

      let formatted = "";
      if (h > 0) {
        formatted = `${h}:${mDisplay < 10 ? '0' : ''}${mDisplay}:${s < 10 ? '0' : ''}${s}`;
      } else {
        formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
      }
      
      setInputValue(formatted);
    }
  }, [displayTime, isEditing]);

  const handleClick = () => {
    if (status === 'running') return; 
    if (isCountUp) return; // Cannot edit start time for Stopwatch/Flow
    
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handleBlur = () => finishEditing();
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') finishEditing();
  };

  const finishEditing = () => {
    setIsEditing(false);
    
    // Parse input (MM, MM:SS, or HH:MM:SS)
    const parts = inputValue.split(':').map(Number);
    let newSeconds = 0;

    if (parts.length === 1) {
      newSeconds = parts[0] * 60;
    } else if (parts.length === 2) {
      newSeconds = (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      newSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    if (!isNaN(newSeconds) && newSeconds > 0) {
      setDuration(newSeconds);
      reset(); 
    }
  };

  return (
    <div className="relative flex flex-col items-center z-20">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="text-6xl sm:text-7xl font-light font-mono text-center bg-transparent border-b-2 border-red-500 text-white outline-none w-64 pb-2"
          autoFocus
        />
      ) : (
        <span 
          onClick={handleClick}
          className={clsx(
            "text-6xl sm:text-7xl font-light tracking-tighter font-mono tabular-nums select-none",
            status !== 'running' && !isCountUp ? "cursor-pointer hover:text-gray-200 hover:scale-105 transition-all" : ""
          )}
        >
          {inputValue}
        </span>
      )}
      
      {/* Helper Text */}
      <span className={clsx(
        "mt-2 text-xs font-bold tracking-[0.3em] uppercase transition-colors",
        status === 'running' ? "text-red-500/80" : "text-gray-500"
      )}>
        {isEditing ? 'Type MM:SS' : (status === 'idle' && !isCountUp ? 'Click Time to Edit' : status)}
      </span>
    </div>
  );
};

export default TimerInput;