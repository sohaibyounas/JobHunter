import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { CloseRounded, DeleteOutlineRounded, OpenInNewRounded } from '@mui/icons-material';
import { STATUSES } from '../../context/AppContext';
import { formatDate, toDomain } from '../../data/helpers';

const EMPTY = { title: '', company: '', location: '', salary: '', url: '', status: 'saved', notes: '' };

const isSafeUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export default function TrackerDialog({ open, item, defaultStatus = 'saved', onClose, onSave, onDelete }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(item ? { ...EMPTY, ...item } : { ...EMPTY, status: defaultStatus });
      setTouched(false);
    }
  }, [open, item, defaultStatus]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = {
    title: !form.title.trim() && 'Job title is required',
    company: !form.company.trim() && 'Company is required',
    url: form.url.trim() && !isSafeUrl(form.url.trim()) && 'Enter a full link starting with https://',
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    onSave({
      ...form,
      title: form.title.trim(),
      company: form.company.trim(),
      url: form.url.trim(),
      domain: form.domain || toDomain(form.url.trim() || form.company),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" PaperProps={{ component: 'form', onSubmit: submit, noValidate: true }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="span">
            {item ? 'Edit job' : 'Add a job'}
          </Typography>
          {item && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Added {formatDate(item.createdAt)}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Job title" required fullWidth autoFocus value={form.title} onChange={set('title')} error={touched && Boolean(errors.title)} helperText={touched && errors.title} inputProps={{ maxLength: 120 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Company" required fullWidth value={form.company} onChange={set('company')} error={touched && Boolean(errors.company)} helperText={touched && errors.company} inputProps={{ maxLength: 80 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Location" fullWidth value={form.location} onChange={set('location')} placeholder="e.g. Remote" inputProps={{ maxLength: 80 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Salary" fullWidth value={form.salary} onChange={set('salary')} placeholder="e.g. $140k – $180k" inputProps={{ maxLength: 40 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Status" fullWidth value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, display: 'inline-block', mr: 1 }} />
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Job posting link"
              fullWidth
              value={form.url}
              onChange={set('url')}
              placeholder="https://"
              error={touched && Boolean(errors.url)}
              helperText={touched && errors.url}
              InputProps={{
                endAdornment: form.url && isSafeUrl(form.url) && (
                  <IconButton size="small" component="a" href={form.url} target="_blank" rel="noopener noreferrer" aria-label="Open link">
                    <OpenInNewRounded fontSize="small" />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notes" fullWidth multiline minRows={3} value={form.notes} onChange={set('notes')} placeholder="Interview dates, contacts, next steps…" inputProps={{ maxLength: 2000 }} />
          </Grid>
        </Grid>
        {item?.history?.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Timeline
            </Typography>
            <Box sx={{ borderLeft: '2px solid', borderColor: 'divider', pl: 2, ml: 0.5 }}>
              {item.history.map((h, i) => {
                const s = STATUSES.find((x) => x.id === h.status);
                return (
                  <Box key={i} sx={{ position: 'relative', mb: 1 }}>
                    <Box sx={{ position: 'absolute', left: -21.5, top: 6, width: 9, height: 9, borderRadius: '50%', bgcolor: s?.color }} />
                    <Typography variant="body2">
                      <b>{s?.label}</b>{' '}
                      <Typography component="span" variant="caption" color="text.secondary">
                        · {formatDate(h.at)}
                      </Typography>
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {item && onDelete && (
          <Button color="error" startIcon={<DeleteOutlineRounded />} onClick={() => onDelete(item)} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          {item ? 'Save changes' : 'Add job'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
