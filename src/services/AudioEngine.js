/* src/services/AudioEngine.js */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {}; 
    this.masterGain = null;
    this.ambientNodes = { source: null, gain: null }; 
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadSound(key, url) {
    // If already loaded, skip
    if (this.buffers[key]) return; 
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      
      if (!this.ctx) this.init(); 
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[key] = audioBuffer;
      console.log(`Sound loaded: ${key}`);
    } catch (err) {
      console.error(`AudioEngine Error: Could not load '${key}' from ${url}`, err);
    }
  }

  playBell(key, volume = 1.0, maxDuration = 10) {
    if (!this.ctx) this.init();
    
    // SAFETY CHECK: Warn if sound missing
    if (!this.buffers[key]) {
      console.warn(`AudioEngine: Cannot play '${key}'. Buffer empty.`);
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];
    
    const bellGain = this.ctx.createGain();
    bellGain.gain.value = volume;

    source.connect(bellGain);
    bellGain.connect(this.masterGain);

    const now = this.ctx.currentTime;
    source.start(now);

    // Fade out logic
    if (source.buffer.duration > maxDuration) {
        const fadeStart = now + maxDuration - 2;
        const fadeEnd = now + maxDuration;
        bellGain.gain.setValueAtTime(volume, fadeStart);
        bellGain.gain.linearRampToValueAtTime(0.001, fadeEnd);
        source.stop(fadeEnd);
    }
  }

  playAmbient(key, volume = 0.6, fadeDuration = 3) {
    if (!this.ctx) this.init();
    if (!this.buffers[key]) {
       console.warn(`AudioEngine: Cannot play ambient '${key}'. Buffer empty.`);
       return;
    }

    const now = this.ctx.currentTime;
    const newSource = this.ctx.createBufferSource();
    newSource.buffer = this.buffers[key];
    newSource.loop = true;

    const newGain = this.ctx.createGain();
    newGain.gain.setValueAtTime(0, now); 

    newSource.connect(newGain);
    newGain.connect(this.masterGain);
    newSource.start(0);

    newGain.gain.linearRampToValueAtTime(volume, now + fadeDuration);
    this.stopAmbient(fadeDuration);
    this.ambientNodes = { source: newSource, gain: newGain };
  }

  stopAmbient(fadeDuration = 2) {
    if (this.ambientNodes.source) {
      const now = this.ctx ? this.ctx.currentTime : 0;
      // Safety check if ctx exists
      if(this.ctx) {
        this.ambientNodes.gain.gain.cancelScheduledValues(now);
        this.ambientNodes.gain.gain.setValueAtTime(this.ambientNodes.gain.gain.value, now);
        this.ambientNodes.gain.gain.linearRampToValueAtTime(0, now + fadeDuration);
        this.ambientNodes.source.stop(now + fadeDuration);
      } else {
        this.ambientNodes.source.stop();
      }
      this.ambientNodes = { source: null, gain: null };
    }
  }

  stopAll(fadeDuration = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
    setTimeout(() => {
      if (this.ambientNodes.source) this.ambientNodes.source.stop();
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime); 
    }, fadeDuration * 1000);
  }
}

export const audioEngine = new AudioEngine();