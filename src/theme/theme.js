import { alpha, createTheme } from '@mui/material/styles';

const HEADING_FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
const BODY_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Design tokens shared by the light and dark palettes
const tokens = {
  light: {
    bg: '#f8fafc',
    paper: '#ffffff',
    subtle: '#f1f5f9',
    border: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#475569',
    textDisabled: '#94a3b8',
    primary: '#059669',
    primaryLight: '#34d399',
    primaryDark: '#047857',
    accentMint: '#00e599',
  },
  dark: {
    bg: '#090d16',
    paper: '#111827',
    subtle: '#1a2234',
    border: '#243046',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textDisabled: '#64748b',
    primary: '#10b981',
    primaryLight: '#6ee7b7',
    primaryDark: '#059669',
    accentMint: '#00e599',
  },
};

export function buildTheme(mode = 'light') {
  const t = tokens[mode];
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, light: t.primaryLight, dark: t.primaryDark, contrastText: '#ffffff' },
      secondary: { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7', contrastText: '#ffffff' },
      success: { main: '#10b981', light: '#6ee7b7', dark: '#047857', contrastText: '#ffffff' },
      warning: { main: '#f59e0b', light: '#fcd34d', dark: '#b45309', contrastText: '#ffffff' },
      error: { main: '#ef4444', light: '#fca5a5', dark: '#b91c1c', contrastText: '#ffffff' },
      info: { main: '#06b6d4', light: '#67e8f9', dark: '#0e7490', contrastText: '#ffffff' },
      background: { default: t.bg, paper: t.paper, subtle: t.subtle },
      text: { primary: t.text, secondary: t.textSecondary, disabled: t.textDisabled },
      divider: t.border,
      action: {
        hover: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
        selected: alpha(t.primary, isDark ? 0.2 : 0.12),
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: BODY_FONT,
      h1: { fontFamily: HEADING_FONT, fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.15, letterSpacing: '-0.02em' },
      h2: { fontFamily: HEADING_FONT, fontWeight: 800, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
      h3: { fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.625rem', lineHeight: 1.25, letterSpacing: '-0.015em' },
      h4: { fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
      h5: { fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.4 },
      h6: { fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1rem', lineHeight: 1.45 },
      subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
      subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.55 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { fontWeight: 700, fontSize: '0.6875rem', letterSpacing: '0.08em' },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: t.bg },
          '::selection': { background: alpha(t.primary, 0.25) },
          '*::-webkit-scrollbar': { width: 6, height: 6 },
          '*::-webkit-scrollbar-thumb': { background: isDark ? '#243046' : '#cbd5e1', borderRadius: 99 },
          '*::-webkit-scrollbar-thumb:hover': { background: isDark ? '#334155' : '#94a3b8' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 99, padding: '7px 18px', transition: 'all .18s ease' },
          sizeSmall: { padding: '5px 14px', fontSize: '0.8125rem' },
          sizeLarge: { padding: '11px 24px', fontSize: '0.9375rem' },
          containedPrimary: {
            backgroundColor: '#00e599',
            color: '#06281e',
            fontWeight: 700,
            backgroundImage: 'none',
            '&:hover': { backgroundColor: '#00cc88', color: '#041d15' },
            '&.Mui-disabled': { backgroundColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#475569' : '#94a3b8' },
          },
          outlined: { borderColor: t.border, '&:hover': { borderColor: t.primary } },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${t.border}`,
            backgroundColor: t.paper,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
          sizeSmall: { height: 24, fontSize: '0.75rem' },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? alpha('#fff', 0.02) : '#fff',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#3a4560' : '#c8cede' },
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true, enterDelay: 300 },
        styleOverrides: {
          tooltip: { backgroundColor: isDark ? '#2a3348' : '#111827', fontSize: '0.75rem', borderRadius: 8, padding: '6px 10px' },
          arrow: { color: isDark ? '#2a3348' : '#111827' },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${t.border}`,
            boxShadow: isDark ? '0 16px 40px rgba(0,0,0,.5)' : '0 16px 40px rgba(15,23,42,.12)',
            borderRadius: 12,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: { root: { borderRadius: 8, margin: '2px 6px', fontSize: '0.875rem' } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, border: `1px solid ${t.border}` },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { borderColor: t.border, backgroundImage: 'none' } },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: { height: 3, borderRadius: 3 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { minHeight: 40, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', paddingInline: 14 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 99, height: 6, backgroundColor: isDark ? '#1f2840' : '#eceff5' },
          bar: { borderRadius: 99 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { padding: 8 },
          track: { borderRadius: 22 / 2 },
          thumb: { boxShadow: 'none' },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiListItemButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
    },
  });
}
