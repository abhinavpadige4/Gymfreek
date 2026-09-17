import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { resolveProviderId, getLlmProvider } from './index';
import { LlmError } from './types';

const ENV_KEYS = [
  'LLM_PROVIDER',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'OPENROUTER_APP_NAME',
  'OPENROUTER_APP_URL',
  'OPENROUTER_MAX_TOKENS',
  'GROQ_API_KEY',
  'GROQ_MODEL',
] as const;

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.unstubAllGlobals();
});

describe('provider selection', () => {
  it('defaults to openrouter when LLM_PROVIDER is unset', () => {
    expect(resolveProviderId()).toBe('openrouter');
    expect(getLlmProvider().id).toBe('openrouter');
  });

  it('selects openrouter when LLM_PROVIDER=openrouter (case-insensitive)', () => {
    process.env.LLM_PROVIDER = 'OpenRouter';
    expect(resolveProviderId()).toBe('openrouter');
    expect(getLlmProvider().id).toBe('openrouter');
  });

  it('selects groq when LLM_PROVIDER=groq (case-insensitive)', () => {
    process.env.LLM_PROVIDER = 'Groq';
    expect(resolveProviderId()).toBe('groq');
    expect(getLlmProvider().id).toBe('groq');
  });

  it('falls back to openrouter for an unknown value', () => {
    process.env.LLM_PROVIDER = 'gpt-whatever';
    expect(resolveProviderId()).toBe('openrouter');
  });

  it('falls back to groq when openrouter has no key but groq does', () => {
    delete process.env.LLM_PROVIDER;
    process.env.GROQ_API_KEY = 'gsk-test';
    expect(getLlmProvider().id).toBe('groq');
  });
});

describe('GroqProvider', () => {
  function mockFetch(
    impl: () => Partial<Response> & { json?: () => unknown; text?: () => unknown },
  ) {
    const fn = vi.fn(async (_url: string, _init: RequestInit) => impl() as unknown as Response);
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('reports not configured without a key', () => {
    expect(new GroqProvider().isConfigured()).toBe(false);
  });

  it('throws 503 when the key is missing', async () => {
    const p = new GroqProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('uses the default model and overrides via GROQ_MODEL', () => {
    expect(new GroqProvider().model).toBe('openai/gpt-oss-120b');
    process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
    expect(new GroqProvider().model).toBe('llama-3.1-8b-instant');
  });

  it('sends the system message and parses the reply', async () => {
    process.env.GROQ_API_KEY = 'gsk-test';
    const fetchFn = mockFetch(() => ({
      ok: true,
      json: async () => ({
        model: 'openai/gpt-oss-120b',
        choices: [{ message: { role: 'assistant', content: '  hi there  ' } }],
      }),
    }));

    const p = new GroqProvider();
    const res = await p.complete({
      system: 'SYSTEM',
      messages: [{ role: 'user', content: 'payload' }],
      temperature: 0.4,
    });

    expect(res).toEqual({ text: 'hi there', modelUsed: 'openai/gpt-oss-120b' });

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer gsk-test');
    const body = JSON.parse(init.body as string);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'payload' });
    expect(body.temperature).toBe(0.4);
  });

  it('throws with the upstream status on a non-ok response', async () => {
    process.env.GROQ_API_KEY = 'gsk-test';
    mockFetch(() => ({ ok: false, status: 502, text: async () => 'upstream boom' }));
    const p = new GroqProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('throws 502 on an empty choice', async () => {
    process.env.GROQ_API_KEY = 'gsk-test';
    mockFetch(() => ({ ok: true, json: async () => ({ choices: [] }) }));
    const p = new GroqProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toBeInstanceOf(LlmError);
  });
});

describe('OpenRouterProvider', () => {
  function mockFetch(
    impl: () => Partial<Response> & { json?: () => unknown; text?: () => unknown },
  ) {
    const fn = vi.fn(async (_url: string, _init: RequestInit) => impl() as unknown as Response);
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('throws 503 when the key is missing', async () => {
    const p = new OpenRouterProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('sends the system message, forwards temperature, and parses the reply', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    const fetchFn = mockFetch(() => ({
      ok: true,
      json: async () => ({
        model: 'anthropic/claude-sonnet-4.5',
        choices: [{ message: { role: 'assistant', content: '  hi there  ' } }],
      }),
    }));

    const p = new OpenRouterProvider();
    const res = await p.complete({
      system: 'SYSTEM',
      messages: [{ role: 'user', content: 'payload' }],
      temperature: 0.4,
      maxTokens: 999,
    });

    expect(res).toEqual({ text: 'hi there', modelUsed: 'anthropic/claude-sonnet-4.5' });

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer or-key');
    const body = JSON.parse(init.body as string);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'payload' });
    expect(body.temperature).toBe(0.4);
    expect(body.max_tokens).toBe(999);
  });

  it('throws with the upstream status on a non-ok response', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    mockFetch(() => ({ ok: false, status: 502, text: async () => 'upstream boom' }));
    const p = new OpenRouterProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('throws 502 when the body carries an error field', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    mockFetch(() => ({ ok: true, json: async () => ({ error: { message: 'bad model' } }) }));
    const p = new OpenRouterProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('throws 502 on an empty choice', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    mockFetch(() => ({ ok: true, json: async () => ({ choices: [] }) }));
    const p = new OpenRouterProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toBeInstanceOf(LlmError);
  });

  it('OPENROUTER_MAX_TOKENS raises the per-call budget but never lowers it', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    process.env.OPENROUTER_MAX_TOKENS = '100000';
    const fetchFn = mockFetch(() => ({
      ok: true,
      json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
    }));
    const p = new OpenRouterProvider();
    await p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }], maxTokens: 200 });
    await p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] });
    await p.complete({
      system: 'S',
      messages: [{ role: 'user', content: 'x' }],
      maxTokens: 250000,
    });
    const budgets = fetchFn.mock.calls.map(
      ([, init]) => JSON.parse(init.body as string).max_tokens,
    );
    expect(budgets).toEqual([100000, 100000, 250000]);

    process.env.OPENROUTER_MAX_TOKENS = 'nope';
    await p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }], maxTokens: 200 });
    expect(JSON.parse(fetchFn.mock.calls[3]![1].body as string).max_tokens).toBe(200);
  });

  it('throws 502 with a clear message when the reply was cut off by max_tokens', async () => {
    process.env.OPENROUTER_API_KEY = 'or-key';
    mockFetch(() => ({
      ok: true,
      json: async () => ({
        choices: [
          { message: { role: 'assistant', content: '{"name": "trunc' }, finish_reason: 'length' },
        ],
      }),
    }));
    const p = new OpenRouterProvider();
    await expect(
      p.complete({ system: 'S', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toMatchObject({ status: 502, message: expect.stringContaining('cut off') });
  });
});
