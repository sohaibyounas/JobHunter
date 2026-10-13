import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Dialog, InputBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SearchRounded, AutoAwesomeRounded, DarkModeRounded, AddRounded, KeyboardReturnRounded } from '@mui/icons-material';
import { ALL_NAV_ITEMS } from './nav';
import { useApp } from '../../context/AppContext';
import CompanyLogo from '../Common/CompanyLogo';

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { rankedJobs, toggleDarkMode, openCopilot } = useApp();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const has = (s) => !q || s.toLowerCase().includes(q);

    const pages = ALL_NAV_ITEMS.filter((p) => has(p.label)).map((p) => ({
      id: `p-${p.to}`, group: 'Pages', label: p.label, icon: <p.icon fontSize="small" />, run: () => navigate(p.to),
    }));
    const jobs = rankedJobs
      .filter((j) => q && (has(j.title) || has(j.company) || j.skills.some(has)))
      .slice(0, 6)
      .map((j) => ({
        id: `j-${j.id}`, group: 'Jobs', label: `${j.title}`, hint: `${j.company} · ${j.match.score}% match`,
        icon: <CompanyLogo company={j.company} domain={j.domain} size={22} radius={6} />,
        run: () => navigate(`/jobs?job=${j.id}`),
      }));
    const actions = [
      { id: 'a-ai', label: 'Ask the AI copilot', icon: <AutoAwesomeRounded fontSize="small" />, run: () => openCopilot(q) },
      { id: 'a-add', label: 'Add a job to the tracker', icon: <AddRounded fontSize="small" />, run: () => navigate('/tracker?new=1') },
      { id: 'a-cl', label: 'Write a cover letter', icon: <AutoAwesomeRounded fontSize="small" />, run: () => navigate('/ai-tools/cover-letter') },
      { id: 'a-resume', label: 'Build & download resume (PDF)', icon: <AutoAwesomeRounded fontSize="small" />, run: () => navigate('/ai-tools/resume') },
      { id: 'a-fit', label: 'Analyze job fit (ATS)', icon: <AutoAwesomeRounded fontSize="small" />, run: () => navigate('/ai-tools/job-fit') },
      { id: 'a-theme', label: 'Toggle dark mode', icon: <DarkModeRounded fontSize="small" />, run: toggleDarkMode },
    ]
      .filter((a) => has(a.label) || a.id === 'a-ai')
      .map((a) => ({ ...a, group: 'Actions', label: a.id === 'a-ai' && q ? `Ask AI: "${query.trim()}"` : a.label }));

    return [...jobs, ...pages, ...actions];
  }, [query, rankedJobs, navigate, openCopilot, toggleDarkMode]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    }
  };

  let lastGroup = null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { position: 'fixed', top: { xs: 16, sm: '12vh' }, m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: '100%' }, overflow: 'hidden' } }}
      aria-label="Command palette"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <SearchRounded color="action" />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Search jobs, pages, or type a question…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          inputProps={{ 'aria-label': 'Search', role: 'combobox', 'aria-expanded': true, 'aria-controls': 'cmdk-list' }}
          sx={{ height: 56, fontSize: '1rem' }}
        />
        <Box component="kbd" onClick={onClose} sx={{ cursor: 'pointer', fontSize: 11, fontWeight: 600, px: 0.75, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', color: 'text.secondary', fontFamily: 'inherit' }}>
          Esc
        </Box>
      </Box>
      <Box ref={listRef} id="cmdk-list" role="listbox" sx={{ maxHeight: { xs: '60vh', sm: 400 }, overflowY: 'auto', p: 1 }}>
        {results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No results for "{query}"
          </Typography>
        )}
        {results.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null;
          lastGroup = item.group;
          return (
            <React.Fragment key={item.id}>
              {header && (
                <Typography variant="overline" sx={{ display: 'block', px: 1.5, pt: i ? 1.5 : 0.5, pb: 0.5, color: 'text.disabled' }}>
                  {header}
                </Typography>
              )}
              <Box
                role="option"
                aria-selected={i === active}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: i === active ? (t) => alpha(t.palette.primary.main, 0.1) : 'transparent',
                  color: i === active ? 'primary.main' : 'text.primary',
                }}
              >
                <Box sx={{ display: 'grid', placeItems: 'center', color: i === active ? 'primary.main' : 'text.secondary' }}>{item.icon}</Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.label}
                  </Typography>
                  {item.hint && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {item.hint}
                    </Typography>
                  )}
                </Box>
                {i === active && <KeyboardReturnRounded sx={{ fontSize: 16, color: 'text.secondary' }} />}
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    </Dialog>
  );
}
