import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PaidRounded,
  TrendingUpRounded,
  LocationOnRounded,
  WorkRounded,
  BarChartRounded,
  ContentCopyRounded,
  LightbulbOutlined,
  ShieldRounded,
  AccountBalanceWalletRounded,
  AutoAwesomeRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import StatCard from '../components/Common/StatCard';
import MatchRing from '../components/Common/MatchRing';
import AIOutput from '../components/Common/AIOutput';
import { Stagger, MotionItem } from '../components/Common/motion';
import { useApp } from '../context/AppContext';
import { copyToClipboard } from '../data/helpers';

const ROLE_SALARY_BENCHMARKS = {
  'Frontend Developer': {
    Entry: { p10: 75, p25: 90, median: 110, p75: 135, p90: 155 },
    Mid: { p10: 105, p25: 125, median: 145, p75: 170, p90: 195 },
    Senior: { p10: 140, p25: 165, median: 190, p75: 225, p90: 260 },
    Lead: { p10: 175, p25: 205, median: 235, p75: 275, p90: 320 },
  },
  'Full Stack Developer': {
    Entry: { p10: 80, p25: 95, median: 115, p75: 140, p90: 160 },
    Mid: { p10: 110, p25: 130, median: 155, p75: 180, p90: 205 },
    Senior: { p10: 150, p25: 175, median: 205, p75: 240, p90: 280 },
    Lead: { p10: 185, p25: 215, median: 250, p75: 295, p90: 340 },
  },
  'Software Engineer': {
    Entry: { p10: 85, p25: 100, median: 120, p75: 145, p90: 170 },
    Mid: { p10: 115, p25: 138, median: 160, p75: 190, p90: 215 },
    Senior: { p10: 155, p25: 180, median: 210, p75: 250, p90: 290 },
    Lead: { p10: 190, p25: 225, median: 260, p75: 310, p90: 360 },
  },
};

const CITY_BENCHMARKS = [
  { city: 'San Francisco Bay Area', multiplier: 1.28, costIndex: 'High (+42%)', base: '$190k - $250k' },
  { city: 'New York City', multiplier: 1.22, costIndex: 'High (+38%)', base: '$180k - $240k' },
  { city: 'Seattle, WA', multiplier: 1.18, costIndex: 'Medium-High (+22%)', base: '$175k - $230k' },
  { city: 'Austin, TX', multiplier: 1.05, costIndex: 'Average (0% State Tax)', base: '$150k - $205k' },
  { city: 'Remote (US)', multiplier: 1.0, costIndex: 'Flexible Benchmark', base: '$145k - $200k' },
  { city: 'Chicago, IL', multiplier: 0.96, costIndex: 'Moderate (-12%)', base: '$140k - $190k' },
];

const NEGOTIATION_SCRIPTS = [
  {
    title: 'Polite Counter-Offer (Above Budget)',
    scenario: 'When the offer is slightly below your target range',
    script: `Thank you so much for extending this offer! I am genuinely thrilled about the opportunity to join the team and make an immediate impact on the product roadmap.\n\nBased on the market data for senior engineers in this role, the scope of the responsibilities we discussed, and my background leading high-scale frontend rebuilds, I was targeting a base salary closer to $175,000.\n\nIf we can bridge the gap to that number, I would be delighted to sign immediately. Is there flexibility on the base or perhaps the equity grant?`,
  },
  {
    title: 'Multiple Offers Leverage',
    scenario: 'When you are holding a competing offer',
    script: `I truly appreciate the offer to join your team — the company mission and engineering culture are my top choice.\n\nTo be fully transparent, I am currently navigating another active offer at $185,000 total compensation. Because your team is my top preference, if we can match or come closer to that total package, I am ready to close out my other conversations and accept right away.`,
  },
  {
    title: 'Equity & Bonus Counterbalance',
    scenario: 'When the company has a rigid base salary cap',
    script: `I understand that the base salary band is capped at $155,000 for this role. Given that constraint, could we explore flexibility in the signing bonus or an increased equity grant to help close the gap toward my total compensation target of $180,000?`,
  },
];

