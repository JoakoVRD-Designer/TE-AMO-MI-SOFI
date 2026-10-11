'use strict';

// Original little music-box melody. Audio starts only after a deliberate gesture.
class GardenSound {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.activated = false;
    this.context = null;
    this.timer = null;
    this.step = 0;
  }

  setup(context) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = this.enabled ? .24 : 0;
    this.master.connect(context.destination);
    this.music = context.createGain();
    this.music.gain.value = .42;
    this.effects = context.createGain();
    this.effects.gain.value = .8;
    this.music.connect(this.master);
    this.effects.connect(this.master);
    const reverb = context.createConvolver();
    const impulse = context.createBuffer(2, Math.floor(context.sampleRate * 1.3), context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * .24;
    }
    reverb.buffer = impulse;
    const wet = context.createGain();
    wet.gain.value = .22;
    this.music.connect(reverb);
    this.effects.connect(reverb);
    reverb.connect(wet);
    wet.connect(this.master);
  }

  async begin() {
    this.activated = true;
    if (!this.enabled || document.hidden) return;
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        this.setup(new Audio());
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.context.state !== 'running' || !this.enabled || document.hidden) return;
      this.master.gain.setTargetAtTime(.24, this.context.currentTime, .08);
      if (!this.timer) {
        this.nextNote = this.context.currentTime + .08;
        this.schedule();
        this.timer = setInterval(() => this.schedule(), 120);
      }
    } catch { /* A browser that blocks audio still gets the entire game. */ }
  }

  note(midi, when, duration = .9, level = .2, bus = this.music) {
    if (!this.context || !bus) return;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    for (const [harmonic, strength] of [[1, 1], [2, .16], [3, .035]]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * harmonic;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(level * strength, when + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(gain);
      gain.connect(bus);
      oscillator.start(when);
      oscillator.stop(when + duration + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
  }

  schedule() {
    if (!this.enabled || document.hidden || this.context?.state !== 'running') return;
    const melody = [76, 79, 83, 79, 81, 76, 74, 76, 74, 78, 81, 78, 79, 74, 71, 74, 72, 76, 79, 76, 81, 79, 76, 72, 74, 78, 79, 83, 81, 78, 74, 71];
    const chords = [[48, 55, 60], [50, 57, 62], [45, 52, 57], [43, 50, 55]];
    if (this.nextNote < this.context.currentTime) this.nextNote = this.context.currentTime + .03;
    while (this.nextNote < this.context.currentTime + .7) {
      const beat = this.step % melody.length;
      this.note(melody[beat], this.nextNote, 1.45, beat % 4 === 0 ? .21 : .14);
      if (beat % 4 === 0) for (const pitch of chords[Math.floor(beat / 8)]) this.note(pitch, this.nextNote, 2.6, .09);
      this.nextNote += .48;
      this.step++;
    }
  }

  effect(kind, count = 0) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime + .01;
    const phrases = { start: [72, 76, 79], flower: [76, 79, 83, 88], letter: [72, 76, 79, 84, 88], finish: [72, 76, 79, 83, 84, 88, 91], pickup: [[79, 81, 83][count % 3], 88] };
    (phrases[kind] || phrases.pickup).forEach((pitch, index) => this.note(pitch, now + index * .115, 1.1, .24, this.effects));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.master) this.master.gain.setTargetAtTime(enabled ? .24 : 0, this.context.currentTime, .04);
    if (!enabled) this.stopLoop();
    else if (this.activated) void this.begin();
  }

  stopLoop() { clearInterval(this.timer); this.timer = null; }

  async visibility() {
    if (document.hidden) {
      this.stopLoop();
      try { if (this.context?.state === 'running') await this.context.suspend(); } catch { /* optional sound */ }
      if (!document.hidden && this.activated && this.enabled) void this.begin();
    } else if (this.activated && this.enabled) void this.begin();
  }
}

window.GardenSound = GardenSound;
