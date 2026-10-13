import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Alert, Box, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar, { SIDEBAR_COLLAPSED, SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';
import MobileNav, { MOBILE_NAV_HEIGHT } from './MobileNav';
import CommandPalette from './CommandPalette';
import CopilotChat, { CopilotFab } from '../Copilot/CopilotChat';
import ErrorBoundary from '../Common/ErrorBoundary';
import PageLoader from '../Common/PageLoader';
import { PageTransition } from '../Common/motion';
import { useApp } from '../../context/AppContext';
import { ALL_NAV_ITEMS } from './nav';

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const outlet = useOutlet();
  const { copilot, toast, closeToast, settings, updateSettings } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const collapsed = !isMobile && settings.sidebarCollapsed;
  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const section = location.pathname.split('/')[1] || 'dashboard';

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset scroll and update the document title on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const item = ALL_NAV_ITEMS.find((i) => i.to === `/${section}`);
    document.title = item ? `${item.label} · JobHunter AI` : 'JobHunter AI';
  }, [section]);

  const toggleCollapse = useCallback(() => updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed }), [settings.sidebarCollapsed, updateSettings]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="a"
        href="#main"
        sx={{ position: 'absolute', left: -9999, top: 8, zIndex: 9999, px: 2, py: 1, bgcolor: 'primary.main', color: '#fff', borderRadius: 2, '&:focus': { left: 8 } }}
      >
        Skip to content
      </Box>

      <Sidebar isMobile={isMobile} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <Box
        component={motion.div}
        initial={false}
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <Header isMobile={isMobile} onMenuClick={() => setMobileOpen(true)} onOpenSearch={() => setPaletteOpen(true)} />

        <Box
          component="main"
          id="main"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            pt: { xs: 2.5, sm: 3 },
            pb: isMobile ? `calc(${MOBILE_NAV_HEIGHT + 96}px + env(safe-area-inset-bottom))` : 6,
            outline: 'none',
          }}
        >
          <ErrorBoundary resetKey={location.pathname}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={section}>
                <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </Box>
      </Box>

      {isMobile && <MobileNav onMore={() => setMobileOpen(true)} />}

      <CopilotFab hidden={copilot.open} isMobile={isMobile} />
      <CopilotChat />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Snackbar
        key={toast.key}
        open={toast.open}
        autoHideDuration={3500}
        onClose={(_, reason) => reason !== 'clickaway' && closeToast()}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'left' }}
        sx={{ bottom: isMobile ? `calc(${MOBILE_NAV_HEIGHT + 12}px + env(safe-area-inset-bottom)) !important` : undefined, left: isMobile ? undefined : `${sidebarWidth + 24}px !important` }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%', boxShadow: '0 12px 32px rgba(0,0,0,.2)' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
