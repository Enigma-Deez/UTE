import React from 'react';
import { X, Bell, Check, Clock } from 'lucide-react';
import useTimerStore from '../store/useTimerStore';
import clsx from 'clsx';

const SettingsModal = ({ onClose }) => {
  const { 
    mode, 
    meditationDuration, intervals, toggleInterval, // Meditation
    pomoConfig, updatePomoSettings, // Pomodoro
    setDuration 
  } = useTimerStore();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            {mode === 'meditation' ? <Bell size={20} /> : <Clock size={20} />}
            {mode === 'meditation' ? 'Interval Bells' : 'Pomodoro Cycles'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* --- MEDITATION SETTINGS --- */}
          {mode === 'meditation' && (
            <>
              <div>
                <label className="text-sm text-gray-400 uppercase tracking-widest block mb-4">Total Duration</label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 20, 30].map(m => (
                    <button
                      key={m}
                      onClick={() => setDuration(m * 60)}
                      className={clsx(
                        "py-3 rounded-xl border text-sm font-medium transition-all",
                        meditationDuration === m * 60 
                          ? "bg-red-900/30 border-red-500 text-red-100" 
                          : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 uppercase tracking-widest block mb-4">Intermediate Bells</label>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-500 mb-4">Click to add a bell at these times:</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Generate simple checkpoints based on duration */}
                    {[...Array(Math.floor(meditationDuration / 60))].map((_, i) => {
                      const min = i + 1;
                      const sec = min * 60;
                      if (sec >= meditationDuration) return null;
                      
                      const isActive = intervals.includes(sec);
                      return (
                        <button
                          key={min}
                          onClick={() => toggleInterval(sec)}
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xs transition-all border",
                            isActive
                              ? "bg-red-600 border-red-500 text-white"
                              : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
                          )}
                        >
                          {min}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- POMODORO SETTINGS --- */}
          {mode === 'pomodoro' && (
            <div className="space-y-6">
              {[
                { label: 'Work Duration', key: 'work' },
                { label: 'Short Break', key: 'shortBreak' },
                { label: 'Long Break', key: 'longBreak' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <span className="text-gray-300">{setting.label}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updatePomoSettings({ [setting.key]: Math.max(1, pomoConfig[setting.key] - 1) })}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                    >-</button>
                    <span className="w-8 text-center font-mono">{pomoConfig[setting.key]}</span>
                    <button 
                      onClick={() => updatePomoSettings({ [setting.key]: pomoConfig[setting.key] + 1 })}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === 'flow' && (
            <div className="text-center text-gray-500 py-4">
              Flow mode is open-ended. <br/> Bells every 15 minutes logic coming soon.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;