/* src/components/SequenceEditor.jsx */
import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Save, Play } from 'lucide-react';
import useTimerStore from '../store/useTimerStore';
import clsx from 'clsx';

const SequenceEditor = () => {
  const { settings, addSequence, updateSequence, deleteSequence, setActiveSequence } = useTimerStore();
  const activeSeq = settings.sequences.find(s => s.id === settings.activeSequenceId);

  // Local state for the "New Sequence" form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [quickString, setQuickString] = useState('');

  const handleCreate = () => {
    if (!newName || !quickString) return;
    
    // Parse "25 5 25 10" logic
    const times = quickString.split(/[\s,.]+/).map(Number).filter(n => !isNaN(n));
    const steps = times.map((t, i) => ({
      type: i % 2 === 0 ? 'focus' : 'break',
      duration: t
    }));

    addSequence(newName, steps);
    setIsCreating(false);
    setNewName('');
    setQuickString('');
  };

  const handleDeleteStep = (index) => {
     if(!activeSeq) return;
     const newSteps = activeSeq.steps.filter((_, i) => i !== index);
     updateSequence(activeSeq.id, { steps: newSteps });
  };

  const handleAddStep = () => {
     if(!activeSeq) return;
     updateSequence(activeSeq.id, { steps: [...activeSeq.steps, { type: 'focus', duration: 25 }] });
  };

  const updateStep = (index, field, value) => {
     const newSteps = [...activeSeq.steps];
     newSteps[index] = { ...newSteps[index], [field]: value };
     updateSequence(activeSeq.id, { steps: newSteps });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-widest">Active Sequence</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {settings.sequences.map(seq => (
            <button
              key={seq.id}
              onClick={() => setActiveSequence(seq.id)}
              className={clsx(
                "px-4 py-2 rounded-xl whitespace-nowrap transition-all border text-sm",
                seq.id === settings.activeSequenceId 
                  ? "bg-red-900/40 border-red-500 text-white" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              )}
            >
              {seq.name}
            </button>
          ))}
          <button 
             onClick={() => setIsCreating(true)}
             className="px-4 py-2 rounded-xl border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white text-sm"
          >
            + New
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
           <h3 className="text-sm font-medium">Create New Preset</h3>
           <input 
             className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
             placeholder="Name (e.g. Heavy Study)"
             value={newName} onChange={e => setNewName(e.target.value)}
           />
           <div>
             <input 
               className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
               placeholder="Times: 25 5 25 10 (Auto Focus/Break)"
               value={quickString} onChange={e => setQuickString(e.target.value)}
             />
             <p className="text-[10px] text-gray-500 mt-1">Tip: We alternate Focus/Break automatically.</p>
           </div>
           <div className="flex gap-2">
             <button onClick={handleCreate} className="flex-1 bg-white text-black py-2 rounded-lg text-sm font-bold">Save</button>
             <button onClick={() => setIsCreating(false)} className="px-4 text-gray-400 text-sm">Cancel</button>
           </div>
        </div>
      )}

      {!isCreating && activeSeq && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <h3 className="text-xs text-gray-400 uppercase tracking-widest">Edit Steps</h3>
             {settings.sequences.length > 1 && (
               <button onClick={() => deleteSequence(activeSeq.id)} className="text-red-400 text-xs hover:underline">Delete Preset</button>
             )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {activeSeq.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg group">
                <span className="text-gray-600 text-xs w-4">{idx + 1}</span>
                
                <select 
                  value={step.type}
                  onChange={(e) => updateStep(idx, 'type', e.target.value)}
                  className={clsx(
                    "bg-transparent text-sm font-medium focus:outline-none w-20 uppercase",
                    step.type === 'focus' ? "text-red-400" : "text-emerald-400"
                  )}
                >
                  <option value="focus">Focus</option>
                  <option value="break">Break</option>
                </select>

                <input 
                   type="number"
                   value={step.duration}
                   onChange={(e) => updateStep(idx, 'duration', Number(e.target.value))}
                   className="w-12 bg-black/20 rounded px-1 text-center text-white text-sm"
                />
                <span className="text-xs text-gray-500">min</span>

                <div className="flex-1" />
                <button onClick={() => handleDeleteStep(idx)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleAddStep} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:text-white hover:border-white/30 transition-all">
             + Add Step
          </button>
        </div>
      )}
    </div>
  );
};

export default SequenceEditor;