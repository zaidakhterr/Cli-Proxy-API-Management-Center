import { describe, expect, test } from 'bun:test';
import { buildProviderSummaries } from '@/features/quota/quotaSummaryModel';
import type { QuotaFileEntry } from '@/features/quota/logic';
import type { QuotaCardState } from '@/features/quota/providers';
import type { AuthFileItem } from '@/types';

const NOW = Date.parse('2026-10-13T10:00:00Z');
const HOUR = 3_600_000;

const entry = (type: QuotaFileEntry['type'], name: string, disabled = false): QuotaFileEntry =>
  ({ type, file: { name, type, disabled } as unknown as AuthFileItem }) as QuotaFileEntry;

const success = (windows: Array<{ label: string; usedPercent: number | null; resetAtMs?: number }>) =>
  ({ status: 'success', windows }) as unknown as QuotaCardState;

describe('buildProviderSummaries', () => {
  test('pools remaining capacity per window label and keeps the soonest future reset', () => {
    const entries = [entry('claude', 'a'), entry('claude', 'b'), entry('codex', 'c')];
    const states: Record<string, QuotaCardState> = {
      a: success([
        { label: '5-hour limit', usedPercent: 20, resetAtMs: NOW + 3 * HOUR },
        { label: '7-day limit', usedPercent: 50, resetAtMs: NOW + 40 * HOUR },
      ]),
      b: success([
        { label: '5-hour limit', usedPercent: 90, resetAtMs: NOW + HOUR },
        { label: '7-day limit', usedPercent: 10, resetAtMs: NOW - HOUR },
      ]),
      c: success([{ label: 'Weekly limit', usedPercent: 30 }]),
    };

    const [claude, codex] = buildProviderSummaries(entries, (e) => states[e.file.name], NOW);

    expect(claude.type).toBe('claude');
    expect(claude.credentials).toBe(2);
    expect(claude.rows).toEqual([
      { label: '5-hour limit', remaining: [80, 10], soonestResetMs: NOW + HOUR },
      { label: '7-day limit', remaining: [50, 90], soonestResetMs: NOW + 40 * HOUR },
    ]);
    expect(codex.rows).toEqual([{ label: 'Weekly limit', remaining: [70], soonestResetMs: null }]);
  });

  test('skips disabled credentials, unloaded quota and providers with nothing to show', () => {
    const entries = [entry('claude', 'a'), entry('claude', 'off', true), entry('codex', 'idle')];
    const states: Record<string, QuotaCardState> = {
      a: success([{ label: '5-hour limit', usedPercent: 120 }]),
      off: success([{ label: '5-hour limit', usedPercent: 0 }]),
      idle: { status: 'loading' },
    };

    const summaries = buildProviderSummaries(entries, (e) => states[e.file.name], NOW);

    expect(summaries.map((summary) => summary.type)).toEqual(['claude']);
    expect(summaries[0].credentials).toBe(1);
    expect(summaries[0].rows[0].remaining).toEqual([0]);
  });
});
