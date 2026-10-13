import React, { memo } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FavoriteBorderRounded,
  FavoriteRounded,
  BlockRounded,
  AutoAwesomeRounded,
  LocationOnOutlined,
  AccessTimeRounded,
  HomeWorkOutlined,
  WorkOutlineRounded,
  MoreHorizRounded,
  CheckRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CompanyLogo from '../Common/CompanyLogo';
import { useApp } from '../../context/AppContext';

function JobCard({ job, trackedItem, hidden, onOpen, onSave, onApply, onHide, onUnhide }) {
  const { openCopilot } = useApp();
  const saved = trackedItem?.status === 'saved';
  const applied = trackedItem && trackedItem.status !== 'saved';
  const score = job.match?.score || 85;

  const isStrong = score >= 80;
  const isGood = score >= 60 && score < 80;
  const matchLabel = isStrong ? 'STRONG MATCH' : isGood ? 'GOOD MATCH' : 'FAIR MATCH';

  const handleAskOrion = (e) => {
    e.stopPropagation();
    openCopilot(`Tell me why I am a match for ${job.title} at ${job.company} and how I should tailor my resume for it.`);
  };

  return (
    <Card
      component={motion.article}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      onClick={() => onOpen(job)}
      sx={{
        p: { xs: 2, sm: 2.5 },
        cursor: 'pointer',
        borderRadius: 4,
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? '#243046' : '#e6edf5',
        bgcolor: 'background.paper',
        boxShadow: (t) => t.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(15,23,42,0.03)',
        transition: 'border-color .2s, box-shadow .2s',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, sm: 2.5 },
        position: 'relative',
        '&:hover': {
          borderColor: '#00e599',
          boxShadow: '0 8px 30px rgba(0,229,153,0.12)',
        },
      }}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(job)}
      aria-label={`${job.title} at ${job.company}, ${score}% match`}
    >
      {/* ── Left Content Section ── */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Row: Company Logo + Badges + Menu */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <CompanyLogo company={job.company} domain={job.domain} size={48} radius={12} />

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Tag Pills */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.75 }}>
              <Chip
                label={job.daysAgo === 0 ? 'Posted today' : `Reposted ${job.daysAgo * 12 + 8} hours ago`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                  color: '#059669',
                  borderRadius: 99,
                }}
              />
              <Chip
                label="Early applicant"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(14,165,233,0.15)' : '#f0f9ff',
                  color: '#0284c7',
                  borderRadius: 99,
                }}
              />
              {job.skills?.[0] && (
                <Chip
                  label={job.skills[0]}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                    color: '#b45309',
                    borderRadius: 99,
                  }}
                />
              )}
            </Box>

            {/* Job Title */}
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.05rem', sm: '1.25rem' },
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {job.title}
            </Typography>

            {/* Company & Industry metadata */}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              <b>{job.company}</b> / {job.industry || 'Technology'} · {job.companySize || 'Growth Stage'}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(job);
            }}
            aria-label="Job options"
            sx={{ color: 'text.secondary' }}
          >
            <MoreHorizRounded />
          </IconButton>
        </Box>

        {/* Metadata Details Row (Location, Type, Remote, Level) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 3 },
            color: 'text.secondary',
            fontSize: '0.875rem',
            my: 1.5,
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <LocationOnOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <span>{job.location || 'United States'}</span>
          </Box>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <AccessTimeRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
            <span>{job.type || 'Full-time'}</span>
          </Box>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <HomeWorkOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <span>{job.workModel || 'Remote'}</span>
          </Box>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <WorkOutlineRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
            <span>{job.level || 'Mid Level'}</span>
          </Box>
        </Box>

        {/* Bottom Actions Row: applicants count on left, action buttons on right */}
        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
            {job.applicants || '25+'} applicants
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Hide / Block Button */}
            <Tooltip title={hidden ? 'Unhide' : 'Not interested'}>
              <IconButton
                size="small"
                onClick={() => (hidden ? onUnhide(job.id) : onHide(job.id))}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main', borderColor: 'error.main' },
                }}
              >
                <BlockRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* Save / Heart Button */}
            <Tooltip title={saved ? 'Remove from saved' : 'Save job'}>
              <IconButton
                size="small"
                onClick={() => onSave(job)}
                sx={{
                  border: '1px solid',
                  borderColor: saved ? 'error.main' : 'divider',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  color: saved ? 'error.main' : 'text.secondary',
                  '&:hover': { color: 'error.main' },
                }}
              >
                {saved ? (
                  <FavoriteRounded sx={{ fontSize: 18, color: '#ef4444' }} />
                ) : (
                  <FavoriteBorderRounded sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>

            {/* ASK ORION (CareerFlow AI assistant for this job) */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoAwesomeRounded sx={{ color: '#059669', fontSize: '16px !important' }} />}
              onClick={handleAskOrion}
              sx={{
                borderRadius: 99,
                fontWeight: 700,
                fontSize: '0.775rem',
                color: 'text.primary',
                borderColor: 'divider',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                px: 1.75,
                height: 36,
                '&:hover': {
                  borderColor: '#00e599',
                  bgcolor: (t) => alpha('#00e599', 0.08),
                },
              }}
            >
              Ask Orion
            </Button>

            {/* APPLY WITH AUTOFILL (Signature Careerflow emerald pill button) */}
            <Button
              variant="contained"
              size="small"
              onClick={() => onApply(job)}
              disabled={applied}
              sx={{
                borderRadius: 99,
                fontWeight: 800,
                fontSize: '0.775rem',
                bgcolor: applied ? 'action.disabledBackground' : '#00e599',
                color: applied ? 'text.disabled' : '#042319',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                px: 2.25,
                height: 36,
                boxShadow: '0 4px 14px rgba(0,229,153,0.35)',
                '&:hover': {
                  bgcolor: '#00cc88',
                  boxShadow: '0 6px 18px rgba(0,229,153,0.45)',
                },
              }}
            >
              {applied ? 'Applied' : 'Apply with Autofill'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Right Column: Dark Signature Match Container ── */}
      <Box
        sx={{
          width: { xs: '100%', md: 175 },
          flexShrink: 0,
          borderRadius: 3.5,
          bgcolor: (t) => t.palette.mode === 'dark' ? '#041d15' : '#03231a',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Circular Glowing Match Ring */}
        <Box
          sx={{
            position: 'relative',
            width: 76,
            height: 76,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          {/* Outer circle track */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '4px solid rgba(0,229,153,0.2)',
            }}
          />
          {/* Glowing active border */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '4px solid #00e599',
              boxShadow: '0 0 16px rgba(0,229,153,0.5)',
              clipPath: score >= 90 ? 'none' : 'polygon(0 0, 100% 0, 100% 100%, 0 80%)',
            }}
          />
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {score}%
          </Typography>
        </Box>

        {/* Match label */}
        <Typography
          sx={{
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            mb: 1,
          }}
        >
          {matchLabel}
        </Typography>

        {/* H1B Sponsor badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: '#6ee7b7',
            fontSize: '0.725rem',
            fontWeight: 600,
          }}
        >
          <CheckRounded sx={{ fontSize: 14, color: '#34d399' }} />
          <span>{job.h1b ? 'H1B Sponsor Likely' : 'Remote Friendly'}</span>
        </Box>
      </Box>
    </Card>
  );
}

export default memo(JobCard);
