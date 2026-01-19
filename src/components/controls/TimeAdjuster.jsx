import React from 'react';
import { Plus, Minus, Settings2 } from 'lucide-react';
import useTimerStore from '../../store/useTimerStore';

const TimeAdjuster = () => {
  const { duration, setDuration, status, mode } = useTimerStore();

  // Don't show for Flow mode or while running
  if (mode === 'flow' || status === 'running') return null;

  const adjust = (seconds) => {
    const newTime = Math.max(60, duration + seconds);
    setDuration(newTime);
  };

  return (
    <div className="flex items-center gap-6 mt-8">
        <button 
          onClick={() => adjust(-60)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
        >
          <Minus size={20} />
        </button>

        <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Duration</span>
            <span className="text-xl font-mono text-white">{Math.floor(duration / 60)} min</span>
        </div>

        <button 
          onClick={() => adjust(60)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
        >
          <Plus size={20} />
        </button>
    </div>
  );
};

export default TimeAdjuster;