import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatedNumber, motion } from './motion';

export default function StatCard({ label, value, icon, color = '#6366f1', hint, onClick }) {
  return (
    <Card
      component={motion.div}
      whileHover={onClick ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      sx={{
        p: { xs: 2, sm: 2.25 },
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? { borderColor: alpha(color, 0.5) } : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: alpha(color, 0.12), color, '& svg': { fontSize: 19 } }}>
          {icon}
        </Box>
      </Box>
      <Typography sx={{ fontSize: { xs: '1.625rem', sm: '1.875rem' }, fontWeight: 800, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <AnimatedNumber value={value} />
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          {hint}
        </Typography>
      )}
      <Box sx={{ position: 'absolute', right: -24, bottom: -24, width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(color, 0.06) }} />
    </Card>
  );
}
