import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge, Box, Drawer, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronLeftRounded, ChevronRightRounded, CloseRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { NAV_SECTIONS, SETTINGS_ITEM } from './nav';
import { useApp } from '../../context/AppContext';
import { profileStrength } from '../../lib/matching';

export const SIDEBAR_WIDTH = 264;
export const SIDEBAR_COLLAPSED = 76;

function NavItem({ item, collapsed, badge, onNavigate }) {
  const Icon = item.icon;
  const link = (
    <Box
      component={NavLink}
      to={item.to}
      onClick={onNavigate}
      sx={(theme) => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: 42,
        px: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 2.5,
        color: 'text.secondary',
        fontWeight: 500,
        fontSize: '0.875rem',
        transition: 'background-color .15s, color .15s',
        '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
        '&.active': {
          color: '#00e599',
          bgcolor: alpha('#00e599', theme.palette.mode === 'dark' ? 0.16 : 0.08),
          fontWeight: 700,
        },
        '&.active .nav-indicator': { opacity: 1 },
      })}
    >
      <Box className="nav-indicator" sx={{ position: 'absolute', left: -12, top: 10, bottom: 10, width: 3, borderRadius: 3, bgcolor: '#00e599', opacity: 0, transition: 'opacity .2s' }} />
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Badge color="error" variant={collapsed ? 'dot' : 'standard'} badgeContent={badge || 0} invisible={!badge} sx={{ '& .MuiBadge-badge': { display: collapsed ? 'block' : 'none' } }}>
          <Icon sx={{ fontSize: 21 }} />
        </Badge>
        {item.to === '/interview' && (
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              right: -10,
              bgcolor: '#ef4444',
              color: '#ffffff',
              fontSize: '8px',
              fontWeight: 900,
              px: 0.5,
              py: 0.1,
              borderRadius: '4px',
              lineHeight: 1,
              letterSpacing: 0.5,
            }}
          >
            NEW
          </Box>
        )}
      </Box>
      {!collapsed && (
        <>
          <Box component="span" sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
            {item.label}
          </Box>
          {badge > 0 && (
            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, px: 0.9, py: 0.2, borderRadius: 99, bgcolor: '#00e599', color: '#04271d' }}>
              {badge}
            </Box>
          )}
        </>
      )}
    </Box>
  );
  return collapsed ? (
    <Tooltip title={item.label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function SidebarContent({ collapsed, onToggleCollapse, onNavigate, onClose, isMobile }) {
  const { rankedJobs, hiddenJobs, trackedByJobId, contacts, profile, tracked } = useApp();
  const strength = profileStrength(profile, tracked.length, contacts.length);

  const badges = {
    jobs: rankedJobs.filter((j) => j.daysAgo <= 1 && !hiddenJobs.includes(j.id) && !trackedByJobId.has(j.id)).length,
    followups: contacts.filter((c) => c.followUp && new Date(c.followUp) <= new Date() && c.status !== 'meeting').length,
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: collapsed ? 1.5 : 2, py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', mb: 3, px: collapsed ? 0 : 0.5, minHeight: 40 }}>
        <Logo collapsed={collapsed} />
        {isMobile && (
          <IconButton onClick={onClose} aria-label="Close menu" size="small">
            <CloseRounded />
          </IconButton>
        )}
      </Box>

      <Box component="nav" aria-label="Main navigation" sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', mx: -0.5, px: 0.5 }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.title} sx={{ mb: 2.5 }}>
            {!collapsed ? (
              <Typography variant="overline" sx={{ px: 1.5, color: 'text.disabled', display: 'block', mb: 0.75 }}>
                {section.title}
              </Typography>
            ) : (
              <Box sx={{ height: 1, bgcolor: 'divider', mx: 1, mb: 1.5 }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} badge={badges[item.badgeKey]} onNavigate={onNavigate} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {!collapsed && (
        <Box
          component={NavLink}
          to="/profile"
          onClick={onNavigate}
          sx={{
            display: 'block',
            p: 1.75,
            mb: 1.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha('#a855f7', 0.08)})`,
            transition: 'border-color .2s',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={700}>
              Profile strength
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary">
              {strength.pct}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={strength.pct} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {strength.pct === 100 ? 'All set! Your matches are fully personalized.' : 'Complete your profile for better matches.'}
          </Typography>
        </Box>
      )}

      <NavItem item={SETTINGS_ITEM} collapsed={collapsed} onNavigate={onNavigate} />

      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', mt: 1 }}>
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton size="small" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} sx={{ border: '1px solid', borderColor: 'divider' }}>
              {collapsed ? <ChevronRightRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

export default function Sidebar({ isMobile, mobileOpen, onClose, collapsed, onToggleCollapse }) {
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, maxWidth: '85vw' } }}
      >
        <SidebarContent isMobile onNavigate={onClose} onClose={onClose} />
      </Drawer>
    );
  }

  return (
    <Box
      component={motion.aside}
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      sx={{
        position: 'fixed',
        inset: '0 auto 0 0',
        zIndex: (t) => t.zIndex.appBar + 1,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </Box>
  );
}
