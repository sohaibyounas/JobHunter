import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, Divider, IconButton, InputAdornment, ListItemIcon, Menu, MenuItem, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  AddRounded, SearchRounded, ViewKanbanRounded, ViewListRounded, MoreHorizRounded, EditRounded, DeleteOutlineRounded,
  StickyNote2Outlined, ArrowForwardRounded, TrendingUpRounded, WorkOutlineRounded, EmojiEventsRounded, ForumRounded,
} from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';
import CompanyLogo from '../components/Common/CompanyLogo';
import StatCard from '../components/Common/StatCard';
import EmptyState from '../components/Common/EmptyState';
import TrackerDialog from '../components/Tracker/TrackerDialog';
import { STATUSES, statusMeta, useApp } from '../context/AppContext';
import { timeAgo } from '../data/helpers';

function CardMenu({ item, onEdit, onMove, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        aria-label={`Actions for ${item.title} at ${item.company}`}
        sx={{ mt: -0.5, mr: -0.75 }}
      >
        <MoreHorizRounded fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={() => { setAnchor(null); onEdit(item); }}>
          <ListItemIcon><EditRounded fontSize="small" /></ListItemIcon>
          Edit details
        </MenuItem>
        <Divider />
        <Typography variant="overline" sx={{ px: 2, color: 'text.disabled' }}>
          Move to
        </Typography>
        {STATUSES.filter((s) => s.id !== item.status).map((s) => (
          <MenuItem key={s.id} onClick={() => { setAnchor(null); onMove(item.id, s.id); }}>
            <ListItemIcon>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, ml: 0.5 }} />
            </ListItemIcon>
            {s.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); onDelete(item); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteOutlineRounded fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}

function BoardCard({ item, onEdit, onMove, onDelete, draggable, onDragStart, onDragEnd, dragging }) {
  return (
    <motion.div layout layoutId={item.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: dragging ? 0.4 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      {/* Native drag events live on a plain element: motion components reserve onDrag* for their own gestures */}
      <Card
        draggable={draggable}
        onDragStart={(e) => onDragStart(e, item)}
        onDragEnd={onDragEnd}
        onClick={() => onEdit(item)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onEdit(item)}
        sx={{
          p: 1.75,
          cursor: draggable ? 'grab' : 'pointer',
          transition: 'border-color .15s, box-shadow .15s',
          '&:hover': { borderColor: 'primary.main', boxShadow: (t) => `0 8px 20px ${alpha(t.palette.primary.main, 0.08)}` },
          '&:active': { cursor: draggable ? 'grabbing' : 'pointer' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
          <CompanyLogo company={item.company} domain={item.domain} size={34} radius={9} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.3, wordBreak: 'break-word' }}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {item.company}
              {item.location ? ` · ${item.location}` : ''}
            </Typography>
          </Box>
          <CardMenu item={item} onEdit={onEdit} onMove={onMove} onDelete={onDelete} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25, color: 'text.secondary' }}>
          {item.salary && (
            <Typography variant="caption" fontWeight={600} sx={{ px: 0.75, py: 0.15, borderRadius: 1, bgcolor: 'background.subtle' }} noWrap>
              {item.salary}
            </Typography>
          )}
          {item.notes && (
            <Tooltip title={item.notes}>
              <StickyNote2Outlined sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
          <Typography variant="caption" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
            {timeAgo(item.updatedAt)}
          </Typography>
        </Box>
      </Card>
    </motion.div>
  );
}

function Column({ status, items, dragOver, setDragOver, onDrop, onAdd, cardProps, canDrag }) {
  const isOver = dragOver === status.id;
  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOver !== status.id) setDragOver(status.id);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.getData('text/plain'), status.id);
      }}
      sx={{
        width: { xs: '82vw', sm: 300 },
        maxWidth: 320,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        p: 1.25,
        bgcolor: isOver ? alpha(status.color, 0.08) : 'background.subtle',
        outline: isOver ? `2px dashed ${status.color}` : '2px dashed transparent',
        transition: 'background-color .15s, outline-color .15s',
      }}
      role="region"
      aria-label={`${status.label} column, ${items.length} jobs`}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.75, py: 0.5, mb: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color, boxShadow: `0 0 0 4px ${alpha(status.color, 0.18)}` }} />
        <Typography variant="subtitle2">{status.label}</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ px: 0.9, borderRadius: 99, bgcolor: 'background.paper', color: 'text.secondary' }}>
          {items.length}
        </Typography>
        <Tooltip title={`Add to ${status.label}`}>
          <IconButton size="small" sx={{ ml: 'auto' }} onClick={() => onAdd(status.id)} aria-label={`Add job to ${status.label}`}>
            <AddRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 120, flexGrow: 1 }}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <BoardCard key={item.id} item={item} draggable={canDrag} {...cardProps} dragging={cardProps.draggingId === item.id} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <Box sx={{ flexGrow: 1, display: 'grid', placeItems: 'center', p: 2, borderRadius: 3, border: '1px dashed', borderColor: 'divider', color: 'text.disabled', textAlign: 'center', minHeight: 100 }}>
            <Typography variant="caption">{canDrag ? 'Drag jobs here' : 'No jobs yet'}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ListView({ items, onEdit, onMove, onDelete }) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      {items.map((item, i) => {
        const s = statusMeta(item.status);
        return (
          <Box
            key={item.id}
            component={motion.div}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onEdit(item)}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'auto 1fr auto', md: 'auto 2fr 1.2fr 1fr 0.8fr auto' },
              alignItems: 'center',
              gap: 2,
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              cursor: 'pointer',
              borderTop: i ? '1px solid' : 0,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CompanyLogo company={item.company} domain={item.domain} size={38} radius={10} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {item.company}
                <Box component="span" sx={{ display: { md: 'none' } }}>
                  {' · '}
                  <Box component="span" sx={{ color: s.color, fontWeight: 700 }}>{s.label}</Box>
                </Box>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', md: 'block' } }}>
              {item.location || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', md: 'block' } }}>
              {item.salary || '—'}
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
              <Typography variant="body2" fontWeight={600}>
                {s.label}
              </Typography>
            </Box>
            <CardMenu item={item} onEdit={onEdit} onMove={onMove} onDelete={onDelete} />
          </Box>
        );
      })}
    </Card>
  );
}

