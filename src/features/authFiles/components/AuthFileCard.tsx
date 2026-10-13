import { getAuthFileRefreshKey } from '@/features/authFiles/manualRefresh';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Menu } from '@/components/ui/Menu';
import { IconDownload, IconRefreshCw, IconSettings, IconTrash2 } from '@/components/ui/icons';
import type { AuthFileItem } from '@/types';
import {
  getAuthFileStatusMessage,
  hasAuthFileStatusWarning,
  getTypeLabel,
  isRuntimeOnlyAuthFile,
  normalizeProviderKey,
  supportsAuthFileManualRefresh,
  type AuthFileQuotaFilter,
  type ResolvedTheme,
} from '@/features/authFiles/constants';
import { deriveAuthFileIdentity } from '@/features/authFiles/identity';
import type { AuthFileStatusBarData } from '@/features/authFiles/hooks/useAuthFilesStatusBarCache';
import { AuthFileCooldownSection } from './AuthFileCooldownSection';
import styles from './AuthFileCard.module.scss';

export type AuthFileCardProps = {
  file: AuthFileItem;
  compact: boolean;
  selected: boolean;
  resolvedTheme: ResolvedTheme;
  disableControls: boolean;
  deleting: string | null;
  statusUpdating: Record<string, boolean>;
  manualRefreshing: Record<string, boolean>;
  cooldownResetting: Record<string, boolean>;
  quotaFilterType: AuthFileQuotaFilter;
  statusBarCache: Map<string, AuthFileStatusBarData>;
  /** 首屏一次性级联入场的延迟；null/undefined 表示不做入场动画。 */
  entranceDelayMs?: number | null;
  onShowModels: (file: AuthFileItem) => void;
  onDownload: (name: string) => void;
  onManualRefresh: (file: AuthFileItem) => void;
  onCooldownReset: (file: AuthFileItem) => void;
  onOpenPrefixProxyEditor: (file: AuthFileItem) => void;
  onDelete: (name: string) => void;
  onToggleStatus: (file: AuthFileItem, enabled: boolean) => void;
  onToggleSelect: (name: string) => void;
};

