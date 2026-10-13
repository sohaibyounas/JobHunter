import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  MenuRounded, SearchRounded, NotificationsNoneRounded, DarkModeRounded, LightModeRounded, AutoAwesomeRounded,
  PersonRounded, SettingsRounded, RestartAltRounded, EventRounded, WorkRounded, EmojiEventsRounded,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { firstName, getInitials, timeAgo } from '../../data/helpers';
import Logo from './Logo';

export const HEADER_HEIGHT = 64;

function useNotifications() {
  const { contacts, rankedJobs, tracked, hiddenJobs, trackedByJobId } = useApp();
  return useMemo(() => {
    const list = [];
    contacts
      .filter((c) => c.followUp && new Date(c.followUp) <= new Date() && c.status !== 'meeting')
      .forEach((c) => list.push({ id: `f-${c.id}`, icon: <EventRounded />, color: '#f59e0b', title: `Follow up with ${c.name}`, body: `${c.role} at ${c.company}`, to: '/networking' }));
    const fresh = rankedJobs.filter((j) => j.daysAgo === 0 && !hiddenJobs.includes(j.id) && !trackedByJobId.has(j.id));
    if (fresh.length) {
      list.push({ id: 'new-jobs', icon: <WorkRounded />, color: '#6366f1', title: `${fresh.length} new job match${fresh.length > 1 ? 'es' : ''} today`, body: fresh.map((j) => j.company).join(', '), to: '/jobs' });
    }
    tracked
      .filter((t) => t.status === 'offer')
      .forEach((t) => list.push({ id: `o-${t.id}`, icon: <EmojiEventsRounded />, color: '#10b981', title: `Offer from ${t.company}`, body: `Updated ${timeAgo(t.updatedAt)}`, to: '/tracker' }));
    return list;
  }, [contacts, rankedJobs, tracked, hiddenJobs, trackedByJobId]);
}

export default function Header({ isMobile, onMenuClick, onOpenSearch }) {
  const navigate = useNavigate();
  const { profile, darkMode, toggleDarkMode, openCopilot, resetAllData } = useApp();
  const notifications = useNotifications();
  const [seen, setSeen] = useState(() => new Set());
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const unread = notifications.filter((n) => !seen.has(n.id)).length;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const go = (to) => {
    setNotifAnchor(null);
    setUserAnchor(null);
    navigate(to);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        bgcolor: (t) => alpha(t.palette.background.default, 0.8),
        backdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, gap: { xs: 0.5, sm: 1 }, px: { xs: 1.5, sm: 3 } }}>
        {isMobile && (
          <>
            <IconButton edge="start" onClick={onMenuClick} aria-label="Open navigation menu">
              <MenuRounded />
            </IconButton>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Logo />
            </Box>
          </>
        )}

        {/* Search trigger → command palette */}
        <Box
          component="button"
          type="button"
          onClick={onOpenSearch}
          aria-label="Search jobs, pages and actions"
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            width: 340,
            height: 40,
            px: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            font: 'inherit',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'border-color .15s',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <SearchRounded fontSize="small" />
          <Box component="span" sx={{ flexGrow: 1, textAlign: 'left' }}>
            Search jobs, tools, pages…
          </Box>
          <Box component="kbd" sx={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, px: 0.75, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            {isMac ? '⌘' : 'Ctrl'} K
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Search">
          <IconButton onClick={onOpenSearch} aria-label="Search" sx={{ display: { md: 'none' } }}>
            <SearchRounded />
          </IconButton>
        </Tooltip>

        <Button
          onClick={() => openCopilot()}
          startIcon={<AutoAwesomeRounded />}
          variant="outlined"
          size="small"
          sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: 99, px: 1.75, color: 'primary.main', borderColor: (t) => alpha(t.palette.primary.main, 0.4) }}
        >
          Ask AI
        </Button>

        <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            aria-haspopup="true"
          >
            <Badge badgeContent={unread} color="error" max={9}>
              <NotificationsNoneRounded />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton onClick={(e) => setUserAnchor(e.currentTarget)} aria-label="Account menu" aria-haspopup="true" sx={{ p: 0.5, ml: 0.5 }}>
          <Avatar src={profile.avatar || undefined} sx={{ width: 34, height: 34, fontSize: 14, fontWeight: 700, bgcolor: 'primary.main' }}>
            {getInitials(profile.name)}
          </Avatar>
        </IconButton>
      </Toolbar>

      {/* Notifications */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 340, maxWidth: 'calc(100vw - 24px)', mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">Notifications</Typography>
          {unread > 0 && (
            <Button size="small" onClick={() => setSeen(new Set(notifications.map((n) => n.id)))}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 0.5 }} />
        {notifications.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
            You're all caught up.
          </Typography>
        )}
        {notifications.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => {
              setSeen((s) => new Set(s).add(n.id));
              go(n.to);
            }}
            sx={{ alignItems: 'flex-start', gap: 1.5, py: 1.25, whiteSpace: 'normal' }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha(n.color, 0.14), color: n.color, flexShrink: 0, '& svg': { fontSize: 18 } }}>
              {n.icon}
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" fontWeight={seen.has(n.id) ? 500 : 700}>
                {n.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                {n.body}
              </Typography>
            </Box>
            {!seen.has(n.id) && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0 }} />}
          </MenuItem>
        ))}
      </Menu>

      {/* User menu */}
      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 240, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" noWrap>
            {profile.name || firstName(profile.name)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {profile.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => go('/profile')}>
          <ListItemIcon><PersonRounded fontSize="small" /></ListItemIcon>
          Resume & Profile
        </MenuItem>
        <MenuItem onClick={() => go('/settings')}>
          <ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setUserAnchor(null);
            if (window.confirm('Reset all data to the demo workspace? This cannot be undone.')) resetAllData();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><RestartAltRounded fontSize="small" color="error" /></ListItemIcon>
          Reset demo data
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
