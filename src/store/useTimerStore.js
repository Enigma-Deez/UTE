import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useTimerStore = create(
  persist(
    (set, get) => ({
      // --- CONFIGURATION ---
      mode: 'meditation', // 'meditation' | 'pomodoro' | 'flow'
      
      // Meditation Settings
      meditationDuration: 600, // 10 mins default
      intervals: [], // Array of numbers (seconds) to ring bells
      
      // Pomodoro Settings
      pomoConfig: {
        work: 25,      // minutes
        shortBreak: 5, // minutes
        longBreak: 15, // minutes
        autoStart: false,
      },
      pomoPhase: 'work', // 'work' | 'shortBreak' | 'longBreak'
      pomoCycleCount: 0,
      
      // --- RUNTIME STATE ---
      status: 'idle', 
      remaining: 600,
      elapsed: 0,
      progress: 0,
      
      // --- ACTIONS ---

      setMode: (mode) => {
        const state = get();
        let newDuration = 0;
        
        if (mode === 'meditation') newDuration = state.meditationDuration;
        if (mode === 'pomodoro') newDuration = state.pomoConfig.work * 60;
        if (mode === 'flow') newDuration = 0;

        set({ 
          mode, 
          status: 'idle', 
          remaining: newDuration, 
          elapsed: 0, 
          progress: 0,
          pomoPhase: 'work' // Reset pomo phase
        });
      },

      // Update Meditation Interval (Add/Remove checkpoint)
      toggleInterval: (timeInSeconds) => {
        const { intervals } = get();
        if (intervals.includes(timeInSeconds)) {
          set({ intervals: intervals.filter(t => t !== timeInSeconds) });
        } else {
          set({ intervals: [...intervals, timeInSeconds].sort((a,b) => a - b) });
        }
      },

      updatePomoSettings: (newConfig) => {
        set((state) => ({ 
          pomoConfig: { ...state.pomoConfig, ...newConfig } 
        }));
        // If currently in Pomodoro and idle, update the display immediately
        const state = get();
        if (state.mode === 'pomodoro' && state.status === 'idle') {
           set({ remaining: newConfig.work * 60 });
        }
      },

      setDuration: (duration) => set({ meditationDuration: duration, remaining: duration, progress: 0 }),
      
      setStatus: (status) => set({ status }),

      // --- THE CLOCK TICK (Called by Worker) ---
      tick: ({ remaining, elapsed, progress }) => {
        const state = get();
        set({ remaining, elapsed, progress });

        // 1. Meditation Interval Logic
        if (state.mode === 'meditation' && state.intervals.includes(elapsed)) {
          window.dispatchEvent(new CustomEvent('interval-bell'));
        }
      },

      // --- POMODORO CYCLE LOGIC ---
      nextPomoPhase: () => {
        const { pomoPhase, pomoCycleCount, pomoConfig } = get();
        
        let nextPhase = 'work';
        let nextDuration = pomoConfig.work * 60;
        let nextCount = pomoCycleCount;

        // Logic: Work -> Short Break -> Work -> ... -> (4th) Long Break
        if (pomoPhase === 'work') {
          nextCount += 1;
          if (nextCount % 4 === 0) {
            nextPhase = 'longBreak';
            nextDuration = pomoConfig.longBreak * 60;
          } else {
            nextPhase = 'shortBreak';
            nextDuration = pomoConfig.shortBreak * 60;
          }
        } else {
          // Coming back from any break
          nextPhase = 'work';
          nextDuration = pomoConfig.work * 60;
        }

        set({
          status: 'idle', // Always pause between phases (unless auto-start implemented later)
          pomoPhase: nextPhase,
          remaining: nextDuration,
          pomoCycleCount: nextCount,
          progress: 0
        });
      },

      reset: () => {
        const state = get();
        // Re-run setMode to reset time based on current mode
        state.setMode(state.mode);
      }
    }),
    {
      name: 'timer-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        meditationDuration: state.meditationDuration,
        intervals: state.intervals,
        pomoConfig: state.pomoConfig
      }),
    }
  )
);

export default useTimerStore;