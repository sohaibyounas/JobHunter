import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MoreHorizRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MOBILE_NAV } from './nav';

export const MOBILE_NAV_HEIGHT = 64;

/** Thumb-friendly bottom navigation for phones. */
export default function MobileNav({ onMore }) {
  const { pathname } = useLocation();
  const itemSx = {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.25,
    color: 'text.secondary',
    position: 'relative',
    '&.active': { color: 'primary.main' },
  };

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        height: `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        pb: 'env(safe-area-inset-bottom)',
        display: 'flex',
        bgcolor: (t) => alpha(t.palette.background.paper, 0.92),
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {MOBILE_NAV.map(({ to, label, icon: Icon }) => {
        const isActive = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <ButtonBase key={to} component={NavLink} to={to} sx={itemSx} aria-current={isActive ? 'page' : undefined}>
            {isActive && (
              <Box
                component={motion.span}
                layoutId="mobile-nav-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                sx={{ position: 'absolute', top: 8, width: 52, height: 30, borderRadius: 99, bgcolor: (t) => alpha(t.palette.primary.main, 0.12) }}
              />
            )}
            <Icon sx={{ fontSize: 22, position: 'relative' }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, position: 'relative' }}>{label}</Typography>
          </ButtonBase>
        );
      })}
      <ButtonBase onClick={onMore} sx={itemSx} aria-label="More pages">
        <MoreHorizRounded sx={{ fontSize: 22 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>More</Typography>
      </ButtonBase>
    </Box>
  );
}
