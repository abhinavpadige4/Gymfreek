'use client';

// VoiceService: every TTS call goes through here so a cloud provider can be
// swapped in later without touching callers. Browser SpeechSynthesis today.

export class VoiceService {
  private lastStart = 0;
  private enabled = true;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.cancel();
  }

  supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string): void {
    if (!this.enabled || !this.supported()) return;
    const now = Date.now();
    // Latest cue wins: interrupt only if the previous one had 2s to breathe.
    if (window.speechSynthesis.speaking && now - this.lastStart < 2000) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    this.lastStart = now;
    window.speechSynthesis.speak(utter);
  }

  cancel(): void {
    if (this.supported()) window.speechSynthesis.cancel();
  }
}

export const voiceService = new VoiceService();
