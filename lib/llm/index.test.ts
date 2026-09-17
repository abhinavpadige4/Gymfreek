import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getLlmProvider, resolveProviderId } from './index';

// resolveProviderId() and getLlmProvider() select the AI provider from the
// LLM_PROVIDER env var. We save/restore the vars around every test so this
// suite never leaks state into the others.
describe('lib/llm provider resolution', () => {
  let originalProvider: string | undefined;
  let originalOpenRouterKey: string | undefined;
  let originalGroqKey: string | undefined;

  beforeEach(() => {
    originalProvider = process.env.LLM_PROVIDER;
    originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
    originalGroqKey = process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = originalProvider;
    if (originalOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalGroqKey;
  });

  describe('resolveProviderId', () => {
    it('defaults to openrouter when LLM_PROVIDER is unset', () => {
      delete process.env.LLM_PROVIDER;
      expect(resolveProviderId()).toBe('openrouter');
    });

    it('resolves the exact known values', () => {
      process.env.LLM_PROVIDER = 'openrouter';
      expect(resolveProviderId()).toBe('openrouter');
      process.env.LLM_PROVIDER = 'groq';
      expect(resolveProviderId()).toBe('groq');
      process.env.LLM_PROVIDER = 'demo';
      expect(resolveProviderId()).toBe('demo');
    });

    it('is case-insensitive', () => {
      process.env.LLM_PROVIDER = 'Demo';
      expect(resolveProviderId()).toBe('demo');
      process.env.LLM_PROVIDER = 'OPENROUTER';
      expect(resolveProviderId()).toBe('openrouter');
      process.env.LLM_PROVIDER = 'Groq';
      expect(resolveProviderId()).toBe('groq');
    });

    it('trims surrounding whitespace', () => {
      process.env.LLM_PROVIDER = '  demo  ';
      expect(resolveProviderId()).toBe('demo');
      process.env.LLM_PROVIDER = '\topenrouter\n';
      expect(resolveProviderId()).toBe('openrouter');
      process.env.LLM_PROVIDER = '  groq  ';
      expect(resolveProviderId()).toBe('groq');
    });

    it('falls back to openrouter for an unknown value', () => {
      process.env.LLM_PROVIDER = 'foo';
      expect(resolveProviderId()).toBe('openrouter');
    });

    it('falls back to openrouter for an empty string', () => {
      process.env.LLM_PROVIDER = '';
      expect(resolveProviderId()).toBe('openrouter');
    });
  });

  describe('getLlmProvider', () => {
    it('returns a provider whose id matches the resolved id', () => {
      process.env.LLM_PROVIDER = 'openrouter';
      expect(getLlmProvider().id).toBe('openrouter');
      process.env.LLM_PROVIDER = 'groq';
      expect(getLlmProvider().id).toBe('groq');
      process.env.LLM_PROVIDER = 'demo';
      expect(getLlmProvider().id).toBe('demo');
    });

    it('returns the openrouter provider by default', () => {
      delete process.env.LLM_PROVIDER;
      expect(getLlmProvider().id).toBe('openrouter');
    });

    it('falls back to groq when openrouter has no key but groq does', () => {
      delete process.env.LLM_PROVIDER;
      process.env.GROQ_API_KEY = 'gsk-test';
      expect(getLlmProvider().id).toBe('groq');
    });
  });
});
