/* src/store/useTimerStore.js */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
        pomodoro: { work: 25, shortBreak: 5, longBreak: 15 },
        flow: { sound90Min: 'chime' }
      },

      // --- RUNTIME STATE ---
      status: 'idle', 
      remaining: 600,
      elapsed: 0,
      progress: 0,
      
      // Flow / Productivity Metrics
      distractions: 0,
      flowState: 'none', 
      lastSession: null, 

      // Pomodoro
      pomoPhase: 'work',
      pomoCycleCount: 0,

      // --- ACTIONS ---

      setMode: (mode) => {
        const { settings } = get();
        let newRemaining = 0;
        
        if (mode === 'meditation') newRemaining = settings.meditation.infinite ? 0 : settings.meditation.duration;
        if (mode === 'pomodoro') newRemaining = settings.pomodoro.work * 60;
        // Flow/Stopwatch start at 0
        
        set({ 
          mode, status: 'idle', remaining: newRemaining, elapsed: 0, progress: 0,
          distractions: 0, flowState: 'none', lastSession: null
        });
      },

      // *** THE MISSING FIX *** 
      // This handles the manual time input from the UI
      setDuration: (seconds) => {
        const { mode } = get();
        if (mode === 'meditation') {
          get().updateSettings('meditation', { duration: seconds });
        } else if (mode === 'pomodoro') {
          // Pomodoro settings usually store minutes, so we convert.
          // Decimals (e.g., 0.5 minutes for 30s) work fine mathematically.
          get().updateSettings('pomodoro', { work: seconds / 60 });
        }
        // Force a reset to apply the new time immediately
        get().reset();
      },

      addDistraction: () => set((state) => ({ distractions: state.distractions + 1 })),

      updateSettings: (mode, newValues) => {
        set((state) => ({
          settings: { ...state.settings, [mode]: { ...state.settings[mode], ...newValues } }
        }));
        // Refresh if idle
        if (get().status === 'idle') get().setMode(mode);
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

        // Flow Logic
        let newFlowState = state.flowState;
        if (mode === 'flow') {
          if (elapsed > 1200) newFlowState = 'flow_zone'; 
          if (elapsed > 5400) newFlowState = 'ultradian_limit'; 
          if (elapsed === 5400) window.dispatchEvent(new CustomEvent('ultradian-bell'));
        }

        // Meditation Interval Logic
        if (mode === 'meditation' && settings.meditation.intervals.includes(elapsed)) {
           window.dispatchEvent(new CustomEvent('interval-bell'));
        }

        set({ remaining, elapsed, progress, flowState: newFlowState });
      },

      finishSession: async (rating = 0) => {
        const state = get();
        const mins = Math.floor(state.elapsed / 60);
        let breakRec = 5;
        if (mins >= 25 && mins < 50) breakRec = 10;
        if (mins >= 50 && mins < 90) breakRec = 15;
        if (mins >= 90) breakRec = 25;

        const sessionData = {
          id: crypto.randomUUID(),
          type: state.mode,
          startTime: Date.now() - (state.elapsed * 1000),
          duration: state.elapsed,
          distractions: state.distractions,
          rating,
          breakRecommendation: breakRec,
          completed: true
        };

        set({ lastSession: sessionData, status: 'idle' });
      },

      reset: () => get().setMode(get().mode)
    }),
    {
      name: 'timer-storage-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings, mode: state.mode }),
    }
  )
);

export default useTimerStore;