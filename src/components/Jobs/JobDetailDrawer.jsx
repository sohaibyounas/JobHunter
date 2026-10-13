import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, AvatarGroup, Box, Button, Chip, Divider, Drawer, IconButton, LinearProgress, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloseRounded, BookmarkBorderRounded, BookmarkRounded, AutoAwesomeRounded, DescriptionOutlined, EditNoteRounded,
  CheckCircleRounded, RadioButtonUncheckedRounded, LocationOnOutlined, PaidOutlined, WorkOutlineRounded, ScheduleRounded,
  BusinessRounded, GroupsRounded, VerifiedRounded, PeopleOutlineRounded, ArrowForwardRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CompanyLogo from '../Common/CompanyLogo';
import MatchRing from '../Common/MatchRing';
import { formatSalary, getInitials, timeAgo } from '../../data/helpers';
import { useApp } from '../../context/AppContext';

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Bar({ label, value, detail }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#6366f1' : '#f59e0b';
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ color }}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={value} sx={{ '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      {detail && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {detail}
        </Typography>
      )}
    </Box>
  );
}

const BulletList = ({ items }) => (
  <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.75, color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6 } }}>
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </Box>
);

export default function JobDetailDrawer({ job, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { trackedByJobId, toggleSaveJob, markApplied, openCopilot, contacts, profile } = useApp();

  if (!job) return null;
  const tracked = trackedByJobId?.get(job.id);
  const saved = tracked?.status === 'saved';
  const applied = tracked && tracked.status !== 'saved';
  const { match } = job;
  const insiders = (contacts || []).filter((c) => c?.company && job?.company && c.company.toLowerCase() === job.company.toLowerCase());
  const school = profile?.education?.[0]?.school;
  const alumniCount = (job.id * 7) % 9 + 2; // deterministic demo number

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <Drawer
      anchor={fullScreen ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: fullScreen ? '100%' : { sm: 560, lg: 620 },
          height: fullScreen ? '94vh' : '100%',
          borderTopLeftRadius: fullScreen ? 20 : 0,
          borderTopRightRadius: fullScreen ? 20 : 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      aria-labelledby="job-detail-title"
    >
      {fullScreen && <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1 }} />}

      {/* Header */}
      <Box sx={{ p: { xs: 2, sm: 3 }, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <CompanyLogo company={job.company} domain={job.domain} size={56} radius={14} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {job.company}
            </Typography>
            <Typography id="job-detail-title" variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.375rem' } }}>
              {job.title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close job details" sx={{ mt: -0.5, mr: -1 }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {[
            [<LocationOnOutlined key="l" />, job.location],
            [<WorkOutlineRounded key="w" />, `${job.workModel} · ${job.type}`],
            [<PaidOutlined key="p" />, formatSalary(job)],
            [<ScheduleRounded key="s" />, timeAgo(job.postedAt)],
            [<PeopleOutlineRounded key="a" />, `${job.applicants} applicants`],
          ].map(([icon, text]) => (
            <Chip key={text} icon={icon} label={text} size="small" variant="outlined" sx={{ '& .MuiChip-icon': { fontSize: 16 } }} />
          ))}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
        {/* Why this fits */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.25),
            background: `linear-gradient(135deg, ${alpha('#6366f1', 0.07)}, ${alpha('#10b981', 0.06)})`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MatchRing score={match.score} size={84} stroke={7} label="match" />
            <Box>
              <Typography variant="overline" color="primary">
                Why this job fits you
              </Typography>
              <Typography variant="h5">{match.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                You have {match.skills.matched.length} of {job.skills.length} key skills and {match.experience.years} years of experience.
              </Typography>
            </Box>
          </Box>
          <Bar label="Skills" value={match.skills.pct} detail={match.skills.missing.length ? `Missing: ${match.skills.missing.join(', ')}` : 'You match every listed skill'} />
          <Bar label="Experience level" value={match.experience.pct} detail={`${job.level} role · typically ${match.experience.need}+ years`} />
          <Bar label="Title & career goals" value={match.title.pct} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
            {job.skills.map((s) => {
              const ok = match.skills.matched.includes(s);
              return (
                <Chip
                  key={s}
                  size="small"
                  icon={ok ? <CheckCircleRounded /> : <RadioButtonUncheckedRounded />}
                  label={s}
                  sx={{
                    bgcolor: ok ? alpha('#10b981', 0.14) : 'background.paper',
                    color: ok ? 'success.dark' : 'text.secondary',
                    border: ok ? 0 : '1px dashed',
                    borderColor: 'divider',
                    '& .MuiChip-icon': { color: ok ? 'success.main' : 'text.disabled', fontSize: 15 },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* AI actions */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1, mb: 3 }}>
          <Button variant="outlined" startIcon={<DescriptionOutlined />} onClick={() => go(`/ai-tools/job-fit?job=${job.id}`)}>
            Tailor resume
          </Button>
          <Button variant="outlined" startIcon={<EditNoteRounded />} onClick={() => go(`/ai-tools/cover-letter?job=${job.id}`)}>
            Cover letter
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeRounded />}
            onClick={() => {
              onClose();
              openCopilot(`Which skills am I missing for ${job.title} at ${job.company}?`);
            }}
          >
            Ask AI
          </Button>
        </Box>

        <Section title="About the role">
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {job.description}
          </Typography>
        </Section>
        <Section title="Responsibilities">
          <BulletList items={job.responsibilities} />
        </Section>
        <Section title="Qualifications">
          <BulletList items={job.qualifications} />
        </Section>
        <Section title="Benefits">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {job.benefits.map((b) => (
              <Chip key={b} label={b} size="small" sx={{ bgcolor: 'background.subtle' }} />
            ))}
          </Box>
        </Section>

        <Divider sx={{ mb: 3 }} />

        <Section title="Company">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {[
              [<BusinessRounded key="i" />, 'Industry', job.industry],
              [<GroupsRounded key="s" />, 'Company size', job.companySize],
              [<VerifiedRounded key="h" />, 'H1B sponsorship', job.h1b ? 'Likely sponsors' : 'No record'],
            ].map(([icon, k, v]) => (
              <Box key={k} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'background.subtle' }}>
                <Box sx={{ color: 'primary.main', '& svg': { fontSize: 18 } }}>{icon}</Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {k}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        <Section title="Insider connections">
          <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {insiders.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 1.5 }}>
                {insiders.map((c) => (
                  <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'secondary.main' }}>{getInitials(c.name)}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.role} · {c.relationship}
                      </Typography>
                    </Box>
                    <Chip size="small" label="In your network" color="success" variant="outlined" />
                  </Box>
                ))}
              </Box>
            ) : null}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: 12 } }}>
                <Avatar sx={{ bgcolor: '#0ea5e9' }}>A</Avatar>
                <Avatar sx={{ bgcolor: '#f59e0b' }}>M</Avatar>
                <Avatar sx={{ bgcolor: '#10b981' }}>J</Avatar>
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                {alumniCount} people {school ? `from ${school.split(',')[0]}` : 'in your extended network'} work at {job.company}. A referral can boost your chances up to 10x.
              </Typography>
            </Box>
            <Button size="small" endIcon={<ArrowForwardRounded />} sx={{ mt: 1.5 }} onClick={() => go('/networking')}>
              Find people to contact
            </Button>
          </Box>
        </Section>
      </Box>

      {/* Sticky actions */}
      <Box sx={{ p: 2, pb: fullScreen ? 'max(16px, env(safe-area-inset-bottom))' : 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
        <Button
          variant="outlined"
          onClick={() => toggleSaveJob(job)}
          startIcon={saved || applied ? <BookmarkRounded /> : <BookmarkBorderRounded />}
          sx={{ flex: 1 }}
          disabled={applied}
        >
          {saved ? 'Saved' : applied ? 'Tracked' : 'Save'}
        </Button>
        <Button variant="contained" onClick={() => markApplied(job)} disabled={applied} sx={{ flex: 2 }}>
          {applied ? 'Applied ✓' : 'Mark as applied'}
        </Button>
      </Box>
    </Drawer>
  );
}
