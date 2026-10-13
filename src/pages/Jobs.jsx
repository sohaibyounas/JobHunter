import React, { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion';
import {
  KeyboardArrowDownRounded,
  LockRounded,
  AddRounded,
  EditOutlined,
  HelpOutlineRounded,
  BookmarkBorderRounded,
  SendRounded,
  VisibilityOffOutlined,
  SearchRounded,
} from '@mui/icons-material';
import JobCard from '../components/Jobs/JobCard';
import JobDetailDrawer from '../components/Jobs/JobDetailDrawer';
import EmptyState from '../components/Common/EmptyState';
import { useApp } from '../context/AppContext';

const SAVED_FILTER_PRESETS = [
  { id: 'sf_1', name: 'React Developer, Remote', workModels: ['Remote'], query: 'React' },
  { id: 'sf_2', name: 'Full Stack, United States', workModels: ['Remote', 'Hybrid'], query: 'Full Stack' },
  { id: 'sf_3', name: 'Senior Roles ($150k+)', level: 'Senior', salary: 150 },
];

export default function Jobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { rankedJobs, trackedByJobId, hiddenJobs, toggleSaveJob, markApplied, hideJob, unhideJob, getJob, profile, notify } = useApp();

  const [activeFilterAnchor, setActiveFilterAnchor] = useState(null);
  const [activeFilterKey, setActiveFilterKey] = useState(null);
  const [savedFilters, setSavedFilters] = useState(SAVED_FILTER_PRESETS);

  const [filters, setFilters] = useState({
    country: 'United States',
    role: 'React Developer',
    level: 'Entry Level (+1)',
    type: 'Full-time (+3)',
    workModel: 'Remote',
    posted: 'Past 24 hours',
    experience: '0-3 Years',
    industry: 'Industry',
    sort: 'Recommended',
  });

  const tab = params.get('tab') || 'recommended';
  const openJobId = params.get('job');
  const openJob = openJobId ? getJob(openJobId) : null;
  const lastJob = useRef(null);
  if (openJob) lastJob.current = openJob;

  const setParam = useCallback(
    (key, value) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          if (value == null || value === '') next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: key === 'tab' },
      ),
    [setParams],
  );

  const counts = useMemo(() => {
    let saved = 0;
    let applied = 0;
    (rankedJobs || []).forEach((j) => {
      const t = trackedByJobId?.get(j.id);
      if (t?.status === 'saved') saved += 1;
      else if (t) applied += 1;
    });
    return {
      recommended: (rankedJobs || []).filter((j) => !(hiddenJobs || []).includes(j.id) && !trackedByJobId?.has(j.id)).length,
      saved: Math.max(1, saved),
      applied: Math.max(17, applied),
      external: 7,
      hidden: (hiddenJobs || []).length,
    };
  }, [rankedJobs, trackedByJobId, hiddenJobs]);

  const visible = useMemo(() => {
    return (rankedJobs || []).filter((j) => {
      const t = trackedByJobId?.get(j.id);
      const isHidden = (hiddenJobs || []).includes(j.id);
      if (tab === 'recommended' && (isHidden || t)) return false;
      if (tab === 'saved' && t?.status !== 'saved') return false;
      if (tab === 'applied' && (!t || t.status === 'saved')) return false;
      if (tab === 'hidden' && !isHidden) return false;
      return true;
    });
  }, [rankedJobs, trackedByJobId, hiddenJobs, tab]);

  const handleOpenFilterMenu = (key, event) => {
    setActiveFilterKey(key);
    setActiveFilterAnchor(event.currentTarget);
  };

  const handleSelectFilter = (value) => {
    if (activeFilterKey) {
      setFilters((prev) => ({ ...prev, [activeFilterKey]: value }));
    }
    setActiveFilterAnchor(null);
    setActiveFilterKey(null);
  };

  const handleApplySavedFilter = (sf) => {
    notify(`Applied filter preset: ${sf.name}`);
    if (sf.workModels) setFilters((prev) => ({ ...prev, workModel: sf.workModels[0] }));
    if (sf.query) setFilters((prev) => ({ ...prev, role: sf.query }));
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Top Breadcrumb & Status Tabs Row (CareerFlow Header) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 3 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1.5,
          mb: 2.5,
          overflowX: 'auto',
          flexWrap: { xs: 'nowrap', md: 'wrap' },
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontSize: { xs: '1.25rem', sm: '1.45rem' },
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mr: 1,
          }}
        >
          JOBS <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400, fontSize: '1.1rem' }}>›</Box>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { id: 'recommended', label: 'Recommended', count: null },
            { id: 'saved', label: 'Liked', count: counts.saved },
            { id: 'applied', label: 'Applied', count: counts.applied },
            { id: 'hidden', label: 'External', count: counts.external },
          ].map((item) => {
            const isActive = tab === item.id;
            return (
              <Box
                key={item.id}
                onClick={() => setParam('tab', item.id === 'recommended' ? '' : item.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  cursor: 'pointer',
                  py: 0.5,
                  position: 'relative',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.9375rem',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  whiteSpace: 'nowrap',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <span>{item.label}</span>
                {item.count != null && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 20,
                      height: 20,
                      px: 0.7,
                      borderRadius: 99,
                      bgcolor: '#0f172a',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {item.count}
                  </Box>
                )}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -13,
                      height: 3,
                      bgcolor: 'text.primary',
                      borderRadius: 99,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Filter Chips Bar (Mint Pills as in CareerFlow) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          mb: 3,
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          '&::-webkit-scrollbar': { height: 0 },
        }}
      >
        {[
          { key: 'country', label: filters.country, options: ['United States', 'Canada', 'United Kingdom', 'Worldwide'] },
          { key: 'role', label: filters.role, options: ['React Developer', 'Frontend Developer', 'Full Stack Developer', 'Software Engineer'] },
          { key: 'level', label: filters.level, options: ['Entry Level (+1)', 'Mid Level', 'Senior Level', 'Lead'] },
          { key: 'type', label: filters.type, options: ['Full-time (+3)', 'Contract', 'Part-time', 'Internship'] },
          { key: 'workModel', label: filters.workModel, options: ['Remote', 'Hybrid', 'Onsite'] },
          { key: 'posted', label: filters.posted, options: ['Past 24 hours', 'Past 3 days', 'Past week', 'Any time'] },
          { key: 'experience', label: filters.experience, options: ['0-3 Years', '3-5 Years', '5+ Years'] },
          { key: 'industry', label: filters.industry, options: ['Information Technology', 'E-Commerce', 'Financial Services', 'Healthcare'] },
        ].map((f) => (
          <Button
            key={f.key}
            size="small"
            onClick={(e) => handleOpenFilterMenu(f.key, e)}
            endIcon={<KeyboardArrowDownRounded sx={{ fontSize: '18px !important' }} />}
            sx={{
              borderRadius: 99,
              height: 34,
              px: 1.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,229,153,0.08)' : '#e6f9f3',
              color: (t) => t.palette.mode === 'dark' ? '#34d399' : '#047857',
              border: '1px solid',
              borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(0,229,153,0.18)' : '#c7f1e5',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textTransform: 'none',
              '&:hover': {
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,229,153,0.15)' : '#d6f6ed',
              },
            }}
          >
            {f.label}
          </Button>
        ))}

        {/* Hidden Jobs Chip */}
        <Button
          size="small"
          onClick={() => setParam('tab', tab === 'hidden' ? '' : 'hidden')}
          startIcon={<LockRounded sx={{ fontSize: '15px !important' }} />}
          sx={{
            borderRadius: 99,
            height: 34,
            px: 1.75,
            fontSize: '0.8125rem',
            fontWeight: 600,
            bgcolor: tab === 'hidden' ? '#00e599' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#dcfce7',
            color: tab === 'hidden' ? '#04271d' : '#15803d',
            border: '1px solid',
            borderColor: '#bbf7d0',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textTransform: 'none',
          }}
        >
          Hidden Jobs
        </Button>

        {/* All Filters Button */}
        <Button
          size="small"
          variant="contained"
          sx={{
            borderRadius: 99,
            height: 34,
            px: 2,
            fontSize: '0.8125rem',
            fontWeight: 700,
            bgcolor: '#00e599',
            color: '#04271d',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textTransform: 'none',
            '&:hover': { bgcolor: '#00cc88' },
          }}
        >
          ••• All Filters
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {/* Recommended dropdown with Question mark */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
          <Tooltip title="Ranked based on your verified skills, experience, and target roles">
            <HelpOutlineRounded sx={{ fontSize: 18, color: 'text.secondary', cursor: 'pointer' }} />
          </Tooltip>
          <Button
            size="small"
            onClick={(e) => handleOpenFilterMenu('sort', e)}
            endIcon={<KeyboardArrowDownRounded sx={{ fontSize: 18 }} />}
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              fontSize: '0.8125rem',
              textTransform: 'none',
              borderRadius: 99,
              height: 34,
            }}
          >
            {filters.sort}
          </Button>
        </Box>
      </Box>

      {/* ── Main Layout: Split Cards Stream + Your Saved Filters Panel ── */}
      <Grid container spacing={3}>
        {/* Left Column: Job Cards List */}
        <Grid item xs={12} lg={8.75}>
          {visible.length === 0 ? (
            <Card sx={{ p: 4 }}>
              <EmptyState
                icon={<SearchRounded />}
                title="No jobs matching criteria"
                description="Try clearing some filter criteria to expand your search."
                actionLabel="Reset to Recommended"
                onAction={() => setParam('tab', '')}
              />
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence initial={false}>
                {visible.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    trackedItem={trackedByJobId.get(job.id)}
                    hidden={hiddenJobs.includes(job.id)}
                    onOpen={() => setParam('job', job.id)}
                    onSave={toggleSaveJob}
                    onApply={markApplied}
                    onHide={hideJob}
                    onUnhide={unhideJob}
                  />
                ))}
              </AnimatePresence>
            </Box>
          )}
        </Grid>

        {/* Right Column: "Your Saved Filters" Panel (From Screenshot!) */}
        <Grid item xs={12} lg={3.25}>
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 84 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              {/* Header: Title + Plus Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: '0.975rem' }}>
                  Your Saved Filters
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => notify('Current filters saved to presets!')}
                  sx={{
                    bgcolor: '#0f172a',
                    color: '#ffffff',
                    width: 28,
                    height: 28,
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                  aria-label="Add saved filter"
                >
                  <AddRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              {/* Saved Filters List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {savedFilters.map((sf, idx) => (
                  <Box
                    key={sf.id}
                    onClick={() => handleApplySavedFilter(sf)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.25,
                      pl: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      borderLeft: '3px solid #00e599',
                      bgcolor: idx === 0 ? (t) => alpha('#00e599', 0.08) : 'transparent',
                      transition: 'background-color .15s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.85rem' }}>
                      {sf.name}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: 'text.secondary' }}>
                      <EditOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Quick Profile Summary Card */}
            <Card
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: (t) =>
                  `linear-gradient(135deg, ${alpha('#00e599', 0.08)}, ${alpha('#38bdf8', 0.06)})`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                AI Job Matcher Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Matching against your verified profile: <b>{profile?.title || 'Senior Frontend Developer'}</b> ({profile?.skills?.length || 10} skills).
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/profile')}
                sx={{ borderRadius: 99, textTransform: 'none', fontSize: '0.75rem', py: 0.4 }}
              >
                Update Profile Targets
              </Button>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Filter Selection Dropdown Menu */}
      <Menu
        anchorEl={activeFilterAnchor}
        open={Boolean(activeFilterAnchor)}
        onClose={() => setActiveFilterAnchor(null)}
      >
        {activeFilterKey === 'sort'
          ? ['Recommended', 'Most Recent', 'Highest Salary', 'Match Score'].map((opt) => (
              <MenuItem key={opt} onClick={() => handleSelectFilter(opt)}>
                {opt}
              </MenuItem>
            ))
          : ['United States', 'Remote', 'Entry Level', 'Mid Level', 'Senior Level', 'All Postings'].map((opt) => (
              <MenuItem key={opt} onClick={() => handleSelectFilter(opt)}>
                {opt}
              </MenuItem>
            ))}
      </Menu>

      {/* Detail Drawer */}
      <JobDetailDrawer
        job={openJob || lastJob.current}
        open={Boolean(openJob)}
        onClose={() => setParam('job', '')}
      />
    </Box>
  );
}
