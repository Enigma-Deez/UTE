/* src/workers/timer.worker.js */

let timerId = null;
let startTime = null;
let expectedEndTime = null;
let duration = 0;
let isPaused = false;
let modeType = 'COUNT_DOWN'; // 'COUNT_DOWN' or 'COUNT_UP'

// Snapshot for pausing
let elapsedAtPause = 0;
let remainingAtPause = 0;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      duration = payload.durationSeconds || 0;
      modeType = payload.countUp ? 'COUNT_UP' : 'COUNT_DOWN';
      
      const now = Date.now();

      if (isPaused) {
        // RESUME
        if (modeType === 'COUNT_DOWN') {
          // Re-calculate end time based on what was remaining
          expectedEndTime = now + (remainingAtPause * 1000);
          startTime = now - ((duration - remainingAtPause) * 1000); // Back-calculate start
        } else {
          // Resume Count Up: Start time is 'now' minus what we already elapsed
          startTime = now - (elapsedAtPause * 1000);
        }
        isPaused = false;
      } else {
        // FRESH START
        startTime = now;
        if (modeType === 'COUNT_DOWN') {
          expectedEndTime = now + (duration * 1000);
        }
      }
      
      startTick();
      break;

    case 'PAUSE':
      if (timerId) {
        clearInterval(timerId);
        const now = Date.now();
        if (modeType === 'COUNT_DOWN') {
            const timeLeft = expectedEndTime - now;
            remainingAtPause = Math.max(0, timeLeft / 1000);
        } else {
            elapsedAtPause = (now - startTime) / 1000;
        }
        isPaused = true;
      }
      break;

    case 'STOP':
      clearInterval(timerId);
      timerId = null;
      isPaused = false;
      elapsedAtPause = 0;
      remainingAtPause = 0;
      break;
  }
};

function startTick() {
  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    const now = Date.now();
    let remaining = 0;
    let elapsed = 0;
    let progress = 0;

    if (modeType === 'COUNT_DOWN') {
      const timeLeft = expectedEndTime - now;
      remaining = Math.ceil(timeLeft / 1000);
      elapsed = Math.floor((duration * 1000 - timeLeft) / 1000);
      progress = 1 - (timeLeft / (duration * 1000));

      if (timeLeft <= 0) {
        self.postMessage({ type: 'TICK', payload: { remaining: 0, elapsed: duration, progress: 1 } });
        self.postMessage({ type: 'COMPLETED' });
        clearInterval(timerId);
        return;
      }
    } else {
      // COUNT UP (Flow / Stopwatch / Infinite Meditation)
      elapsed = Math.floor((now - startTime) / 1000);
      remaining = 0; // Irrelevant
      // For visual ring in count-up, we can just loop it every 60s or keep it full
      progress = (elapsed % 60) / 60; 
    }

    self.postMessage({ 
      type: 'TICK', 
      payload: { remaining, elapsed, progress } 
    });
  }, 100);
}