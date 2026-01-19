import React, { useState, useEffect, useRef } from 'react';
import useTimerStore from '../../store/useTimerStore';
import clsx from 'clsx';

const TimerInput = () => {
  const { remaining, elapsed, mode, status, setDuration, reset } = useTimerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Sync input with store when not editing
  useEffect(() => {
    if (!isEditing) {
      const time = mode === 'flow' ? elapsed : remaining;
      const m = Math.floor(time / 60);
      const s = time % 60;
      setInputValue(`${m}:${s < 10 ? '0' : ''}${s}`);
    }
  }, [remaining, elapsed, isEditing, mode]);

  const handleClick = () => {
    if (status === 'running') return; // Lock while running
    if (mode === 'flow') return; // Flow is count-up, usually not editable start time
    
    setIsEditing(true);
    // When editing starts, clear formatting for easier typing? 
    // Or keep it. Let's keep current value but select it.
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handleBlur = () => {
    finishEditing();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') finishEditing();
  };

  const finishEditing = () => {
    setIsEditing(false);
    
    // Parse logic: Supports "20" (mins), "20:00" (mm:ss), "1:00:00" (hh:mm:ss)
    const parts = inputValue.split(':').map(Number);
    let newSeconds = 0;

    if (parts.length === 1) {
      // User typed "20" -> 20 minutes
      newSeconds = parts[0] * 60;
    } else if (parts.length === 2) {
      // User typed "20:30"
      newSeconds = (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      newSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    if (!isNaN(newSeconds) && newSeconds > 0) {
      setDuration(newSeconds);
      reset(); // Reset timer to this new duration
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
            status !== 'running' && mode !== 'flow' ? "cursor-pointer hover:text-gray-200 hover:scale-105 transition-all" : ""
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
        {isEditing ? 'Type MM or MM:SS' : (status === 'idle' ? 'Click' : status)}
      </span>
    </div>
  );
};

export default TimerInput;