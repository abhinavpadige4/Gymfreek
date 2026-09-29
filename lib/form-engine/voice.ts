'use client';

// VoiceService: every TTS call goes through here so a cloud provider can be
// swapped in later without touching callers. Browser SpeechSynthesis today.

export type VoiceStatus = 'ready' | 'muted' | 'unsupported' | 'no-voice';

export class VoiceService {
  private lastStart = 0;
  private enabled = true;
  private voicesEmpty = false;

  constructor() {
    if (this.supported()) {
      try {
        const synth = window.speechSynthesis;
        const check = () => {
          try {
            this.voicesEmpty = synth.getVoices().length === 0;
          } catch {
            // TTS present but unreadable: assume usable, never block cues.
            this.voicesEmpty = false;
          }
        };
        check();
        synth.addEventListener('voiceschanged', check);
      } catch {
        // Event plumbing is best-effort; speaking still attempted.
      }
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.cancel();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  status(): VoiceStatus {
    if (!this.supported()) return 'unsupported';
    if (!this.enabled) return 'muted';
    if (this.voicesEmpty) return 'no-voice';
    return 'ready';
  }

  // Call inside a tap handler: mobile browsers gate speech behind a user
  // gesture, so one silent utterance on Start unlocks every later cue.
  unlock(): void {
    if (!this.enabled || !this.supported()) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance('.');
      utter.volume = 0;
      utter.rate = 2;
      synth.speak(utter);
    } catch {
      // Locked or missing TTS surfaces via status(), never throws.
    }
  }

  speak(text: string): void {
    if (!this.enabled || !this.supported()) return;
    const now = Date.now();
    // Latest cue wins: interrupt only if the previous one had 2s to breathe.
    if (window.speechSynthesis.speaking && now - this.lastStart < 2000) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    try {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (en) utter.voice = en;
      else utter.lang = 'en-US';
    } catch {
      // Voice picking is cosmetic; the default voice still speaks.
    }
    this.lastStart = now;
    window.speechSynthesis.speak(utter);
  }

  cancel(): void {
    if (this.supported()) window.speechSynthesis.cancel();
  }
}

export const voiceService = new VoiceService();
