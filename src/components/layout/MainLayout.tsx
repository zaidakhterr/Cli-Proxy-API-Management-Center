import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { MainRoutes } from '@/router/MainRoutes';
import { authFilesApi } from '@/services/api';
import {
  IconLogout,
  IconMenu,
  IconMoon,
  IconRefresh,
  IconSidebarAuthFiles,
  IconSidebarConfig,
  IconSidebarDashboard,
  IconSidebarLogs,
  IconSidebarOauth,
  IconSidebarQuota,
  IconSidebarSystem,
  IconSidebarToggle,
  IconSun,
  IconX,
} from '@/components/ui/icons';
import { INLINE_LOGO_JPEG } from '@/assets/logoInline';
import { useAuthStore, useConfigStore, useNotificationStore, useThemeStore } from '@/stores';
import { AUTH_FILES_CHANGED_EVENT } from '@/features/authFiles/authFilesEvents';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { isSidebarToggleShortcut } from '@/utils/sidebarShortcut';

interface NavItem {
  path: string;
  labelKey: string;
  icon: ReactNode;
  badge?: number;
}

const SIDEBAR_COLLAPSED_KEY = 'cli-proxy-sidebar-collapsed';

const readSidebarCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

export function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const showNotification = useNotificationStore((state) => state.showNotification);

  const logout = useAuthStore((state) => state.logout);
  const connectionStatus = useAuthStore((state) => state.connectionStatus);
  const apiBase = useAuthStore((state) => state.apiBase);

  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const clearCache = useConfigStore((state) => state.clearCache);

  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [authFilesCount, setAuthFilesCount] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const authFilesCountRequestRef = useRef(0);

  const isLogsPage = location.pathname.startsWith('/logs');
  const showLabels = !sidebarCollapsed || sidebarOpen;

  // Floating toolbars (config save bar, auth-file batch bar) centre on the content column.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      document.documentElement.style.setProperty(
        '--content-center-x',
        `${rect.left + rect.width / 2}px`
      );
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--content-center-x');
    };
  }, []);

  useEffect(() => {
    fetchConfig().catch(() => {
      // Ignore the initial failure; the login flow shows the user-facing prompt.
    });
  }, [fetchConfig]);

  const loadAuthFilesCount = useCallback(async () => {
    const requestID = ++authFilesCountRequestRef.current;
    if (connectionStatus !== 'connected') {
      setAuthFilesCount(null);
      return;
    }
    try {
      const response = await authFilesApi.list();
      if (requestID !== authFilesCountRequestRef.current) return;
      setAuthFilesCount(Array.isArray(response?.files) ? response.files.length : null);
    } catch {
      if (requestID !== authFilesCountRequestRef.current) return;
      setAuthFilesCount(null);
    }
  }, [connectionStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAuthFilesCount(), 0);
    window.addEventListener(AUTH_FILES_CHANGED_EVENT, loadAuthFilesCount);
    return () => {
      authFilesCountRequestRef.current += 1;
      window.clearTimeout(timer);
      window.removeEventListener(AUTH_FILES_CHANGED_EVENT, loadAuthFilesCount);
    };
  }, [apiBase, loadAuthFilesCount]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSidebarToggleShortcut(event)) {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
  }, [sidebarCollapsed]);

  const handleRefreshAll = async () => {
    clearCache();
    const results = await Promise.allSettled([
      fetchConfig(true),
      loadAuthFilesCount(),
      triggerHeaderRefresh(),
    ]);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected && rejected.status === 'rejected') {
      const reason = rejected.reason;
      const message =
        typeof reason === 'string' ? reason : reason instanceof Error ? reason.message : '';
      showNotification(
        `${t('notification.refresh_failed')}${message ? `: ${message}` : ''}`,
        'error'
      );
      return;
    }
    showNotification(t('notification.data_refreshed'), 'success');
  };

  const themeLabel =
    resolvedTheme === 'dark' ? t('theme.switch_to_light') : t('theme.switch_to_dark');
  const collapseLabel = sidebarCollapsed
    ? t('sidebar.toggle_expand')
    : t('sidebar.toggle_collapse');

  const navItems: NavItem[] = [
    { path: '/', labelKey: 'nav.quota_management', icon: <IconSidebarQuota size={18} /> },
    {
      path: '/auth-files',
      labelKey: 'nav.auth_files',
      icon: <IconSidebarAuthFiles size={18} />,
      badge: authFilesCount ?? undefined,
    },
    { path: '/oauth', labelKey: 'nav.oauth', icon: <IconSidebarOauth size={18} /> },
    { path: '/usage', labelKey: 'nav.dashboard', icon: <IconSidebarDashboard size={18} /> },
    { path: '/logs', labelKey: 'nav.logs', icon: <IconSidebarLogs size={18} /> },
    { path: '/config', labelKey: 'nav.config_management', icon: <IconSidebarConfig size={18} /> },
    { path: '/system', labelKey: 'nav.system_info', icon: <IconSidebarSystem size={18} /> },
  ];

  const actions = (
    <>
      <Button
        className="icon-action"
        variant="ghost"
        size="sm"
        onClick={handleRefreshAll}
        title={t('header.refresh_all')}
        aria-label={t('header.refresh_all')}
      >
        <IconRefresh size={16} />
      </Button>
      <Button
        className="icon-action"
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        title={themeLabel}
        aria-label={themeLabel}
      >
        {resolvedTheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
      </Button>
      <Button
        className="icon-action"
        variant="ghost"
        size="sm"
        onClick={logout}
        title={t('header.logout')}
        aria-label={t('header.logout')}
      >
        <IconLogout size={16} />
      </Button>
    </>
  );

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <header className="mobile-topbar">
        <Button
          className="icon-action"
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? t('sidebar.toggle_collapse') : t('sidebar.toggle_expand')}
        >
          {sidebarOpen ? <IconX size={16} /> : <IconMenu size={16} />}
        </Button>
        <img src={INLINE_LOGO_JPEG} alt="" className="sidebar-brand-logo" />
      </header>

      <button
        type="button"
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label={t('common.close')}
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {showLabels && (
            <div className="sidebar-brand">
              <img src={INLINE_LOGO_JPEG} alt="" className="sidebar-brand-logo" />
              <span className="sidebar-brand-title">{t('title.abbr')}</span>
            </div>
          )}
          <Button
            className="icon-action sidebar-collapse-toggle"
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={collapseLabel}
            aria-label={collapseLabel}
            aria-expanded={!sidebarCollapsed}
          >
            <IconSidebarToggle size={16} />
          </Button>
        </div>

        <nav className="nav-section">
          {navItems.map((item) => {
            const label = t(item.labelKey);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={showLabels ? undefined : label}
                aria-label={showLabels ? undefined : label}
              >
                <span className="nav-icon">{item.icon}</span>
                {showLabels && <span className="nav-label">{label}</span>}
                {showLabels && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">{actions}</div>
      </aside>

      <div className={`content${isLogsPage ? ' content-logs' : ''}`} ref={contentRef}>
        <main className={`main-content${isLogsPage ? ' main-content-logs' : ''}`}>
          <MainRoutes />
        </main>
      </div>
    </div>
  );
}
