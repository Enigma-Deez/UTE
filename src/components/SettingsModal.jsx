import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import useTimerStore from '../store/useTimerStore';
import SequenceEditor from './SequenceEditor'; // Ensure this is imported
import clsx from 'clsx';

const sounds = [
  { id: 'bowl', label: 'Singing Bowl' },
  { id: 'chime', label: 'Zen Chime' },
  { id: 'forest', label: 'Nature Clip' }
];

const SettingsModal = ({ onClose }) => {
  const { mode, settings, updateSettings, toggleInterval } = useTimerStore();
  const [newInterval, setNewInterval] = useState('');

  const handleAddInterval = (e) => {
    e.preventDefault();
    if (!newInterval) return;
    const parts = newInterval.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 1) seconds = parts[0] * 60;
    else seconds = (parts[0] * 60) + parts[1];
    toggleInterval(seconds);
    setNewInterval('');
  };

  const formatSec = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-medium text-white capitalize">{mode} Settings</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* MEDITATION SETTINGS */}
          {mode === 'meditation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                <span className="text-gray-300">Infinite Session</span>
                <button 
                   onClick={() => updateSettings('meditation', { infinite: !settings.meditation.infinite })}
                   className={clsx("w-12 h-6 rounded-full relative transition-colors", settings.meditation.infinite ? "bg-green-500" : "bg-gray-700")}
                >
                  <div className={clsx("w-4 h-4 bg-white rounded-full absolute top-1 transition-all", settings.meditation.infinite ? "left-7" : "left-1")} />
                </button>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs uppercase text-gray-500 tracking-wider">Soundscape</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-gray-400 block mb-1">Ending</label>
                     <select 
                       value={settings.meditation.soundEnd}
                       onChange={(e) => updateSettings('meditation', { soundEnd: e.target.value })}
                       className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                     >
                       {sounds.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-400 block mb-1">Intervals</label>
                     <select 
                       value={settings.meditation.soundInterval}
                       onChange={(e) => updateSettings('meditation', { soundInterval: e.target.value })}
                       className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                     >
                       {sounds.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                   </div>
                 </div>
              </div>

              <div>
                <h3 className="text-xs uppercase text-gray-500 tracking-wider mb-3">Sub-Alarms</h3>
                <form onSubmit={handleAddInterval} className="flex gap-2 mb-4">
                  <input 
                    type="text" placeholder="e.g. 5 or 5:30" 
                    value={newInterval} onChange={(e) => setNewInterval(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none"
                  />
                  <button type="submit" className="bg-white text-black px-4 rounded-xl font-medium"><Plus size={18} /></button>
                </form>
                <div className="space-y-2">
                  {settings.meditation.intervals.map((t) => (
                    <div key={t} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="font-mono text-white">{formatSec(t)}</span>
                      <button onClick={() => toggleInterval(t)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* POMODORO SETTINGS */}
          {mode === 'pomodoro' && (
             <div className="space-y-6">
               
               {/* New Audio Config */}
               <div className="space-y-4 border-b border-white/5 pb-6">
                 <h3 className="text-xs uppercase text-gray-500 tracking-wider">Transition Sounds</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-gray-400 block mb-1">Focus Start</label>
                     <select 
                       value={settings.pomodoro?.soundFocusStart || 'bowl'}
                       onChange={(e) => updateSettings('pomodoro', { soundFocusStart: e.target.value })}
                       className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                     >
                       <option value="none">Mute</option>
                       {sounds.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-400 block mb-1">Break Start</label>
                     <select 
                       value={settings.pomodoro?.soundBreakStart || 'chime'}
                       onChange={(e) => updateSettings('pomodoro', { soundBreakStart: e.target.value })}
                       className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                     >
                       <option value="none">Mute</option>
                       {sounds.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                   </div>
                 </div>
               </div>

               <SequenceEditor />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;