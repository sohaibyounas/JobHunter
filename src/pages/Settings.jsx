import React from 'react';
import { Alert, Box, Button, Grid, Slider, Switch, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import {
  LightModeRounded, DarkModeRounded, SettingsBrightnessRounded, NotificationsRounded, FlagRounded, PaletteRounded,
  ShieldRounded, DownloadRounded, RestartAltRounded, AutoAwesomeRounded,
} from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import { useApp } from '../context/AppContext';
import { downloadText } from '../data/helpers';

function Row({ title, description, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', '&:first-of-type': { borderTop: 0, pt: 0 } }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

export default function Settings() {
  const { settings, updateSettings, exportData, resetAllData, notify } = useApp();
  const themeValue = settings.darkMode === null || settings.darkMode === undefined ? 'system' : settings.darkMode ? 'dark' : 'light';

  const toggle = (key, label) => (
    <Switch checked={Boolean(settings[key])} onChange={(e) => updateSettings({ [key]: e.target.checked })} inputProps={{ 'aria-label': label }} />
  );

  return (
    <Box>
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Changes save automatically on this device." />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Appearance" icon={<PaletteRounded fontSize="small" />}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Theme
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={themeValue}
              onChange={(_, v) => v && updateSettings({ darkMode: v === 'system' ? null : v === 'dark' })}
              aria-label="Theme"
            >
              <ToggleButton value="light" sx={{ gap: 1, fontWeight: 600 }}>
                <LightModeRounded fontSize="small" /> Light
              </ToggleButton>
              <ToggleButton value="dark" sx={{ gap: 1, fontWeight: 600 }}>
                <DarkModeRounded fontSize="small" /> Dark
              </ToggleButton>
              <ToggleButton value="system" sx={{ gap: 1, fontWeight: 600 }}>
                <SettingsBrightnessRounded fontSize="small" /> System
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ mt: 2 }}>
              <Row title="Compact sidebar" description="Show icons only on desktop">
                {toggle('sidebarCollapsed', 'Compact sidebar')}
              </Row>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Goals" icon={<FlagRounded fontSize="small" />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Weekly application goal
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary">
                {settings.weeklyGoal} / week
              </Typography>
            </Box>
            <Slider
              value={settings.weeklyGoal}
              min={1}
              max={40}
              marks={[{ value: 5 }, { value: 10 }, { value: 20 }, { value: 30 }]}
              valueLabelDisplay="auto"
              onChange={(_, v) => updateSettings({ weeklyGoal: v })}
              aria-label="Weekly application goal"
            />
            <Typography variant="caption" color="text.secondary">
              Most successful job seekers send 10–15 tailored applications per week.
            </Typography>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Notifications" icon={<NotificationsRounded fontSize="small" />}>
            <Row title="New job matches" description="Alert me when strong matches are posted">
              {toggle('jobAlerts', 'New job matches')}
            </Row>
            <Row title="Follow-up reminders" description="Remind me to follow up with contacts">
              {toggle('followUpReminders', 'Follow-up reminders')}
            </Row>
            <Row title="Weekly digest" description="A summary of your progress every Monday">
              {toggle('weeklyDigest', 'Weekly digest')}
            </Row>
            <Row title="Email notifications" description="Send updates to my email">
              {toggle('emailNotifications', 'Email notifications')}
            </Row>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="AI assistant" icon={<AutoAwesomeRounded fontSize="small" />}>
            <Row title="Smart suggestions" description="Show AI tips across the app">
              {toggle('aiSuggestions', 'Smart suggestions')}
            </Row>
            <Alert severity="info" sx={{ mt: 1.5 }}>
              AI features run on your device using your profile. Nothing is sent to a server.
            </Alert>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Your data" subtitle="Stored privately in this browser" icon={<ShieldRounded fontSize="small" />}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadRounded />}
                onClick={() => {
                  downloadText(`jobhunter-backup-${new Date().toISOString().slice(0, 10)}.json`, exportData());
                  notify('Backup downloaded');
                }}
              >
                Export my data
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RestartAltRounded />}
                onClick={() => window.confirm('Reset everything to the demo workspace? Your profile, tracker and contacts will be replaced.') && resetAllData()}
              >
                Reset to demo data
              </Button>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
