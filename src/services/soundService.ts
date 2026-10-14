/**
 * Cross-platform Web Audio & HTML5 Audio Service
 * Manages reliable autoplay for 3D model sound, overcomes mobile browser autoplay policies,
 * and handles Google Drive & direct audio streaming.
 */

import { normalizeAudioUrl } from './urlHelpers';

type SoundStateListener = (state: {
  isPlaying: boolean;
  isMuted: boolean;
  isBlockedByAutoplay: boolean;
  activeUrl: string | null;
  volume: number;
}) => void;

class SoundService {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private isMuted = false;
  private isPlaying = false;
  private isBlockedByAutoplay = false;
  private activeUrl: string | null = null;
  private volume = 0.85;
  private listeners: Set<SoundStateListener> = new Set();

  constructor() {
    // Lazily initialized in browser environment
  }

  /**
   * Initializes or gets the shared AudioContext
   */
  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    return this.audioContext;
  }

  /**
   * Unlocks audio permissions on any initial user gesture (click, tap, touch).
   * Safe to call multiple times.
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined') return;

    // 1. Resume AudioContext
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 2. Play 1ms silent oscillator buffer to satisfy iOS & Android gesture restrictions
    if (ctx && ctx.state === 'running' && !this.isUnlocked) {
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      } catch (_) {}
    }

    // 3. Prime HTMLAudioElement if one exists
    if (!this.audioElement) {
      this.getAudioElement();
    }

    // If audio was blocked by autoplay and we have an active URL, try playing now!
    if (this.isBlockedByAutoplay && this.audioElement && this.activeUrl && !this.isMuted) {
      this.audioElement.play().then(() => {
        this.isPlaying = true;
        this.isBlockedByAutoplay = false;
        this.notify();
      }).catch(() => {});
    }
  }

  /**
   * Returns the shared HTMLAudioElement
   */
  public getAudioElement(): HTMLAudioElement {
    if (!this.audioElement && typeof window !== 'undefined') {
      const a = new Audio();
      a.loop = true;
      a.volume = this.volume;
      // Silent 1ms wav data to prime
      a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      a.addEventListener('play', () => {
        this.isPlaying = true;
        this.isBlockedByAutoplay = false;
        this.notify();
      });
      a.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });
      a.addEventListener('ended', () => {
        this.isPlaying = false;
        this.notify();
      });
      a.addEventListener('error', (e) => {
        console.warn('Audio element error:', e);
        this.isPlaying = false;
        this.notify();
      });
      this.audioElement = a;
    }
    return this.audioElement!;
  }

  /**
   * Plays the specified sound URL for a 3D model
   */
  public playModelSound(rawUrl: string, loop: boolean = true): void {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const url = normalizeAudioUrl(rawUrl);
    if (!url) return;

    const audio = this.getAudioElement();
    audio.loop = loop;
    audio.volume = this.volume;

    // If same sound is already playing and not muted, keep playing
    if (this.activeUrl === url && this.isPlaying && !this.isMuted) {
      return;
    }

    this.activeUrl = url;

    // If currently muted, don't play sound
    if (this.isMuted) {
      audio.pause();
      this.isPlaying = false;
      this.notify();
      return;
    }

    // Change source and load
    if (audio.src !== url) {
      audio.pause();
      audio.src = url;
      audio.load();
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.isBlockedByAutoplay = false;
          this.notify();
        })
        .catch((err) => {
          console.warn('Autoplay prevented audio, interaction required:', err);
          this.isPlaying = false;
          this.isBlockedByAutoplay = true;
          this.notify();
        });
    }
  }

  /**
   * Pauses the 3D model sound
   */
  public pauseModelSound(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this.isBlockedByAutoplay = false;
    this.notify();
  }

  /**
   * Stops and clears the 3D model sound
   */
  public stopModelSound(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    this.activeUrl = null;
    this.isPlaying = false;
    this.isBlockedByAutoplay = false;
    this.notify();
  }

  /**
   * Sets the volume (0.0 to 1.0) smoothly
   */
  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.volume = clamped;
    if (this.audioElement) {
      this.audioElement.volume = clamped;
      if (clamped === 0) {
        this.isMuted = true;
        this.audioElement.muted = true;
      } else if (this.isMuted) {
        this.isMuted = false;
        this.audioElement.muted = false;
        if (this.activeUrl && !this.isPlaying) {
          this.audioElement.play().catch(() => {});
        }
      }
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Toggles mute state
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      if (this.isMuted) {
        this.audioElement.pause();
        this.isPlaying = false;
      } else {
        if (this.volume === 0) {
          this.volume = 0.85;
        }
        this.audioElement.volume = this.volume;
        if (this.activeUrl) {
          this.audioElement.play().then(() => {
            this.isPlaying = true;
            this.isBlockedByAutoplay = false;
            this.notify();
          }).catch(() => {
            this.isBlockedByAutoplay = true;
            this.notify();
          });
        }
      }
    }
    this.notify();
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioElement) {
      this.audioElement.muted = muted;
      if (muted) {
        this.audioElement.pause();
        this.isPlaying = false;
      }
    }
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsBlockedByAutoplay(): boolean {
    return this.isBlockedByAutoplay;
  }

  public subscribe(listener: SoundStateListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener({
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      isBlockedByAutoplay: this.isBlockedByAutoplay,
      activeUrl: this.activeUrl,
      volume: this.volume
    });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      isBlockedByAutoplay: this.isBlockedByAutoplay,
      activeUrl: this.activeUrl,
      volume: this.volume
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (_) {}
    });
  }
}

export const soundService = new SoundService();
