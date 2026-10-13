import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, ListItemIcon,
  Menu, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AddRounded, SearchRounded, MoreVertRounded, EditRounded, DeleteOutlineRounded, MailOutlineRounded, LinkedIn, EventRounded,
  AutoAwesomeRounded, CheckRounded, CloseRounded, GroupsRounded,
} from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';
import EmptyState from '../components/Common/EmptyState';
import AIOutput from '../components/Common/AIOutput';
import { useApp } from '../context/AppContext';
import { daysFromNow } from '../data/mockData';
import { daysUntil, formatDate, getInitials, timeAgo } from '../data/helpers';
import { generateOutreach } from '../lib/ai';

const STATUS = [
  { id: 'to_contact', label: 'To reach out', color: '#64748b' },
  { id: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { id: 'replied', label: 'Replied', color: '#8b5cf6' },
  { id: 'meeting', label: 'Meeting set', color: '#10b981' },
];
const RELATIONSHIPS = ['Alumni', 'Former Colleague', 'Recruiter', 'Hiring Manager', 'Referral', 'Friend', 'Other'];
const EMPTY = { name: '', company: '', role: '', email: '', linkedin: '', relationship: 'Alumni', status: 'to_contact', followUp: '', notes: '' };
const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[0];
const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const safeLinkedIn = (v) => {
  const s = (v || '').trim();
  if (!s) return '';
  const url = s.startsWith('http') ? s : `https://${s}`;
  try {
    const u = new URL(url);
    return u.hostname.endsWith('linkedin.com') ? u.href : '';
  } catch {
    return '';
  }
};

function ContactDialog({ open, contact, onClose, onSave }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(contact ? { ...EMPTY, ...contact, followUp: toDateInput(contact.followUp) } : EMPTY);
      setTouched(false);
    }
  }, [open, contact]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = {
    name: !form.name.trim() && 'Name is required',
    company: !form.company.trim() && 'Company is required',
    email: form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && 'Enter a valid email',
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave({ ...form, name: form.name.trim(), company: form.company.trim(), followUp: form.followUp ? new Date(`${form.followUp}T09:00:00`).toISOString() : null });
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" PaperProps={{ component: 'form', onSubmit: submit, noValidate: true }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>{contact ? 'Edit contact' : 'Add contact'}</Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" required fullWidth autoFocus value={form.name} onChange={set('name')} error={touched && Boolean(errors.name)} helperText={touched && errors.name} inputProps={{ maxLength: 80 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Company" required fullWidth value={form.company} onChange={set('company')} error={touched && Boolean(errors.company)} helperText={touched && errors.company} inputProps={{ maxLength: 80 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Role" fullWidth value={form.role} onChange={set('role')} inputProps={{ maxLength: 80 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Relationship" fullWidth value={form.relationship} onChange={set('relationship')}>
              {RELATIONSHIPS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" type="email" fullWidth value={form.email} onChange={set('email')} error={touched && Boolean(errors.email)} helperText={touched && errors.email} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="LinkedIn URL" fullWidth value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Status" fullWidth value={form.status} onChange={set('status')}>
              {STATUS.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Follow-up date" type="date" fullWidth value={form.followUp} onChange={set('followUp')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notes" fullWidth multiline minRows={3} value={form.notes} onChange={set('notes')} inputProps={{ maxLength: 1000 }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          {contact ? 'Save' : 'Add contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OutreachDialog({ contact, onClose }) {
  const { profile } = useApp();
  const [kind, setKind] = useState('intro');
  const text = contact ? generateOutreach(contact, profile, kind) : '';
  return (
    <Dialog open={Boolean(contact)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeRounded color="primary" />
        <Box sx={{ flexGrow: 1 }}>Message to {contact?.name}</Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <ToggleButtonGroup exclusive fullWidth size="small" value={kind} onChange={(_, v) => v && setKind(v)} sx={{ mb: 2 }}>
          <ToggleButton value="intro">Introduction</ToggleButton>
          <ToggleButton value="followup">Follow-up</ToggleButton>
          <ToggleButton value="referral">Ask for referral</ToggleButton>
        </ToggleButtonGroup>
        <AIOutput key={kind} text={text} filename={`Message to ${contact?.name || 'contact'}.txt`} minRows={8} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {contact?.email && (
          <Button
            component="a"
            href={`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(`Hello from ${profile.name}`)}&body=${encodeURIComponent(text)}`}
            startIcon={<MailOutlineRounded />}
          >
            Open in email
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ContactCard({ c, onEdit, onDelete, onMessage, onContacted }) {
  const [anchor, setAnchor] = useState(null);
  const s = statusOf(c.status);
  const due = daysUntil(c.followUp);
  const li = safeLinkedIn(c.linkedin);

  return (
    <Card component={motion.div} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
        <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(s.color, 0.15), color: s.color, fontWeight: 700 }}>{getInitials(c.name)}</Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {c.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {c.role ? `${c.role} · ` : ''}
            {c.company}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Actions for ${c.name}`}>
          <MoreVertRounded fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => { setAnchor(null); onEdit(c); }}>
            <ListItemIcon><EditRounded fontSize="small" /></ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onDelete(c); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteOutlineRounded fontSize="small" color="error" /></ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
        <Chip size="small" label={s.label} sx={{ bgcolor: alpha(s.color, 0.14), color: s.color, fontWeight: 700 }} />
        <Chip size="small" label={c.relationship} variant="outlined" />
        {due !== null && c.status !== 'meeting' && (
          <Chip
            size="small"
            icon={<EventRounded />}
            label={due < 0 ? `${-due}d overdue` : due === 0 ? 'Follow up today' : `Follow up ${formatDate(c.followUp, { month: 'short', day: 'numeric' })}`}
            color={due < 0 ? 'error' : due === 0 ? 'warning' : 'default'}
            variant={due <= 0 ? 'filled' : 'outlined'}
          />
        )}
      </Box>

      {c.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.notes}
        </Typography>
      )}

      <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {c.lastContacted ? `Last contact ${timeAgo(c.lastContacted)}` : 'Not contacted yet'}
        </Typography>
        {li && (
          <IconButton size="small" component="a" href={li} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} on LinkedIn`}>
            <LinkedIn fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" onClick={() => onContacted(c)} aria-label="Log contact" title="Log that you reached out">
          <CheckRounded fontSize="small" />
        </IconButton>
        <Button size="small" startIcon={<AutoAwesomeRounded />} onClick={() => onMessage(c)}>
          Message
        </Button>
      </Box>
    </Card>
  );
}

export default function Networking() {
  const { contacts, saveContact, removeContact, notify } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [dialog, setDialog] = useState({ open: false, contact: null });
  const [messaging, setMessaging] = useState(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => filter === 'all' || (filter === 'due' ? daysUntil(c.followUp) !== null && daysUntil(c.followUp) <= 0 && c.status !== 'meeting' : c.status === filter))
      .filter((c) => !q || `${c.name} ${c.company} ${c.role}`.toLowerCase().includes(q))
      .sort((a, b) => (daysUntil(a.followUp) ?? 999) - (daysUntil(b.followUp) ?? 999));
  }, [contacts, query, filter]);

  const dueCount = contacts.filter((c) => daysUntil(c.followUp) !== null && daysUntil(c.followUp) <= 0 && c.status !== 'meeting').length;

  return (
    <Box>
      <PageHeader
        eyebrow="Networking tracker"
        title="Your network"
        subtitle="Referrals are the fastest path to interviews. Keep track of who you know, when to follow up, and send great messages."
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialog({ open: true, contact: null })}>
            Add contact
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' } }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts"
          inputProps={{ 'aria-label': 'Search contacts' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded color="action" /></InputAdornment> }}
          sx={{ width: { md: 320 } }}
        />
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
          {[{ id: 'all', label: `All (${contacts.length})` }, { id: 'due', label: `Follow-up due (${dueCount})` }, ...STATUS].map((f) => (
            <Chip key={f.id} label={f.label} onClick={() => setFilter(f.id)} color={filter === f.id ? 'primary' : 'default'} variant={filter === f.id ? 'filled' : 'outlined'} sx={{ flexShrink: 0, fontWeight: 600 }} />
          ))}
        </Box>
      </Box>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GroupsRounded />}
            title={contacts.length ? 'No contacts match' : 'Build your network'}
            description={contacts.length ? 'Try a different search or filter.' : 'Add alumni, former colleagues and recruiters at companies you want to work for.'}
            actionLabel={contacts.length ? undefined : 'Add your first contact'}
            onAction={() => setDialog({ open: true, contact: null })}
          />
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
          <AnimatePresence initial={false}>
            {list.map((c) => (
              <ContactCard
                key={c.id}
                c={c}
                onEdit={(contact) => setDialog({ open: true, contact })}
                onDelete={(contact) => {
                  if (window.confirm(`Delete ${contact.name}?`)) {
                    removeContact(contact.id);
                    notify('Contact deleted', 'info');
                  }
                }}
                onMessage={setMessaging}
                onContacted={(contact) => {
                  saveContact({
                    ...contact,
                    lastContacted: new Date().toISOString(),
                    status: contact.status === 'to_contact' ? 'contacted' : contact.status,
                    followUp: daysFromNow(5),
                  });
                  notify(`Logged. We'll remind you to follow up with ${contact.name.split(' ')[0]} in 5 days.`);
                }}
              />
            ))}
          </AnimatePresence>
        </Box>
      )}

      <ContactDialog
        open={dialog.open}
        contact={dialog.contact}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={(data) => {
          saveContact(data);
          notify(dialog.contact ? 'Contact updated' : `${data.name} added`);
          setDialog((d) => ({ ...d, open: false }));
        }}
      />
      <OutreachDialog contact={messaging} onClose={() => setMessaging(null)} />
    </Box>
  );
}
