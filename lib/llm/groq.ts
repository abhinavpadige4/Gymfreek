import {
  LlmError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from './types';

// Groq fallback provider (LLM_PROVIDER=groq), via its OpenAI-compatible chat
// completions API. Same request shape as OpenRouter so the two stay
// interchangeable; server-side only, key never reaches the browser.
// Free-tier default, verified live 2026-09-17: returns valid coach JSON.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_MAX_TOKENS = 8000;

interface GroqResponse {
  model?: string;
  choices?: Array<{ message?: { role: string; content: string } }>;
  error?: { message: string };
}

export class GroqProvider implements LlmProvider {
  readonly id = 'groq' as const;
  readonly label = 'Groq';
  readonly apiKeyEnvVar = 'GROQ_API_KEY';
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResult> {
    if (!this.apiKey) {
      throw new LlmError(503, 'GROQ_API_KEY is not configured.');
    }

    let res: Response;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: req.system },
            ...req.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          ...(req.temperature != null ? { temperature: req.temperature } : {}),
          max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
      });
    } catch (err) {
      throw new LlmError(
        502,
        `Network failure to Groq: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    if (!res.ok) {
      const text = await res.text();
      throw new LlmError(res.status, `Groq ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as GroqResponse;
    if (json.error) {
      throw new LlmError(502, `Groq: ${json.error.message}`);
    }
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new LlmError(502, 'Empty response from the coach.');
    }
    return { text, modelUsed: json.model ?? this.model };
  }

  async *stream(req: LlmCompletionRequest): AsyncIterable<string> {
    // ponytail: single non-streaming call, yield whole text. Add SSE when
    // streaming fallback latency matters.
    yield (await this.complete(req)).text;
  }
}
