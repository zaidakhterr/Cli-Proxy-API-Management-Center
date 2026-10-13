/**
 * Pools quota windows across credentials of the same provider for the summary strip on the
 * quota page. Reads provider states structurally: any successful state with a `windows`
 * array of `{ label, usedPercent, resetAtMs }` rows contributes.
 */

import type { QuotaCardState } from './providers';
import type { QuotaProviderType } from './providers/types';
import type { QuotaFileEntry } from './logic';
import { QUOTA_TAB_ORDER } from './constants';

interface WindowLike {
  label?: string;
  usedPercent?: number | null;
  resetAtMs?: number | null;
}

export interface SummaryRow {
  label: string;
  remaining: number[];
  soonestResetMs: number | null;
}

export interface ProviderSummary {
  type: QuotaProviderType;
  credentials: number;
  rows: SummaryRow[];
}

const readWindows = (state: QuotaCardState | undefined): WindowLike[] => {
  if (!state || state.status !== 'success') return [];
  const windows = (state as QuotaCardState & { windows?: unknown }).windows;
  return Array.isArray(windows) ? (windows as WindowLike[]) : [];
};

export function buildProviderSummaries(
  entries: QuotaFileEntry[],
  quotaFor: (entry: QuotaFileEntry) => QuotaCardState | undefined,
  nowMs: number
): ProviderSummary[] {
  const byType = new Map<QuotaProviderType, ProviderSummary>();
  for (const entry of entries) {
    if (entry.file.disabled) continue;
    let summary = byType.get(entry.type);
    if (!summary) {
      summary = { type: entry.type, credentials: 0, rows: [] };
      byType.set(entry.type, summary);
    }
    summary.credentials += 1;
    for (const window of readWindows(quotaFor(entry))) {
      const label = window.label?.trim();
      const used = typeof window.usedPercent === 'number' ? window.usedPercent : null;
      if (!label || used === null) continue;
      let row = summary.rows.find((item) => item.label === label);
      if (!row) {
        row = { label, remaining: [], soonestResetMs: null };
        summary.rows.push(row);
      }
      row.remaining.push(Math.max(0, Math.min(100, 100 - used)));
      const reset = window.resetAtMs;
      if (typeof reset === 'number' && Number.isFinite(reset) && reset > nowMs) {
        row.soonestResetMs = row.soonestResetMs === null ? reset : Math.min(row.soonestResetMs, reset);
      }
    }
  }
  return QUOTA_TAB_ORDER.map((type) => byType.get(type)).filter(
    (summary): summary is ProviderSummary => Boolean(summary && summary.rows.length > 0)
  );
}

