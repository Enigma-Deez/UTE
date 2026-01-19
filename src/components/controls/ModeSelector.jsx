import React from 'react';
import { Brain, Timer, Infinity } from 'lucide-react';
import clsx from 'clsx';
import useTimerStore from '../../store/useTimerStore';

const modes = [
  { id: 'meditation', label: 'Meditate', icon: Brain },
  { id: 'pomodoro', label: 'Focus', icon: Timer },
  { id: 'flow', label: 'Flow', icon: Infinity },
];

const ModeSelector = () => {
  const { mode, setMode, status, reset } = useTimerStore();

  const handleModeChange = (newMode) => {
    if (status === 'running') return; // Lock while running
    setMode(newMode);
    
    // Set default durations based on mode
    const store = useTimerStore.getState();
    if (newMode === 'pomodoro') store.setDuration(1500); // 25m
    if (newMode === 'meditation') store.setDuration(600); // 10m
    if (newMode === 'flow') store.setDuration(0); // 0 start
    
    reset();
  };

  return (
    <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-8 shadow-inner border border-white/5">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={clsx(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300",
              isActive 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={16} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;