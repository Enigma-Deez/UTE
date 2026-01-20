import React from 'react';
import { Brain, Timer, Infinity, Watch } from 'lucide-react';
import clsx from 'clsx';
import useTimerStore from '../../store/useTimerStore';

const modes = [
  { id: 'meditation', label: 'Meditate', icon: Brain },
  { id: 'pomodoro', label: 'Focus', icon: Timer },
  { id: 'flow', label: 'Flow', icon: Infinity },
  { id: 'stopwatch', label: 'Stopwatch', icon: Watch },
];

const ModeSelector = () => {
  const { mode, setMode, status, reset } = useTimerStore();

  const handleModeChange = (newMode) => {
    if (status === 'running') return; 
    setMode(newMode);
    reset();
  };

  return (
    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-4 shadow-inner border border-white/5">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={clsx(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300",
              isActive 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;