export default function SalaryInsights() {
  const { profile, notify } = useApp();
  const [selectedRole, setSelectedRole] = useState(
    profile?.preferences?.roles?.[0] || 'Frontend Developer'
  );
  const [experienceLevel, setExperienceLevel] = useState(
    profile?.preferences?.level || 'Senior'
  );
  const [tab, setTab] = useState(0);

  const roleKey = ROLE_SALARY_BENCHMARKS[selectedRole]
    ? selectedRole
    : 'Frontend Developer';
  const roleData = ROLE_SALARY_BENCHMARKS[roleKey]?.[experienceLevel] || {
    p10: 130,
    p25: 155,
    median: 180,
    p75: 215,
    p90: 250,
  };

  const userMin = profile?.preferences?.salaryMin || 130;
  const userPercentile = useMemo(() => {
    if (userMin <= roleData.p10) return 10;
    if (userMin <= roleData.p25) return 25;
    if (userMin <= roleData.median) return 50;
    if (userMin <= roleData.p75) return 75;
    return 90;
  }, [userMin, roleData]);

  const upside = Math.max(0, roleData.median - userMin);

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        eyebrow="Compensation intelligence"
        title="Salary & Market Insights"
        subtitle="Benchmark your compensation against real verified industry roles, identify potential upside, and master negotiation scripts."
      />

      <Stagger delay={0.05}>
        {/* Top KPI Cards */}
        <MotionItem>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, sm: 2 },
              mb: 3,
            }}
          >
            <StatCard
              label="Market Median"
              value={`$${roleData.median}k`}
              icon={<PaidRounded />}
              color="#6366f1"
              hint={`For ${experienceLevel} ${roleKey}`}
            />
            <StatCard
              label="Your Stated Min"
              value={`$${userMin}k`}
              icon={<AccountBalanceWalletRounded />}
              color="#3b82f6"
              hint={`${userPercentile}th percentile mark`}
            />
            <StatCard
              label="Median Upside"
              value={`+$${upside}k`}
              icon={<TrendingUpRounded />}
              color="#10b981"
              hint="Room to negotiate upward"
            />
            <StatCard
              label="Top 90th Percentile"
              value={`$${roleData.p90}k+`}
              icon={<ShieldRounded />}
              color="#f59e0b"
              hint="Elite compensation bands"
            />
          </Box>
        </MotionItem>

        {/* Filter bar */}
        <MotionItem>
          <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Benchmark Role"
                  value={roleKey}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {Object.keys(ROLE_SALARY_BENCHMARKS).map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Seniority Level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  {['Entry', 'Mid', 'Senior', 'Lead'].map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {lvl} Level
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    border: '1px solid',
                    borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <AutoAwesomeRounded color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Based on verified postings matching your profile skills: <b>React, TypeScript, AWS</b>.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </MotionItem>

        {/* Main Content Tabs */}
        <MotionItem>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
              <Tab icon={<BarChartRounded />} iconPosition="start" label="Salary Distribution" />
              <Tab icon={<LocationOnRounded />} iconPosition="start" label="Metro Hub Comparison" />
              <Tab icon={<LightbulbOutlined />} iconPosition="start" label="Negotiation Playbook" />
            </Tabs>
          </Box>
        </MotionItem>

        {/* Tab 1: Distribution */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <SectionCard
                title={`Compensation Bands · ${roleKey} (${experienceLevel})`}
                subtitle="Distribution breakdown across 250+ recent tech openings"
                icon={<BarChartRounded fontSize="small" />}
              >
                {/* Visual Distribution Bars */}
                <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {[
                    { label: '10th Percentile (Entry band)', val: roleData.p10, pct: 20, color: '#94a3b8' },
                    { label: '25th Percentile (Conservative)', val: roleData.p25, pct: 40, color: '#60a5fa' },
                    { label: '50th Percentile (Market Median)', val: roleData.median, pct: 65, color: '#6366f1' },
                    { label: '75th Percentile (Competitive)', val: roleData.p75, pct: 85, color: '#10b981' },
                    { label: '90th Percentile (Top Tier/FAANG)', val: roleData.p90, pct: 100, color: '#f59e0b' },
                  ].map((tier) => {
                    const isNearUser = Math.abs(tier.val - userMin) <= 15;
                    return (
                      <Box key={tier.label}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {tier.label}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={700}>
                            ${tier.val},000/yr
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 24,
                            borderRadius: 2,
                            bgcolor: 'background.subtle',
                            p: 0.5,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component={motion.div}
                            initial={{ width: 0 }}
                            animate={{ width: `${tier.pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            sx={{
                              height: '100%',
                              borderRadius: 1.5,
                              bgcolor: tier.color,
                            }}
                          />
                        </Box>
                        {isNearUser && (
                          <Chip
                            size="small"
                            label={`Your current min preference ($${userMin}k)`}
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.75, height: 22, fontSize: '0.725rem' }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>

                <Alert severity="info" icon={<LightbulbOutlined />} sx={{ mt: 2 }}>
                  Your stated minimum is <b>${userMin}k</b>. Candidates with your verified stack in {experienceLevel} roles routinely negotiate between <b>${roleData.median}k - ${roleData.p75}k</b>.
                </Alert>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <SectionCard title="Component Breakdown" subtitle="Standard total compensation structure">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.subtle' }}>
                      <Typography variant="caption" color="text.secondary">
                        Base Salary
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        75% - 85%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Guaranteed bi-weekly cash compensation
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.subtle' }}>
                      <Typography variant="caption" color="text.secondary">
                        Stock / Equity (RSUs)
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="secondary.main">
                        10% - 20%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vested over 4 years with 1-year cliff
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.subtle' }}>
                      <Typography variant="caption" color="text.secondary">
                        Performance Bonus
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        5% - 15%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Discretionary annual company multiplier
                      </Typography>
                    </Box>
                  </Box>
                </SectionCard>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Metro Hubs */}
        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SectionCard
                title="Geographic Cost of Living & Salary Index"
                subtitle="Adjustments relative to national remote benchmarks"
                icon={<LocationOnRounded fontSize="small" />}
              >
                <Grid container spacing={2}>
                  {CITY_BENCHMARKS.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.city}>
                      <Card
                        sx={{
                          p: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {item.city}
                          </Typography>
                          <Chip
                            size="small"
                            label={`x${item.multiplier}`}
                            color={item.multiplier > 1.1 ? 'primary' : 'default'}
                            variant={item.multiplier > 1.1 ? 'filled' : 'outlined'}
                          />
                        </Box>
                        <Typography variant="h5" color="primary.main" fontWeight={700} sx={{ my: 1 }}>
                          {item.base}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                          Cost index: <b>{item.costIndex}</b>
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Scripts */}
        {tab === 2 && (
          <Grid container spacing={3}>
            {NEGOTIATION_SCRIPTS.map((script, idx) => (
              <Grid item xs={12} md={4} key={script.title}>
                <Card
                  sx={{
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {script.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                    {script.scenario}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.subtle',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                      flexGrow: 1,
                      whiteSpace: 'pre-wrap',
                      mb: 2,
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {script.script}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopyRounded />}
                    onClick={() => {
                      copyToClipboard(script.script);
                      notify('Negotiation script copied to clipboard!');
                    }}
                  >
                    Copy Script
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stagger>
    </Box>
  );
}

