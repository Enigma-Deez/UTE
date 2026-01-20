import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { set as idbSet } from 'idb-keyval'; 

const useTimerStore = create(
  persist(
    (set, get) => ({
      // --- MODES ---
      mode: 'meditation', 
      
      // --- CONFIGURATION ---
      settings: {
        meditation: { 
          duration: 600, 
          infinite: false,
          intervals: [], 
          soundEnd: 'bowl',
          soundInterval: 'chime'
        },
        pomodoro: { 
          // New Audio Settings
          soundFocusStart: 'bowl', 
          soundBreakStart: 'chime', 
        },
        sequences: [
          {
            id: 'default-pomo',
            name: 'Classic Pomodoro',
            steps: [
              { type: 'focus', duration: 25 },
              { type: 'break', duration: 5 },
              { type: 'focus', duration: 25 },
              { type: 'break', duration: 5 },
              { type: 'focus', duration: 25 },
              { type: 'break', duration: 15 }, 
            ]
          }
        ],
        activeSequenceId: 'default-pomo',
        flow: { sound90Min: 'chime' }
      },

      // --- RUNTIME STATE ---
      status: 'idle', 
      remaining: 600,
      elapsed: 0,
      progress: 0,
      
      // Sequence Runtime
      currentStepIndex: 0,
      
      // Flow / Metrics
      distractions: 0,
      flowState: 'none', 
      lastSession: null, 

      // --- ACTIONS ---

      setMode: (mode) => {
        const state = get();
        let newRemaining = 0;
        
        if (mode === 'meditation') newRemaining = state.settings.meditation.infinite ? 0 : state.settings.meditation.duration;
        
        if (mode === 'pomodoro') {
          const seq = state.settings.sequences.find(s => s.id === state.settings.activeSequenceId);
          if (seq && seq.steps.length > 0) {
            newRemaining = seq.steps[0].duration * 60;
          } else {
            newRemaining = 1500; 
          }
        }
        
        set({ 
          mode, status: 'idle', remaining: newRemaining, elapsed: 0, progress: 0,
          distractions: 0, flowState: 'none', lastSession: null,
          currentStepIndex: 0 
        });
      },

      setDuration: (seconds) => {
        const { mode } = get();
        if (mode === 'meditation') {
          get().updateSettings('meditation', { duration: seconds });
          get().reset();
        } 
      },

      addDistraction: () => set((state) => ({ distractions: state.distractions + 1 })),

      updateSettings: (category, newValues) => {
        set((state) => ({
          settings: { ...state.settings, [category]: { ...state.settings[category], ...newValues } }
        }));
        if (get().status === 'idle') get().reset();
      },

      // --- SEQUENCE ACTIONS ---
      addSequence: (name, steps) => {
        const newSeq = { id: crypto.randomUUID(), name, steps };
        set(state => ({
          settings: {
            ...state.settings,
            sequences: [...state.settings.sequences, newSeq],
            activeSequenceId: newSeq.id
          }
        }));
        get().setMode('pomodoro');
      },

      updateSequence: (id, updatedFields) => {
        set(state => ({
          settings: {
            ...state.settings,
            sequences: state.settings.sequences.map(s => s.id === id ? { ...s, ...updatedFields } : s)
          }
        }));
        if (get().settings.activeSequenceId === id && get().status === 'idle') {
          get().setMode('pomodoro');
        }
      },

      deleteSequence: (id) => {
        set(state => {
          const newSeqs = state.settings.sequences.filter(s => s.id !== id);
          const nextActive = newSeqs.length > 0 ? newSeqs[0].id : null;
          return {
            settings: { ...state.settings, sequences: newSeqs, activeSequenceId: nextActive }
          };
        });
        get().setMode('pomodoro');
      },

      setActiveSequence: (id) => {
        set(state => ({ settings: { ...state.settings, activeSequenceId: id } }));
        get().setMode('pomodoro');
      },

      nextSequenceStep: () => {
        const { settings, currentStepIndex } = get();
        const seq = settings.sequences.find(s => s.id === settings.activeSequenceId);
        
        if (!seq) return;

        const nextIndex = currentStepIndex + 1;

        if (nextIndex < seq.steps.length) {
          const nextStep = seq.steps[nextIndex];
          
          // Emit event for audio
          window.dispatchEvent(new CustomEvent('phase-change', { 
            detail: { type: nextStep.type } 
          }));

          set({
            status: 'running', 
            currentStepIndex: nextIndex,
            remaining: nextStep.duration * 60,
            elapsed: 0,
            progress: 0
          });
        } else {
          set({ status: 'completed' });
        }
      },

      toggleInterval: (timeInSeconds) => {
        const { settings } = get();
        const current = settings.meditation.intervals;
        const newIntervals = current.includes(timeInSeconds)
          ? current.filter(t => t !== timeInSeconds)
          : [...current, timeInSeconds].sort((a,b) => a - b);
        get().updateSettings('meditation', { intervals: newIntervals });
      },

      setStatus: (status) => set({ status }),

      tick: ({ remaining, elapsed, progress }) => {
        const state = get();
        const { mode, settings } = state;

        let newFlowState = state.flowState;
        if (mode === 'flow') {
          if (elapsed > 1200) newFlowState = 'flow_zone'; 
          if (elapsed > 5400) newFlowState = 'ultradian_limit'; 
          if (elapsed === 5400) window.dispatchEvent(new CustomEvent('ultradian-bell'));
        }

        if (mode === 'meditation' && settings.meditation.intervals.includes(elapsed)) {
           window.dispatchEvent(new CustomEvent('interval-bell'));
        }

        set({ remaining, elapsed, progress, flowState: newFlowState });
      },

      finishSession: async (rating = 0) => {
         const state = get();
         const mins = Math.floor(state.elapsed / 60);
         let breakRec = 5;
         if (mins >= 25) breakRec = 10;
         if (mins >= 50) breakRec = 15;
         if (mins >= 90) breakRec = 25;

         const sessionData = { 
             id: crypto.randomUUID(), 
             type: state.mode, 
             duration: state.elapsed, 
             breakRecommendation: breakRec,
             distractions: state.distractions,
             completed: true 
         };
         try { await idbSet(`session-${sessionData.id}`, sessionData); } catch(e) {}
         set({ lastSession: sessionData, status: 'idle' });
      },

      // *** THIS WAS LIKELY MISSING IN YOUR PREVIOUS COPY ***
      reset: () => get().setMode(get().mode)
    }),
    {
      name: 'timer-storage-final-v3', // New version to ensure fresh state
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings, mode: state.mode }),
    }
  )
);

export default useTimerStore;