import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceService } from './voice';

function stubSpeech() {
  const speak = vi.fn();
  const cancel = vi.fn();
  const state = { speaking: false };
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      get speaking() {
        return state.speaking;
      },
      set speaking(v: boolean) {
        state.speaking = v;
      },
      speak,
      cancel,
    },
    configurable: true,
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: class {
      text: string;
      rate = 1;
      constructor(text: string) {
        this.text = text;
      }
    },
    configurable: true,
  });
  return { speak, cancel, state };
}

describe('VoiceService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('speaks cues when enabled and supported', () => {
    const { speak } = stubSpeech();
    const voice = new VoiceService();
    expect(voice.supported()).toBe(true);
    voice.speak('Keep your chest upright.');
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('stays silent when disabled and cancels on mute', () => {
    const { speak, cancel } = stubSpeech();
    const voice = new VoiceService();
    voice.setEnabled(false);
    voice.speak('Go deeper.');
    expect(speak).not.toHaveBeenCalled();
    voice.setEnabled(true);
    voice.speak('Go deeper.');
    expect(speak).toHaveBeenCalledTimes(1);
    voice.setEnabled(false);
    expect(cancel).toHaveBeenCalled();
  });

  it('lets the latest cue interrupt only after a 2s breath', () => {
    const { speak, state } = stubSpeech();
    const voice = new VoiceService();
    state.speaking = true;
    voice.speak('First.');
    expect(speak).toHaveBeenCalledTimes(1);
    voice.speak('Second.');
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
