import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Logo({ collapsed = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        component="img"
        src="/favicon.svg"
        alt=""
        sx={{ width: 34, height: 34, borderRadius: '10px', flexShrink: 0, boxShadow: '0 6px 16px rgba(99,102,241,.35)' }}
      />
      {!collapsed && (
        <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          JobHunter
          <Box component="span" sx={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ml: 0.5 }}>
            AI
          </Box>
        </Typography>
      )}
    </Box>
  );
}
