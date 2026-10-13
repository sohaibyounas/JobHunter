import React, { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Card, Chip, InputAdornment, Tab, Tabs, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion';
import { SearchRounded, TuneRounded, AutoAwesomeRounded, CloseRounded, SwapVertRounded, BookmarkBorderRounded, SendRounded, VisibilityOffOutlined } from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';
import FilterChip from '../components/Common/FilterChip';
import EmptyState from '../components/Common/EmptyState';
import JobCard from '../components/Jobs/JobCard';
import JobDetailDrawer from '../components/Jobs/JobDetailDrawer';
import { useApp } from '../context/AppContext';

const DEFAULT_FILTERS = { workModels: [], type: '', level: '', posted: '', salary: '', h1b: false, sort: 'match' };

const OPTIONS = {
  workModels: ['Remote', 'Hybrid', 'Onsite'].map((v) => ({ value: v, label: v })),
  type: [{ value: '', label: 'Any job type' }, ...['Full-time', 'Part-time', 'Contract', 'Internship'].map((v) => ({ value: v, label: v }))],
  level: [{ value: '', label: 'Any level' }, ...['Entry', 'Mid', 'Senior', 'Lead'].map((v) => ({ value: v, label: v }))],
  posted: [
    { value: '', label: 'Any time' },
    { value: 1, label: 'Past 24 hours' },
    { value: 3, label: 'Past 3 days' },
    { value: 7, label: 'Past week' },
  ],
  salary: [{ value: '', label: 'Any salary' }, ...[100, 130, 160, 190].map((v) => ({ value: v, label: `$${v}k+` }))],
  sort: [
    { value: 'match', label: 'Best match' },
    { value: 'newest', label: 'Most recent' },
    { value: 'salary', label: 'Highest salary' },
    { value: 'applicants', label: 'Fewest applicants' },
  ],
};

export default function Jobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { rankedJobs, trackedByJobId, hiddenJobs, toggleSaveJob, markApplied, hideJob, unhideJob, getJob, profile } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const tab = params.get('tab') || 'recommended';
  const openJobId = params.get('job');
  const openJob = openJobId ? getJob(openJobId) : null;
  // Keep the last job rendered while the drawer animates closed
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

  const openDetail = useCallback((job) => setParam('job', job.id), [setParam]);
  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  const activeFilterCount =
    filters.workModels.length + ['type', 'level', 'posted', 'salary'].filter((k) => filters[k] !== '').length + (filters.h1b ? 1 : 0);

  const counts = useMemo(() => {
    let saved = 0;
    let applied = 0;
    rankedJobs.forEach((j) => {
      const t = trackedByJobId.get(j.id);
      if (t?.status === 'saved') saved += 1;
      else if (t) applied += 1;
    });
    return { recommended: rankedJobs.filter((j) => !hiddenJobs.includes(j.id) && !trackedByJobId.has(j.id)).length, saved, applied, hidden: hiddenJobs.length };
  }, [rankedJobs, trackedByJobId, hiddenJobs]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = rankedJobs.filter((j) => {
      const t = trackedByJobId.get(j.id);
      const isHidden = hiddenJobs.includes(j.id);
      if (tab === 'recommended' && (isHidden || t)) return false;
      if (tab === 'saved' && t?.status !== 'saved') return false;
      if (tab === 'applied' && (!t || t.status === 'saved')) return false;
      if (tab === 'hidden' && !isHidden) return false;

      if (q && ![j.title, j.company, j.industry, j.location, ...j.skills].some((s) => s.toLowerCase().includes(q))) return false;
      if (filters.workModels.length && !filters.workModels.includes(j.workModel)) return false;
      if (filters.type && j.type !== filters.type) return false;
      if (filters.level && j.level !== filters.level) return false;
      if (filters.posted !== '' && j.daysAgo > filters.posted) return false;
      if (filters.salary !== '' && j.salaryMax < filters.salary) return false;
      if (filters.h1b && !j.h1b) return false;
      return true;
    });
    const sorters = {
      match: (a, b) => b.match.score - a.match.score,
      newest: (a, b) => a.daysAgo - b.daysAgo,
      salary: (a, b) => b.salaryMax - a.salaryMax,
      applicants: (a, b) => a.applicants - b.applicants,
    };
    return list.sort(sorters[filters.sort]);
  }, [rankedJobs, trackedByJobId, hiddenJobs, tab, deferredQuery, filters]);

  const strong = visible.filter((j) => j.match.score >= 85).length;
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
  };

  const emptyCopy = {
    recommended: { icon: <SearchRounded />, title: 'No matching jobs', description: 'Try removing some filters or searching for a different role.' },
    saved: { icon: <BookmarkBorderRounded />, title: 'No saved jobs yet', description: 'Tap the bookmark on any job to save it for later.' },
    applied: { icon: <SendRounded />, title: 'No applications yet', description: 'Jobs you apply to will show up here and in your tracker.' },
    hidden: { icon: <VisibilityOffOutlined />, title: 'No hidden jobs', description: 'Jobs you mark as "not interested" will appear here.' },
  }[tab];

  return (
    <Box>
      <PageHeader
        eyebrow="AI job matching"
        title="Jobs matched to you"
        subtitle={`Ranked by how well each role fits your skills, experience and goals as a ${profile.title || 'professional'}.`}
        actions={
          <Button variant="outlined" startIcon={<TuneRounded />} onClick={() => navigate('/profile')}>
            Edit preferences
          </Button>
        }
      />

      {/* Search + filters */}
      <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, position: { md: 'sticky' }, top: { md: 76 }, zIndex: 5 }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, skill or location"
          inputProps={{ 'aria-label': 'Search jobs' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded color="action" />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <CloseRounded fontSize="small" sx={{ cursor: 'pointer', color: 'text.secondary' }} onClick={() => setQuery('')} aria-label="Clear search" />
              </InputAdornment>
            ),
            sx: { height: 44 },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 0.5, mx: -0.5, px: 0.5, '&::-webkit-scrollbar': { height: 0 } }}>
          <FilterChip label="Work model" value={filters.workModels} options={OPTIONS.workModels} onChange={setFilter('workModels')} multiple />
          <FilterChip label="Job type" value={filters.type} options={OPTIONS.type} onChange={setFilter('type')} />
          <FilterChip label="Experience" value={filters.level} options={OPTIONS.level} onChange={setFilter('level')} />
          <FilterChip label="Date posted" value={filters.posted} options={OPTIONS.posted} onChange={setFilter('posted')} />
          <FilterChip label="Salary" value={filters.salary} options={OPTIONS.salary} onChange={setFilter('salary')} />
          <Chip
            label="H1B sponsor"
            onClick={() => setFilters((f) => ({ ...f, h1b: !f.h1b }))}
            variant={filters.h1b ? 'filled' : 'outlined'}
            color={filters.h1b ? 'primary' : 'default'}
            sx={{ height: 34, borderRadius: 99, flexShrink: 0, fontWeight: filters.h1b ? 600 : 500 }}
            aria-pressed={filters.h1b}
          />
          {activeFilterCount > 0 && (
            <Button size="small" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))} sx={{ flexShrink: 0 }}>
              Clear ({activeFilterCount})
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <FilterChip label="Sort" icon={<SwapVertRounded />} value={filters.sort} options={OPTIONS.sort} onChange={setFilter('sort')} />
        </Box>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setParam('tab', v === 'recommended' ? '' : v)} variant="scrollable" allowScrollButtonsMobile>
          {[
            ['recommended', 'Recommended'],
            ['saved', 'Saved'],
            ['applied', 'Applied'],
            ['hidden', 'Hidden'],
          ].map(([v, l]) => (
            <Tab
              key={v}
              value={v}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {l}
                  <Box component="span" sx={{ fontSize: 11, fontWeight: 700, px: 0.75, borderRadius: 99, bgcolor: (t) => (tab === v ? alpha(t.palette.primary.main, 0.12) : t.palette.action.hover) }}>
                    {counts[v]}
                  </Box>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {tab === 'recommended' && visible.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
          <AutoAwesomeRounded sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2">
            <b>{visible.length}</b> jobs found · <b>{strong}</b> strong match{strong === 1 ? '' : 'es'} for your profile
          </Typography>
        </Box>
      )}

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            {...emptyCopy}
            actionLabel={activeFilterCount || query ? 'Clear filters' : tab !== 'recommended' ? 'Browse recommendations' : undefined}
            onAction={activeFilterCount || query ? clearAll : () => setParam('tab', '')}
          />
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2 }}>
          <AnimatePresence initial={false}>
            {visible.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                trackedItem={trackedByJobId.get(job.id)}
                hidden={hiddenJobs.includes(job.id)}
                onOpen={openDetail}
                onSave={toggleSaveJob}
                onApply={markApplied}
                onHide={hideJob}
                onUnhide={unhideJob}
              />
            ))}
          </AnimatePresence>
        </Box>
      )}

      <JobDetailDrawer job={openJob || lastJob.current} open={Boolean(openJob)} onClose={() => setParam('job', '')} />
    </Box>
  );
}
