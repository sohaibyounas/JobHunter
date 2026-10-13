import React from 'react';
import { Box, Button, Typography } from '@mui/material';

/** Catches render errors so one broken page never blanks the whole app. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook a monitoring service (e.g. Sentry) in here for production.
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = /Loading chunk|dynamically imported module|Failed to fetch/i.test(String(this.state.error?.message));
    return (
      <Box role="alert" sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
        <Box sx={{ maxWidth: 420 }}>
          <Typography variant="h4" gutterBottom>
            {isChunkError ? 'A new version is available' : 'Something went wrong'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isChunkError
              ? 'The app was updated while you were using it. Reload to get the latest version.'
              : 'This section hit an unexpected error. Your data is safe. Try again, or reload the page.'}
          </Typography>
          {this.state.error?.message && (
            <Typography
              color="error"
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: 'rgba(239,68,68,0.1)',
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                textAlign: 'left',
                wordBreak: 'break-word',
              }}
            >
              {String(this.state.error.message)}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isChunkError && (
              <Button variant="outlined" onClick={() => this.setState({ error: null })}>
                Try again
              </Button>
            )}
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Reset Data
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
}
