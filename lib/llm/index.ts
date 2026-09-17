import { OpenRouterProvider } from './openrouter';
import { GroqProvider } from './groq';
import { DemoProvider } from './demo';
import type { LlmProvider } from './types';

export * from './types';
export type LlmProviderId = LlmProvider['id'];

// Reads LLM_PROVIDER (case-insensitive). Defaults to 'openrouter'; an
// unrecognized value also falls back to 'openrouter'. 'groq' selects the
// fallback provider directly. 'demo' serves canned responses (no key
// needed), useful to try the AI screens.
export function resolveProviderId(): LlmProviderId {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (raw === 'groq') return 'groq';
  if (raw === 'demo') return 'demo';
  return 'openrouter';
}

export function getLlmProvider(): LlmProvider {
  const id = resolveProviderId();
  if (id === 'groq') return new GroqProvider();
  if (id === 'demo') return new DemoProvider();
  const primary = new OpenRouterProvider();
  // Automatic fallback: no OpenRouter key but a Groq key is present, so the
  // coach keeps working instead of 503ing on every call.
  if (!primary.isConfigured() && process.env.GROQ_API_KEY) return new GroqProvider();
  return primary;
}
