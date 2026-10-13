import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { SearchOffRounded } from '@mui/icons-material';
import { motion } from './motion';

export default function EmptyState({ icon = <SearchOffRounded />, title, description, actionLabel, onAction, compact = false }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      sx={{ textAlign: 'center', py: compact ? 4 : 8, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Box
        sx={{
          width: compact ? 52 : 68,
          height: compact ? 52 : 68,
          borderRadius: 4,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.selected',
          color: 'primary.main',
          mb: 2,
          '& svg': { fontSize: compact ? 26 : 32 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: actionLabel ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
