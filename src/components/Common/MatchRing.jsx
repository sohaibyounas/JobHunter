import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { matchColor } from '../../lib/matching';

/** Circular score indicator with an animated stroke. */
export default function MatchRing({ score, size = 64, stroke = 6, label, color, showPercent = true }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = color || matchColor(score);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={`${score}% ${label || 'match'}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} style={{ opacity: 0.12 }} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c - (score / 100) * c : c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: size * 0.26, lineHeight: 1, color: col, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {score}
            {showPercent && <Box component="span" sx={{ fontSize: '0.6em' }}>%</Box>}
          </Typography>
          {label && size >= 72 && (
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', mt: 0.25, lineHeight: 1.1 }}>{label}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
