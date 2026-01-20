import React, { useState } from 'react';
import { Star, Coffee, X, CheckCircle, BrainCircuit } from 'lucide-react';
import useTimerStore from '../store/useTimerStore';
import clsx from 'clsx';

const SessionSummary = ({ onClose }) => {
  const { lastSession, finishSession, setStatus, setMode, updateSettings } = useTimerStore();
  const [rating, setRating] = useState(0);

  if (!lastSession) return null;

  const handleStartBreak = () => {
    // Switch to Pomodoro Mode (Break phase) or just a simple timer?
    // Let's configure the Pomodoro timer to be the break length and start it.
    updateSettings('pomodoro', { work: lastSession.breakRecommendation }); // Hacky reuse of work timer or add break mode
    // Actually, let's just use Pomodoro 'shortBreak' logic
    updateSettings('pomodoro', { shortBreak: lastSession.breakRecommendation });
    setMode('pomodoro');
    useTimerStore.getState().nextPomoPhase(); // Force into break
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle size={32} className="text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
          <p className="text-gray-400 mb-6">You flowed for <span className="text-white font-mono">{Math.floor(lastSession.duration / 60)}m</span></p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center">
              <span className="text-2xl font-bold text-red-400">{lastSession.distractions}</span>
              <span className="text-xs uppercase tracking-wider text-gray-500">Distractions</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center">
              <span className="text-2xl font-bold text-emerald-400">{lastSession.breakRecommendation}m</span>
              <span className="text-xs uppercase tracking-wider text-gray-500">Earned Rest</span>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3">How was your focus?</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    size={24} 
                    className={clsx(star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600")} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <button 
            onClick={handleStartBreak}
            className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Coffee size={20} />
            Start {lastSession.breakRecommendation}m Break
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;