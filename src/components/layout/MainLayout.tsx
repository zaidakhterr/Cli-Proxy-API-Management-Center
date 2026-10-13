import { ReactNode, SVGProps, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { MainRoutes } from '@/router/MainRoutes';
import { authFilesApi } from '@/services/api';
import {
  IconSidebarAuthFiles,
  IconSidebarConfig,
  IconSidebarDashboard,
  IconSidebarLogs,
  IconSidebarOauth,
  IconSidebarQuota,
  IconSidebarSystem,
} from '@/components/ui/icons';
import { INLINE_LOGO_JPEG } from '@/assets/logoInline';
import { useAuthStore, useConfigStore, useNotificationStore, useThemeStore } from '@/stores';
import { AUTH_FILES_CHANGED_EVENT } from '@/features/authFiles/authFilesEvents';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { isSidebarToggleShortcut } from '@/utils/sidebarShortcut';
import type { Theme } from '@/types';

interface NavItem {
  path: string;
  labelKey: string;
  icon: ReactNode;
  badge?: number;
}

const iconProps: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

const icons = {
  refresh: (
    <svg {...iconProps}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  sun: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  moon: (
    <svg {...iconProps}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  ),
  auto: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

// The theme button cycles through these; 'white' stays valid for anyone who saved it earlier.
const THEME_CYCLE: Theme[] = ['auto', 'light', 'dark'];

export function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const showNotification = useNotificationStore((state) => state.showNotification);

  const logout = useAuthStore((state) => state.logout);
  const connectionStatus = useAuthStore((state) => state.connectionStatus);
  const apiBase = useAuthStore((state) => state.apiBase);

  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const clearCache = useConfigStore((state) => state.clearCache);

  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const cycleTheme = () => {
    const index = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  };
  const themeLabel = `${t('theme.switch')}: ${t(`theme.${theme}`)}`;

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
        {icons.refresh}
      </Button>
      <Button
        className="icon-action"
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        title={themeLabel}
        aria-label={themeLabel}
      >
        {theme === 'auto' ? icons.auto : theme === 'dark' ? icons.moon : icons.sun}
      </Button>
      <Button
        className="icon-action"
        variant="ghost"
        size="sm"
        onClick={logout}
        title={t('header.logout')}
        aria-label={t('header.logout')}
      >
        {icons.logout}
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
          {sidebarOpen ? icons.close : icons.menu}
        </Button>
        <img src={INLINE_LOGO_JPEG} alt="" className="sidebar-brand-logo" />
        <span className="sidebar-brand-title">{t('title.abbr')}</span>
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
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          <img src={INLINE_LOGO_JPEG} alt="" className="sidebar-brand-logo" />
          {showLabels && <span className="sidebar-brand-title">{t('title.abbr')}</span>}
        </button>

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
