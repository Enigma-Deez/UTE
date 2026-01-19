/* src/services/AudioEngine.js */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {}; // Cache decoded audio: { 'bell': AudioBuffer }
    
    // Nodes
    this.masterGain = null;
    this.ambientNodes = { source: null, gain: null }; // Current ambient
    this.nextAmbientNodes = { source: null, gain: null }; // For crossfading
  }

  // Initialize context on first user interaction (browser requirement)
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
    if (this.buffers[key]) return; // Already loaded

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      // Use init() if context doesn't exist yet for decoding
      if (!this.ctx) this.init(); 
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[key] = audioBuffer;
    } catch (err) {
      console.error(`Failed to load sound: ${key}`, err);
    }
  }

  /* --- ALERT CHANNEL (Polyphonic) --- */
  playBell(key, volume = 1.0) {
    if (!this.ctx || !this.buffers[key]) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];
    
    const bellGain = this.ctx.createGain();
    bellGain.gain.value = volume;

    source.connect(bellGain);
    bellGain.connect(this.masterGain);

    source.start(0);
    // Garbage collection handles the nodes after playback ends
  }

  /* --- AMBIENT CHANNEL (Cross-fading) --- */
  playAmbient(key, volume = 0.8, fadeDuration = 3) {
    if (!this.ctx || !this.buffers[key]) return;

    const now = this.ctx.currentTime;

    // 1. Create new Ambient Source
    const newSource = this.ctx.createBufferSource();
    newSource.buffer = this.buffers[key];
    newSource.loop = true;

    const newGain = this.ctx.createGain();
    newGain.gain.setValueAtTime(0, now); // Start silent

    newSource.connect(newGain);
    newGain.connect(this.masterGain);
    newSource.start(0);

    // 2. Cross-fade Logic
    // Fade IN new track
    newGain.gain.linearRampToValueAtTime(volume, now + fadeDuration);

    // Fade OUT old track (if exists)
    if (this.ambientNodes.source) {
      this.ambientNodes.gain.gain.linearRampToValueAtTime(0, now + fadeDuration);
      this.ambientNodes.source.stop(now + fadeDuration);
    }

    // 3. Swap references
    this.ambientNodes = { source: newSource, gain: newGain };
  }

  stopAll(fadeDuration = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Ramp master down
    this.masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);

    setTimeout(() => {
      if (this.ambientNodes.source) this.ambientNodes.source.stop();
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime); // Reset for next time
    }, fadeDuration * 1000);
  }
}

// Export singleton
export const audioEngine = new AudioEngine();