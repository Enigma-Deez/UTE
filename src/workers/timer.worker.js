/* src/workers/timer.worker.js */

let timerId = null;
let startTime = null;
let expectedEndTime = null;
let duration = 0;
let isPaused = false;
let pausedAt = 0;
let remainingOnPause = 0;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      // Payload: { durationSeconds, initialRemaining (optional for resume) }
      duration = payload.durationSeconds;
      
      if (isPaused) {
        // Resuming: Calculate new end time based on what was left
        const now = Date.now();
        expectedEndTime = now + (remainingOnPause * 1000);
        startTime = now - ((duration - remainingOnPause) * 1000);
        isPaused = false;
      } else {
        // Fresh Start
        const now = Date.now();
        startTime = now;
        expectedEndTime = now + (duration * 1000);
      }
      
      startTick();
      break;

    case 'PAUSE':
      if (timerId) {
        clearInterval(timerId);
        const now = Date.now();
        // Calculate exact remaining time to save for resume
        const timeLeft = expectedEndTime - now;
        remainingOnPause = Math.max(0, timeLeft / 1000);
        isPaused = true;
      }
      break;

    case 'STOP':
      clearInterval(timerId);
      timerId = null;
      isPaused = false;
      self.postMessage({ type: 'COMPLETED' });
      break;
  }
};

function startTick() {
  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    const now = Date.now();
    const timeLeft = expectedEndTime - now;
    
    // Calculate elapsed for "Flow" mode (Count up)
    const elapsed = (now - startTime) / 1000;

    if (timeLeft <= 0) {
      // Timer Finished
      self.postMessage({ type: 'TICK', payload: { remaining: 0, elapsed } });
      self.postMessage({ type: 'COMPLETED' });
      clearInterval(timerId);
    } else {
      // Standard Tick
      self.postMessage({ 
        type: 'TICK', 
        payload: { 
          remaining: Math.ceil(timeLeft / 1000),
          elapsed: Math.floor(elapsed),
          progress: 1 - (timeLeft / (duration * 1000)) 
        } 
      });
    }
  }, 100); // 100ms polling for UI smoothness (UI can throttle renders if needed)
}