export default function Tracker() {
  const theme = useTheme();
  const finePointer = useMediaQuery('(pointer: fine)');
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [params, setParams] = useSearchParams();
  const { tracked, addTracked, updateTracked, removeTracked, notify } = useApp();
  const [view, setView] = useState('board');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState({ open: false, item: null, status: 'saved' });
  const [dragOver, setDragOver] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  // Deep link: /tracker?new=1 opens the add dialog
  useEffect(() => {
    if (params.get('new')) {
      setDialog({ open: true, item: null, status: 'saved' });
      setParams((p) => {
        const n = new URLSearchParams(p);
        n.delete('new');
        return n;
      }, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...tracked]
      .filter((t) => !q || `${t.title} ${t.company} ${t.location}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [tracked, query]);

  const byStatus = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.id, filtered.filter((t) => t.status === s.id)])), [filtered]);

  const count = (id) => tracked.filter((t) => t.status === id).length;
  const appliedTotal = tracked.filter((t) => t.status !== 'saved').length;
  const responded = count('interview') + count('offer');
  const responseRate = appliedTotal ? Math.round((responded / appliedTotal) * 100) : 0;

  const move = (id, status) => {
    const item = tracked.find((t) => t.id === id);
    if (!item || item.status === status) return;
    updateTracked(id, { status });
    notify(`Moved to ${statusMeta(status).label}${status === 'offer' ? ' 🎉' : ''}`);
  };

  const remove = (item) => {
    if (!window.confirm(`Delete "${item.title}" at ${item.company}?`)) return;
    removeTracked(item.id);
    setDialog((d) => ({ ...d, open: false }));
    notify('Job deleted', 'info');
  };

  const save = (data) => {
    if (dialog.item) {
      updateTracked(dialog.item.id, data);
      notify('Changes saved');
    } else {
      addTracked(data);
      notify(`Added ${data.title} at ${data.company}`);
    }
    setDialog((d) => ({ ...d, open: false }));
  };

  const cardProps = {
    onEdit: (item) => setDialog({ open: true, item, status: item.status }),
    onMove: move,
    onDelete: remove,
    draggingId,
    onDragStart: (e, item) => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingId(item.id);
    },
    onDragEnd: () => {
      setDraggingId(null);
      setDragOver(null);
    },
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Application pipeline"
        title="Job Tracker"
        subtitle={finePointer ? 'Drag cards between stages to update your pipeline. Every move is saved automatically.' : 'Tap ••• on a card to move it between stages. Every change is saved automatically.'}
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialog({ open: true, item: null, status: 'saved' })}>
            Add job
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <StatCard label="Total tracked" value={tracked.length} icon={<WorkOutlineRounded />} color="#6366f1" hint={`${count('saved')} saved to apply`} />
        <StatCard label="Applied" value={appliedTotal} icon={<ArrowForwardRounded />} color="#3b82f6" hint="Applications sent" />
        <StatCard label="Interviewing" value={count('interview')} icon={<ForumRounded />} color="#f59e0b" hint={`${responseRate}% response rate`} />
        <StatCard label="Offers" value={count('offer')} icon={<EmojiEventsRounded />} color="#10b981" hint={count('offer') ? 'Time to negotiate!' : 'Keep going'} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title, company or location"
          inputProps={{ 'aria-label': 'Filter tracked jobs' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded color="action" /></InputAdornment> }}
          sx={{ flexGrow: 1, maxWidth: 420 }}
        />
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="View mode" sx={{ ml: 'auto', '& .MuiToggleButton-root': { px: 1.5, borderRadius: 2.5 } }}>
          <ToggleButton value="board" aria-label="Board view">
            <ViewKanbanRounded fontSize="small" />
            {!isSmall && <Box component="span" sx={{ ml: 0.75 }}>Board</Box>}
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <ViewListRounded fontSize="small" />
            {!isSmall && <Box component="span" sx={{ ml: 0.75 }}>List</Box>}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {tracked.length === 0 ? (
        <Card>
          <EmptyState icon={<TrendingUpRounded />} title="Start tracking your search" description="Add jobs you're interested in and move them through each stage as you progress." actionLabel="Add your first job" onAction={() => setDialog({ open: true, item: null, status: 'saved' })} />
        </Card>
      ) : view === 'board' ? (
        <LayoutGroup>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, scrollSnapType: 'x mandatory', alignItems: 'flex-start' }}>
            {STATUSES.map((s) => (
              <Column
                key={s.id}
                status={s}
                items={byStatus[s.id]}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onDrop={(id, status) => {
                  setDragOver(null);
                  move(id, status);
                }}
                onAdd={(status) => setDialog({ open: true, item: null, status })}
                cardProps={cardProps}
                canDrag={finePointer}
              />
            ))}
          </Box>
        </LayoutGroup>
      ) : filtered.length ? (
        <ListView items={filtered} {...cardProps} />
      ) : (
        <Card>
          <EmptyState compact title="No matches" description="No tracked jobs match your filter." />
        </Card>
      )}

      <TrackerDialog
        open={dialog.open}
        item={dialog.item}
        defaultStatus={dialog.status}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={save}
        onDelete={remove}
      />
    </Box>
  );
}
