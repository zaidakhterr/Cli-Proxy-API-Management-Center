/**
 * Pooled capacity per provider, across every credential: "Weekly limit 140% of 300%"
 * with one bar segment per account and the soonest reset. Lets you see at a glance how
 * much is left before opening each card.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthFileIcon, getTypeLabel } from '@/features/authFiles/constants';
import { useNow } from '@/hooks/useNow';
import type { ResolvedTheme } from '@/types';
import { formatRelativeInstant } from '@/utils/quota/relativeTime';
import { QUOTA_PROGRESS_HIGH_THRESHOLD, QUOTA_PROGRESS_MEDIUM_THRESHOLD } from './QuotaMeter';
import type { QuotaCardState } from '../providers';
import type { QuotaProviderType } from '../providers/types';
import type { QuotaFileEntry } from '../logic';
import { buildProviderSummaries } from '../quotaSummaryModel';
import styles from './QuotaSummary.module.scss';

const MAX_ROWS_PER_PROVIDER = 3;

const toneClass = (percent: number) =>
  percent >= QUOTA_PROGRESS_HIGH_THRESHOLD
    ? styles.high
    : percent >= QUOTA_PROGRESS_MEDIUM_THRESHOLD
      ? styles.medium
      : styles.low;

interface QuotaSummaryProps {
  entries: QuotaFileEntry[];
  quotaFor: (entry: QuotaFileEntry) => QuotaCardState | undefined;
  resolvedTheme: ResolvedTheme;
  onSelectProvider: (type: QuotaProviderType) => void;
}

export function QuotaSummary({
  entries,
  quotaFor,
  resolvedTheme,
  onSelectProvider,
}: QuotaSummaryProps) {
  const { t } = useTranslation();
  const now = useNow(true);
  const summaries = useMemo(
    () => buildProviderSummaries(entries, quotaFor, now),
    [entries, quotaFor, now]
  );

  if (summaries.length === 0) return null;

  return (
    <div className={styles.summary}>
      {summaries.map((summary) => {
        const icon = getAuthFileIcon(summary.type, resolvedTheme);
        return (
          <button
            key={summary.type}
            type="button"
            className={styles.card}
            onClick={() => onSelectProvider(summary.type)}
          >
            <div className={styles.cardHeader}>
              {icon && <img src={icon} alt="" className={styles.icon} />}
              <span className={styles.name}>{getTypeLabel(t, summary.type)}</span>
              <span className={styles.count}>
                {t('quota_management.summary_credentials', { count: summary.credentials })}
              </span>
            </div>
            {summary.rows.slice(0, MAX_ROWS_PER_PROVIDER).map((row) => {
              const total = row.remaining.length * 100;
              const left = Math.round(row.remaining.reduce((sum, value) => sum + value, 0));
              return (
                <div key={row.label} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.label}>{row.label}</span>
                    <span className={styles.value}>
                      <strong>{left}%</strong> {t('quota_management.summary_of', { total })}
                    </span>
                  </div>
                  <div className={styles.segments}>
                    {row.remaining.map((value, index) => (
                      <span key={index} className={styles.segment}>
                        <span
                          className={`${styles.fill} ${toneClass(value)}`}
                          style={{ width: `${value}%` }}
                        />
                      </span>
                    ))}
                  </div>
                  {row.soonestResetMs !== null && (
                    <div className={styles.reset}>
                      {t('quota_management.summary_next_reset', {
                        when: formatRelativeInstant(row.soonestResetMs, now, 'en'),
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
