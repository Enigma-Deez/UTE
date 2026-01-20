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
        // POMODORO SETTINGS (Defaults)
        pomodoro: { work: 25, shortBreak: 5, longBreak: 15, autoStart: false },
        // FLOW SETTINGS
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
      lastSession: null, // Holds data for the Summary Modal

      // Pomodoro Internal State
      pomoPhase: 'work',
      pomoCycleCount: 0,

      // --- ACTIONS ---

      setMode: (mode) => {
        const { settings } = get();
        let newRemaining = 0;
        
        if (mode === 'meditation') newRemaining = settings.meditation.infinite ? 0 : settings.meditation.duration;
        if (mode === 'pomodoro') newRemaining = settings.pomodoro.work * 60;
        
        set({ 
          mode, status: 'idle', remaining: newRemaining, elapsed: 0, progress: 0,
          distractions: 0, flowState: 'none', lastSession: null
        });
      },

      setDuration: (seconds) => {
        const { mode } = get();
        if (mode === 'meditation') {
          get().updateSettings('meditation', { duration: seconds });
        } else if (mode === 'pomodoro') {
          get().updateSettings('pomodoro', { work: seconds / 60 });
        }
        get().reset();
      },

      addDistraction: () => set((state) => ({ distractions: state.distractions + 1 })),

      updateSettings: (mode, newValues) => {
        set((state) => ({
          settings: { ...state.settings, [mode]: { ...state.settings[mode], ...newValues } }
        }));
        // If updating current mode while idle, refresh to apply changes
        if (get().status === 'idle' && get().mode === mode) {
           get().reset();
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

        // FLOW MODE LOGIC
        let newFlowState = state.flowState;
        if (mode === 'flow') {
          // Zone Indicator (>20 mins)
          if (elapsed > 1200) newFlowState = 'flow_zone'; 
          // Ultradian Rhythm (>90 mins)
          if (elapsed > 5400) newFlowState = 'ultradian_limit'; 
          // 90 Minute Alert Trigger
          if (elapsed === 5400) window.dispatchEvent(new CustomEvent('ultradian-bell'));
        }

        // MEDITATION INTERVALS
        if (mode === 'meditation' && settings.meditation.intervals.includes(elapsed)) {
           window.dispatchEvent(new CustomEvent('interval-bell'));
        }

        set({ remaining, elapsed, progress, flowState: newFlowState });
      },

      // --- CRITICAL: FLOW BREAK CALCULATION ---
      finishSession: async (rating = 0) => {
        const state = get();
        const mins = Math.floor(state.elapsed / 60);
        
        // Flowtime Formula
        let breakRec = 5;
        if (mins < 25) breakRec = 5;
        else if (mins >= 25 && mins < 50) breakRec = 10; // Range 8-10
        else if (mins >= 50 && mins < 90) breakRec = 15;
        else if (mins >= 90) breakRec = 25; // Range 20-30

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

        // Save to DB (Future proofing)
        try { await idbSet(`session-${sessionData.id}`, sessionData); } catch(e) { console.error(e); }

        // Set lastSession to trigger the Modal, set Status to idle
        set({ lastSession: sessionData, status: 'idle' });
      },

      nextPomoPhase: () => {
        const { pomoPhase, pomoCycleCount, settings } = get();
        const conf = settings.pomodoro;
        
        let nextPhase = 'work';
        let nextDuration = conf.work * 60;
        let nextCount = pomoCycleCount;

        if (pomoPhase === 'work') {
          nextCount += 1;
          if (nextCount % 4 === 0) {
            nextPhase = 'longBreak';
            nextDuration = conf.longBreak * 60;
          } else {
            nextPhase = 'shortBreak';
            nextDuration = conf.shortBreak * 60;
          }
        } else {
          nextPhase = 'work';
          nextDuration = conf.work * 60;
        }

        set({
          status: 'idle',
          pomoPhase: nextPhase,
          remaining: nextDuration,
          pomoCycleCount: nextCount,
          progress: 0
        });
      },

      reset: () => get().setMode(get().mode)
    }),
    {
      name: 'timer-storage-final',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings, mode: state.mode }),
    }
  )
);

export default useTimerStore;