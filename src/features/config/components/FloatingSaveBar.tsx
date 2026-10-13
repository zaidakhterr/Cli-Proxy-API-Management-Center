import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { IconCheck } from '@/components/ui/icons';
import { useActionBarHeightVar } from '@/hooks/useActionBarHeightVar';
import type { ConfigStatusTone } from '../uiState';
import styles from './FloatingSaveBar.module.scss';

export type FloatingSaveBarProps = {
  /** 有未保存修改时可见（与未保存离开守卫的 block 条件一致）。 */
  visible: boolean;
  statusText: string;
  statusTone: ConfigStatusTone;
  saving: boolean;
  saveDisabled: boolean;
  discardDisabled: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

/**
 * 悬浮保存栏：portal 到 body 的玻璃工具栏，仅在 dirty 时出现。
 * - 上浮入场 0.28s 强减速，退场 0.22s 加速后卸载；
 * - reduced-motion 只做透明度淡入淡出（保留 translateX(-50%)，防止错位半宽）；
 * - 实时高度写入 --config-action-bar-height 供页面底部留白。
 */
export function FloatingSaveBar(props: FloatingSaveBarProps) {
  const {
    visible,
    statusText,
    statusTone,
    saving,
    saveDisabled,
    discardDisabled,
    onSave,
    onDiscard,
  } = props;
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useActionBarHeightVar(containerRef, '--config-action-bar-height', mounted);

  useEffect(() => {
    setMounted(visible);
  }, [visible]);

  if (!mounted || typeof document === 'undefined') return null;

  const toneClass: Record<ConfigStatusTone, string> = {
    error: styles.statusError,
    warning: styles.statusWarning,
    busy: styles.statusBusy,
    muted: styles.statusMuted,
    ok: styles.statusOk,
  };

  return createPortal(
    <div className={styles.container} ref={containerRef}>
      <div className={styles.bar} role="group" aria-label={t('config_management.status_dirty')}>
        <span className={`${styles.status} ${toneClass[statusTone]}`} aria-live="polite">
          {statusText}
        </span>
        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.ghostAction}
            onClick={onDiscard}
            disabled={discardDisabled}
          >
            {t('config_management.actions.discard')}
          </button>
          <button
            type="button"
            className={styles.savePill}
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? <LoadingSpinner size={14} /> : <IconCheck size={15} />}
            {t('config_management.actions.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
