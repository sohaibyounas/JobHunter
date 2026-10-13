import React, { useEffect, useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { buildTheme } from './theme/theme';
import { AppProvider, useApp } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/Common/ErrorBoundary';

function ThemedApp() {
  const { darkMode } = useApp();
  const theme = useMemo(() => buildTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {/* Respect the OS "reduce motion" setting for every animation */}
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}