export function AuthFileCard(props: AuthFileCardProps) {
  const { t } = useTranslation();
  const {
    file,
    selected,
    disableControls,
    deleting,
    statusUpdating,
    manualRefreshing,
    cooldownResetting,
    onShowModels,
    onDownload,
    onManualRefresh,
    onCooldownReset,
    onOpenPrefixProxyEditor,
    onDelete,
    onToggleStatus,
    onToggleSelect,
  } = props;

  const isRuntimeOnly = isRuntimeOnlyAuthFile(file);
  const providerKey = normalizeProviderKey(String(file.type ?? file.provider ?? 'unknown'));
  const isAistudio = providerKey === 'aistudio';
  const showModelsButton = !isRuntimeOnly || isAistudio;
  const showManualRefreshButton = !isRuntimeOnly && supportsAuthFileManualRefresh(providerKey);
  const isManualRefreshing = manualRefreshing[getAuthFileRefreshKey(file)] === true;
  const typeLabel = getTypeLabel(t, providerKey);

  const authIndexKey = typeof file.authIndex === 'string' ? file.authIndex : null;
  const isCooldownResetting = Boolean(authIndexKey && cooldownResetting[authIndexKey]);
  const successCount = file.successCount ?? 0;
  const failureCount = file.failureCount ?? 0;

  const rawStatusMessage = getAuthFileStatusMessage(file);
  const hasStatusWarning = hasAuthFileStatusWarning(file);

  const priorityValue = Number.isSafeInteger(file.priority) ? file.priority : undefined;
  const weightValue = Number.isSafeInteger(file.weight) ? file.weight : undefined;
  const noteValue = typeof file.note === 'string' ? file.note.trim() : '';
  const identity = deriveAuthFileIdentity(file);
  const isDeleting = deleting === file.name;

  const details = [
    typeLabel,
    noteValue,
    priorityValue !== undefined ? `${t('auth_files.priority_display')} ${priorityValue}` : '',
    weightValue !== undefined ? `${t('auth_files.weight_display')} ${weightValue}` : '',
  ].filter(Boolean);

  const rowClasses = [
    styles.card,
    selected ? styles.cardSelected : '',
    file.disabled === true ? styles.cardDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={rowClasses}>
      <div className={styles.row}>
        <header className={styles.head}>
          {!isRuntimeOnly && (
            <SelectionCheckbox
              checked={selected}
              onChange={() => onToggleSelect(file.name)}
              className={styles.selection}
              ariaLabel={t('auth_files.card_select', { name: file.name })}
              title={t('auth_files.card_select', { name: file.name })}
            />
          )}
          <div className={styles.identityBlock}>
            <h3 className={styles.identity} title={identity.fullName}>
              <span
                className={`${styles.account} ${identity.kind === 'fileName' ? styles.accountMono : ''}`}
              >
                {identity.primary}
              </span>
              {file.disabled === true && (
                <span className={styles.stateBadgeMuted}>{t('auth_files.status_disabled')}</span>
              )}
              {rawStatusMessage && hasStatusWarning && (
                <span className={styles.stateBadgeError}>{t('auth_files.status_problem')}</span>
              )}
              {isRuntimeOnly && (
                <span className={styles.stateBadgeMuted}>{t('auth_files.type_virtual')}</span>
              )}
            </h3>
            {rawStatusMessage && hasStatusWarning ? (
              <p className={styles.warning} title={rawStatusMessage}>
                {typeLabel} · {rawStatusMessage}
              </p>
            ) : (
              <p className={styles.details} title={identity.secondary ?? undefined}>
                {details.join(' · ')}
              </p>
            )}
          </div>
        </header>

        <div className={styles.requests} title={t('auth_files.card_requests')}>
          <span className={successCount > 0 ? styles.countOk : undefined}>
            {successCount} {t('auth_files.requests_ok')}
          </span>
          <span className={styles.metaDivider} aria-hidden="true">
            ·
          </span>
          <span className={failureCount > 0 ? styles.countFail : undefined}>
            {failureCount} {t('auth_files.requests_failed')}
          </span>
        </div>

        <footer className={styles.actions}>
          {showModelsButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onShowModels(file)}
              disabled={disableControls}
            >
              {t('auth_files.models_button')}
            </Button>
          )}
          {showManualRefreshButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManualRefresh(file)}
              className={styles.iconButton}
              title={t('auth_files.manual_refresh_button')}
              aria-label={t('auth_files.manual_refresh_button')}
              disabled={
                disableControls ||
                file.disabled ||
                statusUpdating[getAuthFileRefreshKey(file)] === true ||
                isManualRefreshing
              }
            >
              {isManualRefreshing ? <LoadingSpinner size={14} /> : <IconRefreshCw size={16} />}
            </Button>
          )}
          {!isRuntimeOnly && (
            <Menu
              label={t('auth_files.more_actions', { name: identity.primary })}
              disabled={disableControls}
              items={[
                {
                  key: 'download',
                  label: t('auth_files.download_button'),
                  icon: <IconDownload size={16} />,
                  onSelect: () => onDownload(file.name),
                },
                {
                  key: 'settings',
                  label: t('auth_files.prefix_proxy_button'),
                  icon: <IconSettings size={16} />,
                  onSelect: () => onOpenPrefixProxyEditor(file),
                  disabled: isManualRefreshing,
                },
                {
                  key: 'delete',
                  label: t('auth_files.delete_button'),
                  icon: isDeleting ? <LoadingSpinner size={14} /> : <IconTrash2 size={16} />,
                  onSelect: () => onDelete(file.name),
                  disabled: isDeleting || isManualRefreshing,
                  danger: true,
                },
              ]}
            />
          )}
          {!isRuntimeOnly && (
            <ToggleSwitch
              ariaLabel={t('auth_files.card_toggle', { name: file.name })}
              checked={!file.disabled}
              disabled={
                disableControls ||
                statusUpdating[getAuthFileRefreshKey(file)] === true ||
                isManualRefreshing
              }
              onChange={(value) => onToggleStatus(file, value)}
            />
          )}
        </footer>
      </div>

      <AuthFileCooldownSection
        snapshot={file.cooldownSnapshot}
        resetting={isCooldownResetting}
        resetDisabled={
          disableControls ||
          statusUpdating[getAuthFileRefreshKey(file)] === true ||
          isManualRefreshing
        }
        onReset={authIndexKey ? () => onCooldownReset(file) : undefined}
      />
    </article>
  );
}
