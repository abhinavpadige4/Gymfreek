import { describe, expect, it } from 'vitest';
import { generateMcpToken, hashMcpToken, readMcpToken, visibleMcpTokenPrefix } from './auth';

describe('MCP token helpers', () => {
  it('generates opaque Gymfreek-prefixed tokens', () => {
    const first = generateMcpToken();
    const second = generateMcpToken();
    expect(first).toMatch(/^gfk_[A-Za-z0-9_-]{40,}$/);
    expect(second).not.toBe(first);
    expect(visibleMcpTokenPrefix(first)).toMatch(/^gfk_.+\.\.\.$/);
  });

  it('hashes tokens deterministically without retaining the token', () => {
    const token = 'gfk_test-token';
    expect(hashMcpToken(token)).toHaveLength(64);
    expect(hashMcpToken(token)).toBe(hashMcpToken(token));
    expect(hashMcpToken(token)).not.toContain(token);
  });

  it('accepts bearer, custom header and query token authentication', () => {
    expect(
      readMcpToken(
        new Request('https://gymfreek.example/mcp', {
          headers: { Authorization: 'Bearer gfk_bearer' },
        }),
      ),
    ).toBe('gfk_bearer');
    expect(
      readMcpToken(
        new Request('https://gymfreek.example/mcp', {
          headers: { 'X-Gymfreek-Token': 'gfk_header' },
        }),
      ),
    ).toBe('gfk_header');
    expect(readMcpToken(new Request('https://gymfreek.example/mcp?token=gfk_query'))).toBe(
      'gfk_query',
    );
  });
});
