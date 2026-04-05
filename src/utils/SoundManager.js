class SoundManager {
  constructor() {
    this._sounds = {};
    this._music = {};
    this._currentMusic = null;
    this._musicBlocked = false;
    this._activeClones = [];
    this._pausedBySystem = new Set();
    this._sfxVolume   = 0.1;
    this._musicVolume = 0.1;
  }

  setSfxVolume(level) {
    this._sfxVolume = level;
    for (const sound of Object.values(this._sounds)) sound.volume = level;
  }

  setMusicVolume(level) {
    this._musicVolume = level;
    for (const track of Object.values(this._music)) track.volume = level;
  }

  load(sfxData) {
    for (const [key, src] of Object.entries(sfxData)) {
      if (src) {
        this._sounds[key] = new Audio(src);
        this._sounds[key].volume = this._sfxVolume;
      }
    }
  }

  loadMusic(musicData) {
    for (const [key, src] of Object.entries(musicData)) {
      this._music[key] = new Audio(src);
      this._music[key].volume = this._musicVolume;
    }
  }

  playMusic(key, { loop = false, onEnded = null } = {}) {
    this.stopMusic();
    const track = this._music[key];
    if (!track) { this._musicBlocked = true; return; }
    track.currentTime = 0;
    track.loop = loop;
    track.onended = onEnded;
    this._currentMusic = track;
    this._musicBlocked = false;
    track.play().catch(() => { this._musicBlocked = true; });
  }

  retryMusic() {
    if (!this._currentMusic || !this._musicBlocked) return;
    this._musicBlocked = false;
    this._currentMusic.play().catch(() => { this._musicBlocked = true; });
  }

  isMusicDone() {
    if (!this._currentMusic) return true;
    if (this._currentMusic.ended) return true;
    if (this._musicBlocked) return true;
    return false;
  }

  stopMusic() {
    if (this._currentMusic) {
      this._currentMusic.pause();
      this._currentMusic.currentTime = 0;
      this._currentMusic.onended = null;
      this._currentMusic = null;
    }
    this._musicBlocked = false;
  }

  play(key, interrupt = false) {
    const sound = this._sounds[key];
    if (!sound) return;
    if (interrupt) {
      sound.pause();
      sound.currentTime = 0;
      sound.play().catch(() => {});
      return;
    }
    // If the sound is already playing, clone it so both can play simultaneously
    if (sound.paused) {
      sound.play().catch(() => {});
    } else {
      const clone = sound.cloneNode();
      clone.volume = sound.volume;
      this._activeClones.push(clone);
      clone.addEventListener('ended', () => {
        const i = this._activeClones.indexOf(clone);
        if (i !== -1) this._activeClones.splice(i, 1);
      });
      clone.play().catch(() => {});
    }
  }

  pauseAll() {
    this._pausedBySystem.clear();
    for (const sound of Object.values(this._sounds)) {
      if (!sound.paused) { sound.pause(); this._pausedBySystem.add(sound); }
    }
    for (const clone of this._activeClones) {
      if (!clone.paused) { clone.pause(); this._pausedBySystem.add(clone); }
    }
    if (this._currentMusic && !this._currentMusic.paused) {
      this._currentMusic.pause();
      this._pausedBySystem.add(this._currentMusic);
    }
  }

  resumeAll() {
    for (const sound of this._pausedBySystem) {
      sound.play().catch(() => {});
    }
    this._pausedBySystem.clear();
  }

  stop(key) {
    const sound = this._sounds[key];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
  }

}

export const soundManager = new SoundManager();
