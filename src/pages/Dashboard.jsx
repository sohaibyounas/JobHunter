import React, { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, ButtonBase, Card, Chip, Grid, LinearProgress, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  BookmarkRounded, SendRounded, ForumRounded, EmojiEventsRounded, ArrowForwardRounded, AddRounded, CheckCircleRounded,
  RadioButtonUncheckedRounded, DescriptionOutlined, EditNoteRounded, LinkedIn, RecordVoiceOverRounded, CampaignRounded,
  EventRounded, TravelExploreRounded, InsightsRounded, TaskAltRounded, AutoAwesomeRounded, ArticleOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import StatCard from '../components/Common/StatCard';
import SectionCard from '../components/Common/SectionCard';
import CompanyLogo from '../components/Common/CompanyLogo';
import MatchRing from '../components/Common/MatchRing';
import { MotionItem, Stagger } from '../components/Common/motion';
import { STATUSES, statusMeta, useApp } from '../context/AppContext';
import { daysUntil, firstName, formatDate, formatSalary, getInitials, greeting, timeAgo } from '../data/helpers';
import { profileStrength } from '../lib/matching';

const AI_TOOLS = [
  { to: '/ai-tools/job-fit', label: 'Resume ATS check', icon: <DescriptionOutlined />, color: '#6366f1' },
  { to: '/ai-tools/cover-letter', label: 'Cover letter', icon: <EditNoteRounded />, color: '#0ea5e9' },
  { to: '/ai-tools/linkedin', label: 'LinkedIn optimizer', icon: <LinkedIn />, color: '#0a66c2' },
  { to: '/ai-tools/pitch', label: 'Elevator pitch', icon: <CampaignRounded />, color: '#f59e0b' },
  { to: '/interview', label: 'Mock interview', icon: <RecordVoiceOverRounded />, color: '#10b981' },
  { to: '/ai-tools/resume', label: 'Resume builder', icon: <ArticleOutlined />, color: '#ec4899' },
  { to: '/salary', label: 'Salary insights', icon: <InsightsRounded />, color: '#8b5cf6' },
  { to: '/skills', label: 'Skills gap analysis', icon: <TravelExploreRounded />, color: '#14b8a6' },
  { to: '/timeline', label: 'Career timeline', icon: <EventRounded />, color: '#f97316' },
];

function ActivityChart({ tracked }) {
  const days = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      out.push({ date: d, count: 0 });
    }
    tracked.forEach((t) =>
      (t.history || []).forEach((h) => {
        const hd = new Date(h.at);
        hd.setHours(0, 0, 0, 0);
        const slot = out.find((o) => o.date.getTime() === hd.getTime());
        if (slot) slot.count += 1;
      }),
    );
    return out;
  }, [tracked]);
  const max = Math.max(3, ...days.map((d) => d.count));
  const total = days.reduce((a, d) => a + d.count, 0);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <b>{total}</b> pipeline updates in the last 14 days
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 1 }, height: 140 }} role="img" aria-label={`Activity chart, ${total} updates in 14 days`}>
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          return (
            <Tooltip key={d.date.toISOString()} title={`${formatDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.count} update${d.count === 1 ? '' : 's'}`}>
              <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 0.75 }}>
                <Box
                  component={motion.div}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    width: '100%',
                    maxWidth: 28,
                    borderRadius: 1.5,
                    background: d.count ? (isToday ? 'linear-gradient(180deg,#a855f7,#6366f1)' : (t) => alpha(t.palette.primary.main, 0.55)) : (t) => t.palette.action.hover,
                  }}
                />
                <Typography sx={{ fontSize: 10, color: isToday ? 'primary.main' : 'text.disabled', fontWeight: isToday ? 700 : 500 }}>
                  {d.date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

function Funnel({ tracked }) {
  const counts = STATUSES.map((s) => ({ ...s, n: tracked.filter((t) => t.status === s.id || (t.history || []).some((h) => h.status === s.id)).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {counts.map((c, i) => (
        <Box key={c.id} sx={{ display: 'grid', gridTemplateColumns: '92px 1fr 28px', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {c.label}
          </Typography>
          <Box sx={{ height: 10, borderRadius: 99, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box component={motion.div} initial={{ width: 0 }} animate={{ width: `${(c.n / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }} sx={{ height: '100%', borderRadius: 99, bgcolor: c.color }} />
          </Box>
          <Typography variant="body2" fontWeight={700} textAlign="right">
            {c.n}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, tracked, rankedJobs, hiddenJobs, trackedByJobId, contacts, settings } = useApp();

  const count = (id) => tracked.filter((t) => t.status === id).length;
  const topMatches = rankedJobs.filter((j) => !hiddenJobs.includes(j.id) && !trackedByJobId.has(j.id)).slice(0, 4);
  const newToday = rankedJobs.filter((j) => j.daysAgo === 0 && !hiddenJobs.includes(j.id)).length;
  const strength = profileStrength(profile, tracked.length, contacts.length);

  const weekAgo = Date.now() - 7 * 86_400_000;
  const appliedThisWeek = tracked.filter((t) => (t.history || []).some((h) => h.status === 'applied' && new Date(h.at).getTime() >= weekAgo)).length;
  const goal = Math.max(1, settings.weeklyGoal || 10);
  const goalPct = Math.min(100, Math.round((appliedThisWeek / goal) * 100));

  const followUps = contacts
    .filter((c) => c.followUp && c.status !== 'meeting')
    .map((c) => ({ ...c, due: daysUntil(c.followUp) }))
    .filter((c) => c.due !== null && c.due <= 3)
    .sort((a, b) => a.due - b.due)
    .slice(0, 4);

  const activity = tracked
    .flatMap((t) => (t.history || []).map((h) => ({ ...h, item: t })))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Stagger delay={0.06}>
      {/* Hero */}
      <MotionItem>
        <Card
          sx={{
            mb: 3,
            p: { xs: 2.5, sm: 3.5 },
            border: 0,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)',
          }}
        >
          <Box sx={{ position: 'absolute', right: -80, top: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.18), transparent 70%)' }} />
          <Box sx={{ position: 'absolute', left: '40%', bottom: -120, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,.45), transparent 70%)' }} />
          <Box sx={{ position: 'relative', display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flexGrow: 1, width: '100%' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                {today}
              </Typography>
              <Typography variant="h2" component="h1" sx={{ color: '#fff', fontSize: { xs: '1.6rem', sm: '2rem' }, mb: 1 }}>
                {greeting()}, {firstName(profile.name)} 👋
              </Typography>
              <Typography sx={{ opacity: 0.9, maxWidth: 560, mb: 2.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {newToday > 0 ? `${newToday} new job match${newToday > 1 ? 'es' : ''} arrived today` : 'Your matches are up to date'}
                {followUps.length > 0 ? ` and ${followUps.length} follow-up${followUps.length > 1 ? 's are' : ' is'} coming up.` : '.'} Keep the momentum going!
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button component={RouterLink} to="/jobs" variant="contained" endIcon={<ArrowForwardRounded />} sx={{ bgcolor: '#fff', color: '#312e81', backgroundImage: 'none', '&:hover': { bgcolor: '#eef2ff', backgroundImage: 'none' } }}>
                  View job matches
                </Button>
                <Button component={RouterLink} to="/tracker?new=1" startIcon={<AddRounded />} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.35)', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}>
                  Track a job
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 4, bgcolor: 'rgba(255,255,255,.1)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.18)', alignSelf: { xs: 'stretch', md: 'center' }, flexShrink: 0 }}>
              <Box sx={{ color: 'rgba(255,255,255,.95)' }}>
                <MatchRing score={goalPct} size={84} stroke={8} color="#a7f3d0" />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8 }}>
                  Weekly goal
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                  {appliedThisWeek} / {goal}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  applications this week
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </MotionItem>

      {/* KPIs */}
      <MotionItem>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <StatCard label="Saved" value={count('saved')} icon={<BookmarkRounded />} color="#8b5cf6" hint="Ready to apply" onClick={() => navigate('/tracker')} />
          <StatCard label="Applied" value={count('applied')} icon={<SendRounded />} color="#3b82f6" hint="Awaiting response" onClick={() => navigate('/tracker')} />
          <StatCard label="Interviews" value={count('interview')} icon={<ForumRounded />} color="#f59e0b" hint="In progress" onClick={() => navigate('/tracker')} />
          <StatCard label="Offers" value={count('offer')} icon={<EmojiEventsRounded />} color="#10b981" hint={count('offer') ? 'Congratulations!' : 'You got this'} onClick={() => navigate('/tracker')} />
        </Box>
      </MotionItem>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            <MotionItem>
              <SectionCard
                title="Top matches for you"
                subtitle="Ranked by skills, experience and goals"
                icon={<TravelExploreRounded fontSize="small" />}
                action={
                  <Button size="small" component={RouterLink} to="/jobs" endIcon={<ArrowForwardRounded />}>
                    See all
                  </Button>
                }
                contentSx={{ px: { xs: 1, sm: 1.5 } }}
              >
                {topMatches.map((job) => (
                  <ButtonBase
                    key={job.id}
                    onClick={() => navigate(`/jobs?job=${job.id}`)}
                    sx={{ width: '100%', display: 'flex', gap: 1.5, alignItems: 'center', textAlign: 'left', p: { xs: 1, sm: 1.25 }, borderRadius: 3, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <CompanyLogo company={job.company} domain={job.domain} size={42} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {job.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {job.company} · {job.workModel} · {formatSalary(job)}
                      </Typography>
                    </Box>
                    {job.daysAgo === 0 && <Chip label="New" size="small" color="success" sx={{ display: { xs: 'none', sm: 'flex' } }} />}
                    <MatchRing score={job.match.score} size={46} stroke={4.5} />
                  </ButtonBase>
                ))}
              </SectionCard>
            </MotionItem>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} md={7}>
                <MotionItem style={{ height: '100%' }}>
                  <SectionCard title="Activity" subtitle="Last 14 days" icon={<InsightsRounded fontSize="small" />}>
                    <ActivityChart tracked={tracked} />
                  </SectionCard>
                </MotionItem>
              </Grid>
              <Grid item xs={12} md={5}>
                <MotionItem style={{ height: '100%' }}>
                  <SectionCard title="Pipeline" subtitle="Jobs that reached each stage" icon={<TaskAltRounded fontSize="small" />}>
                    <Funnel tracked={tracked} />
                  </SectionCard>
                </MotionItem>
              </Grid>
            </Grid>

            <MotionItem>
              <SectionCard title="AI career tools" subtitle="Everything you need to stand out" icon={<AutoAwesomeRounded fontSize="small" />}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.25 }}>
                  {AI_TOOLS.map((t) => (
                    <ButtonBase
                      key={t.to}
                      component={RouterLink}
                      to={t.to}
                      sx={{
                        justifyContent: 'flex-start',
                        gap: 1.25,
                        p: 1.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'left',
                        transition: 'all .2s',
                        '&:hover': { borderColor: t.color, bgcolor: alpha(t.color, 0.06), transform: 'translateY(-2px)' },
                      }}
                    >
                      <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha(t.color, 0.12), color: t.color, flexShrink: 0, '& svg': { fontSize: 19 } }}>
                        {t.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.25 }}>
                        {t.label}
                      </Typography>
                    </ButtonBase>
                  ))}
                </Box>
              </SectionCard>
            </MotionItem>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            <MotionItem>
              <SectionCard title="Profile strength" subtitle={`${strength.items.filter((i) => i.done).length} of ${strength.items.length} steps done`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <LinearProgress variant="determinate" value={strength.pct} sx={{ flexGrow: 1, height: 8 }} />
                  <Typography variant="subtitle2" color="primary">
                    {strength.pct}%
                  </Typography>
                </Box>
                {strength.items.map((i) => (
                  <ButtonBase
                    key={i.key}
                    component={RouterLink}
                    to={i.to}
                    sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.25, py: 0.85, px: 1, mx: -1, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    {i.done ? <CheckCircleRounded sx={{ fontSize: 20, color: 'success.main' }} /> : <RadioButtonUncheckedRounded sx={{ fontSize: 20, color: 'text.disabled' }} />}
                    <Typography variant="body2" sx={{ color: i.done ? 'text.secondary' : 'text.primary', textDecoration: i.done ? 'line-through' : 'none', flexGrow: 1, textAlign: 'left' }}>
                      {i.label}
                    </Typography>
                    {!i.done && <ArrowForwardRounded sx={{ fontSize: 16, color: 'text.disabled' }} />}
                  </ButtonBase>
                ))}
              </SectionCard>
            </MotionItem>

            <MotionItem>
              <SectionCard
                title="Follow-ups"
                subtitle="Due in the next 3 days"
                action={
                  <Button size="small" component={RouterLink} to="/networking">
                    All
                  </Button>
                }
              >
                {followUps.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No follow-ups due. Nice work staying on top of your network!
                  </Typography>
                ) : (
                  followUps.map((c) => (
                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'secondary.main' }}>{getInitials(c.name)}</Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {c.role} · {c.company}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={c.due < 0 ? `${-c.due}d overdue` : c.due === 0 ? 'Today' : `In ${c.due}d`}
                        color={c.due < 0 ? 'error' : c.due === 0 ? 'warning' : 'default'}
                        variant={c.due <= 0 ? 'filled' : 'outlined'}
                      />
                    </Box>
                  ))
                )}
              </SectionCard>
            </MotionItem>

            <MotionItem>
              <SectionCard title="Recent activity">
                {activity.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Activity will appear here as you track jobs.
                  </Typography>
                )}
                <Box sx={{ position: 'relative' }}>
                  {activity.map((a, i) => {
                    const s = statusMeta(a.status);
                    return (
                      <Box key={`${a.item.id}-${a.at}`} sx={{ display: 'flex', gap: 1.5, pb: i === activity.length - 1 ? 0 : 2, position: 'relative' }}>
                        {i < activity.length - 1 && <Box sx={{ position: 'absolute', left: 5, top: 16, bottom: 0, width: 2, bgcolor: 'divider' }} />}
                        <Box sx={{ width: 12, height: 12, mt: 0.5, borderRadius: '50%', bgcolor: s.color, boxShadow: (t) => `0 0 0 3px ${t.palette.background.paper}`, flexShrink: 0, zIndex: 1 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                            <b>{s.label}</b> · {a.item.title} at {a.item.company}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {timeAgo(a.at)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </SectionCard>
            </MotionItem>
          </Box>
        </Grid>
      </Grid>
    </Stagger>
  );
}
