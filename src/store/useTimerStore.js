/* src/store/useTimerStore.js */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useTimerStore = create(
  persist(
    (set, get) => ({
      // Timer Configuration
      mode: 'meditation', // 'meditation' | 'pomodoro' | 'flow'
      duration: 600, // 10 minutes default
      
      // Real-time State
      status: 'idle', // 'idle' | 'running' | 'paused' | 'completed'
      remaining: 600,
      elapsed: 0,
      progress: 0, // 0 to 1 for Ring UI

      // Checkpoints (timestamps in seconds where bells ring)
      checkpoints: [], 
      
      // Actions
      setMode: (mode) => set({ mode }),
      setDuration: (duration) => set({ duration, remaining: duration, progress: 0 }),
      
      setStatus: (status) => set({ status }),
      
      // Called by the Worker Listener
      tick: ({ remaining, elapsed, progress }) => {
        const current = get();
        
        // Checkpoint Logic
        // Find if current elapsed time matches a checkpoint (simple integer match)
        // In production, you might want a "triggered" flag map to prevent double ringing
        if (current.checkpoints.includes(elapsed)) {
          // Dispatch custom event for the UI to catch and trigger AudioEngine
          window.dispatchEvent(new CustomEvent('checkpoint-reached'));
        }

        set({ remaining, elapsed, progress });
      },

      reset: () => {
        const { duration } = get();
        set({ 
          status: 'idle', 
          remaining: duration, 
          elapsed: 0, 
          progress: 0 
        });
      }
    }),
    {
      name: 'timer-storage', // local storage key
      storage: createJSONStorage(() => localStorage), // Persist settings
      partialize: (state) => ({ 
        mode: state.mode, 
        duration: state.duration,
        checkpoints: state.checkpoints 
      }), // Don't persist running state (remaining, etc)
    }
  )
);

export default useTimerStore;