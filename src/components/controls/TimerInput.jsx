import React, { useState, useEffect, useRef } from 'react';
import useTimerStore from '../../store/useTimerStore';
import clsx from 'clsx';

const TimerInput = () => {
  const { 
    remaining, elapsed, mode, settings, status, setDuration, reset 
  } = useTimerStore();

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const isCountUp = mode === 'flow' || mode === 'stopwatch' || (mode === 'meditation' && settings?.meditation?.infinite);
  const displayTime = isCountUp ? elapsed : remaining;

  // --- DYNAMIC FONT SIZER ---
  const getFontSize = (str) => {
    if (str.length > 7) return "text-4xl sm:text-5xl"; // 10:00:00 (8 chars)
    if (str.length > 5) return "text-5xl sm:text-6xl"; // 1:00:00 (7 chars)
    return "text-6xl sm:text-7xl"; // 25:00 (5 chars)
  };

  useEffect(() => {
    if (!isEditing) {
      const m = Math.floor(displayTime / 60);
      const s = displayTime % 60;
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
    if (isCountUp) return; 
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const finishEditing = () => {
    setIsEditing(false);
    const parts = inputValue.split(':').map(Number);
    let newSeconds = 0;
    if (parts.length === 1) newSeconds = parts[0] * 60;
    else if (parts.length === 2) newSeconds = (parts[0] * 60) + parts[1];
    else if (parts.length === 3) newSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];

    if (!isNaN(newSeconds) && newSeconds > 0) {
      setDuration(newSeconds);
      reset(); 
    }
  };

  const fontSizeClass = getFontSize(inputValue);

  return (
    <div className="relative flex flex-col items-center z-20 w-full max-w-[200px]">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => finishEditing()}
          onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
          className={clsx(
            "font-light font-mono text-center bg-transparent border-b-2 border-red-500 text-white outline-none w-full pb-2",
            fontSizeClass // Dynamic sizing for input too
          )}
          autoFocus
        />
      ) : (
        <span 
          onClick={handleClick}
          className={clsx(
            "font-light tracking-tighter font-mono tabular-nums select-none transition-all",
            fontSizeClass,
            status !== 'running' && !isCountUp ? "cursor-pointer hover:text-gray-200 hover:scale-105" : ""
          )}
        >
          {inputValue}
        </span>
      )}
      
      <span className={clsx(
        "mt-2 text-xs font-bold tracking-[0.3em] uppercase transition-colors",
        status === 'running' ? "text-red-500/80" : "text-gray-500"
      )}>
        {isEditing ? 'Type MM or HH:MM:SS' : (status === 'idle' && !isCountUp ? 'Click to Edit' : status)}
      </span>
    </div>
  );
};

export default TimerInput;