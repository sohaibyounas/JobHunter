import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { HomeRounded, TravelExploreRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
      <Box>
        <Typography
          component={motion.h1}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: { xs: '5rem', sm: '7rem' },
            lineHeight: 1,
            m: 0,
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          404
        </Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          This page took a different career path
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          The page you're looking for doesn't exist or has moved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/dashboard" variant="contained" startIcon={<HomeRounded />}>
            Go to dashboard
          </Button>
          <Button component={RouterLink} to="/jobs" variant="outlined" startIcon={<TravelExploreRounded />}>
            Browse jobs
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
