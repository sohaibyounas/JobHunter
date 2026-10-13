import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Autocomplete, Avatar, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  IconButton, InputAdornment, LinearProgress, List, ListItem, ListItemIcon, ListItemText, MenuItem, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CameraAltRounded, CloudUploadRounded, DescriptionRounded, CheckCircleRounded, AddRounded, DeleteOutlineRounded, PersonRounded,
  BadgeRounded, EmailRounded, PhoneRounded, LocationOnRounded, WorkRounded, SchoolRounded, BuildRounded, SaveRounded, UndoRounded,
  TuneRounded, AutoAwesomeRounded,
} from '@mui/icons-material';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import MatchRing from '../components/Common/MatchRing';
import { useApp } from '../context/AppContext';
import { extractFileText, parseCVText, MAX_CV_BYTES } from '../lib/cvParser';
import { profileStrength } from '../lib/matching';
import { getInitials, uid } from '../data/helpers';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const SKILL_SUGGESTIONS = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Next.js', 'GraphQL', 'CSS', 'HTML', 'Tailwind CSS', 'Redux', 'Testing', 'Accessibility', 'Performance', 'Design Systems', 'Storybook', 'AWS', 'Docker', 'SQL', 'Python', 'Figma', 'CI/CD', 'Leadership', 'React Native'];
const ROLE_SUGGESTIONS = ['Frontend Developer', 'Full Stack Developer', 'Software Engineer', 'UI Engineer', 'React Developer', 'Mobile Developer', 'Engineering Manager'];
const ACCEPTED = '.pdf,.docx,.txt';

/** Downscale avatar images so they don't bloat localStorage. */
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function Profile() {
  const { profile, updateProfile, notify, tracked, contacts } = useApp();
  const [form, setForm] = useState(profile);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null); // { parsed, fileName }
  const avatarRef = useRef(null);
  const cvRef = useRef(null);

  const dirty = !same(form, profile);
  const strength = profileStrength(form, tracked.length, contacts.length);

  // Pull in external profile changes (e.g. avatar, CV import) while not editing
  useEffect(() => {
    if (!dirty) setForm(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Warn before leaving the tab with unsaved edits
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPref = (k, v) => setForm((f) => ({ ...f, preferences: { ...f.preferences, [k]: v } }));
  const setListItem = (list, idx, key, value) =>
    setForm((f) => ({ ...f, [list]: f[list].map((it, i) => (i === idx ? { ...it, [key]: value } : it)) }));

  const emailError = form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const save = () => {
    if (!form.name.trim()) return notify('Please enter your name', 'error');
    if (emailError) return notify('Please enter a valid email', 'error');
    updateProfile({ ...form, name: form.name.trim() });
    notify('Profile saved. Your job matches have been updated.');
    return undefined;
  };

  // ── Avatar ──
  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify('Please choose an image file', 'error');
    if (file.size > MAX_AVATAR_BYTES * 5) return notify('Image is too large (max 10 MB)', 'error');
    try {
      const dataUrl = await resizeImage(file);
      updateProfile({ avatar: dataUrl });
      setForm((f) => ({ ...f, avatar: dataUrl }));
      notify('Profile photo updated');
    } catch (err) {
      notify(err.message, 'error');
    }
    return undefined;
  };

  // ── CV upload & parse ──
  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      notify(ext === 'doc' ? 'Legacy .doc files are not supported. Save as .docx or .pdf.' : 'Please upload a PDF, DOCX or TXT file', 'error');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      notify('File is larger than 10 MB', 'error');
      return;
    }
    setParsing(true);
    try {
      const text = await extractFileText(file);
      if (!text?.trim()) throw new Error('We could not read any text from this file. Is it a scanned image?');
      const parsed = parseCVText(text);
      setPreview({ parsed, fileName: file.name });
    } catch (err) {
      notify(err?.message || 'Could not read this resume', 'error');
    } finally {
      setParsing(false);
    }
  };

  const applyParsed = (useData) => {
    const { parsed, fileName } = preview;
    const updates = { cvUploaded: true, cvFileName: fileName };
    if (useData) {
      ['name', 'title', 'email', 'phone', 'location', 'summary'].forEach((k) => parsed[k] && (updates[k] = parsed[k]));
      if (parsed.skills?.length) updates.skills = parsed.skills;
      if (parsed.experience?.length) updates.experience = parsed.experience;
      if (parsed.education?.length) updates.education = parsed.education;
    }
    updateProfile(updates);
    setForm((f) => ({ ...f, ...updates }));
    setPreview(null);
    notify(useData ? 'Resume imported. Review the fields below.' : 'Resume saved', useData ? 'success' : 'info');
  };

  const previewFields = useMemo(() => {
    const p = preview?.parsed;
    if (!p) return [];
    return [
      { icon: <PersonRounded />, label: 'Name', value: p.name },
      { icon: <BadgeRounded />, label: 'Title', value: p.title },
      { icon: <EmailRounded />, label: 'Email', value: p.email },
      { icon: <PhoneRounded />, label: 'Phone', value: p.phone },
      { icon: <LocationOnRounded />, label: 'Location', value: p.location },
      { icon: <BuildRounded />, label: 'Skills', value: p.skills?.length ? `${p.skills.length} skills · ${p.skills.slice(0, 5).join(', ')}${p.skills.length > 5 ? '…' : ''}` : '' },
      { icon: <WorkRounded />, label: 'Experience', value: p.experience?.length ? `${p.experience.length} position(s)` : '' },
      { icon: <SchoolRounded />, label: 'Education', value: p.education?.length ? `${p.education.length} entr${p.education.length > 1 ? 'ies' : 'y'}` : '' },
      { icon: <DescriptionRounded />, label: 'Summary', value: p.summary ? `${p.summary.slice(0, 100)}…` : '' },
    ].filter((f) => f.value);
  }, [preview]);

  const prefs = form.preferences || {};

  return (
    <Box sx={{ pb: dirty ? 10 : 0 }}>
      <PageHeader eyebrow="Resume & profile" title="Your career profile" subtitle="Your profile powers job matching and every AI tool. The more complete it is, the better your results." />

      <Grid container spacing={3}>
        {/* ── Left column ── */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Card sx={{ p: 3, textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
              <Box sx={{ position: 'absolute', inset: '0 0 auto 0', height: 72, background: 'linear-gradient(120deg,#4f46e5,#a855f7)' }} />
              <Box sx={{ position: 'relative', display: 'inline-block', mt: 2 }}>
                <Avatar src={form.avatar || undefined} sx={{ width: 96, height: 96, fontSize: 32, fontWeight: 700, bgcolor: 'primary.main', border: '4px solid', borderColor: 'background.paper' }}>
                  {getInitials(form.name)}
                </Avatar>
                <Tooltip title="Change photo">
                  <IconButton
                    size="small"
                    onClick={() => avatarRef.current?.click()}
                    aria-label="Change profile photo"
                    sx={{ position: 'absolute', right: 0, bottom: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'background.subtle' } }}
                  >
                    <CameraAltRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <input ref={avatarRef} type="file" accept="image/*" hidden onChange={onAvatar} />
              </Box>
              <Typography variant="h5" sx={{ mt: 1.5, wordBreak: 'break-word' }}>
                {form.name || 'Your name'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {form.title || 'Your job title'}
              </Typography>
              {form.location && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <LocationOnRounded sx={{ fontSize: 14 }} /> {form.location}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2.5, p: 1.5, borderRadius: 3, bgcolor: 'background.subtle', textAlign: 'left' }}>
                <MatchRing score={strength.pct} size={52} stroke={5} />
                <Box>
                  <Typography variant="subtitle2">Profile strength</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {strength.items.find((i) => !i.done)?.label || 'Everything looks great!'}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Resume dropzone */}
            <Card
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              sx={{
                p: 2.5,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: dragging ? 'primary.main' : 'divider',
                bgcolor: dragging ? (t) => alpha(t.palette.primary.main, 0.05) : 'background.paper',
                transition: 'all .2s',
              }}
            >
              <Box component={motion.div} animate={{ y: dragging ? -4 : 0 }} sx={{ color: 'primary.main', mb: 1 }}>
                {parsing ? <CircularProgress size={32} /> : <CloudUploadRounded sx={{ fontSize: 36 }} />}
              </Box>
              <Typography variant="subtitle1">{parsing ? 'Reading your resume…' : 'Import your resume'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Drop a PDF, DOCX or TXT (max 10 MB) to auto-fill your profile. Files are processed on your device and never uploaded.
              </Typography>
              {form.cvUploaded && (
                <Chip icon={<CheckCircleRounded />} label={form.cvFileName || 'Resume uploaded'} color="success" variant="outlined" size="small" sx={{ mb: 1.5, maxWidth: '100%' }} />
              )}
              <Button variant={form.cvUploaded ? 'outlined' : 'contained'} fullWidth onClick={() => cvRef.current?.click()} disabled={parsing} startIcon={<DescriptionRounded />}>
                {form.cvUploaded ? 'Replace resume' : 'Choose file'}
              </Button>
              <input
                ref={cvRef}
                type="file"
                accept={ACCEPTED}
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </Card>
          </Box>
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionCard title="Personal information" icon={<PersonRounded fontSize="small" />}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Full name" fullWidth required value={form.name} onChange={set('name')} error={!form.name.trim()} inputProps={{ maxLength: 80 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Job title" fullWidth value={form.title} onChange={set('title')} inputProps={{ maxLength: 80 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" type="email" fullWidth value={form.email} onChange={set('email')} error={Boolean(emailError)} helperText={emailError ? 'Enter a valid email' : ''} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Phone" type="tel" fullWidth value={form.phone} onChange={set('phone')} inputProps={{ maxLength: 30 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Location" fullWidth value={form.location} onChange={set('location')} inputProps={{ maxLength: 80 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="LinkedIn" fullWidth value={form.linkedin || ''} onChange={set('linkedin')} placeholder="linkedin.com/in/you" inputProps={{ maxLength: 120 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Professional summary"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.summary}
                    onChange={set('summary')}
                    inputProps={{ maxLength: 1200 }}
                    helperText={`${(form.summary || '').length}/1200 · 2–4 sentences that mirror the roles you want`}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard title="Job preferences" subtitle="Used to rank your job matches" icon={<TuneRounded fontSize="small" />}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={ROLE_SUGGESTIONS}
                    value={prefs.roles || []}
                    onChange={(_, v) => setPref('roles', v.map((s) => s.trim()).filter(Boolean).slice(0, 6))}
                    renderTags={(value, getTagProps) => value.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} key={option} />)}
                    renderInput={(params) => <TextField {...params} label="Target roles" placeholder="Type and press Enter" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Work model
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    fullWidth
                    value={prefs.workModels || []}
                    onChange={(_, v) => setPref('workModels', v)}
                    aria-label="Preferred work models"
                  >
                    {['Remote', 'Hybrid', 'Onsite'].map((m) => (
                      <ToggleButton key={m} value={m} sx={{ fontWeight: 600 }}>
                        {m}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField select label="Level" fullWidth value={prefs.level || 'Mid'} onChange={(e) => setPref('level', e.target.value)}>
                    {['Entry', 'Mid', 'Senior', 'Lead'].map((l) => (
                      <MenuItem key={l} value={l}>
                        {l}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Min salary"
                    type="number"
                    fullWidth
                    value={prefs.salaryMin ?? ''}
                    onChange={(e) => setPref('salaryMin', e.target.value === '' ? '' : Math.max(0, Math.min(999, Number(e.target.value))))}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: <InputAdornment position="end">k</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard title="Skills" subtitle={`${form.skills.length} skills · matching is based on these`} icon={<BuildRounded fontSize="small" />}>
              <Autocomplete
                multiple
                freeSolo
                options={SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s))}
                value={form.skills}
                onChange={(_, v) => setForm((f) => ({ ...f, skills: [...new Set(v.map((s) => s.trim()).filter(Boolean))].slice(0, 50) }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => <Chip label={option} color="primary" variant="outlined" {...getTagProps({ index })} key={option} />)
                }
                renderInput={(params) => <TextField {...params} placeholder={form.skills.length ? 'Add more…' : 'e.g. React, TypeScript'} helperText="Press Enter to add a skill" />}
              />
            </SectionCard>

            <SectionCard
              title="Experience"
              icon={<WorkRounded fontSize="small" />}
              action={
                <Button size="small" startIcon={<AddRounded />} onClick={() => setForm((f) => ({ ...f, experience: [{ id: uid('e'), role: '', company: '', period: '', description: '' }, ...f.experience] }))}>
                  Add
                </Button>
              }
            >
              {form.experience.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No experience yet. Add a position or import your resume.
                </Typography>
              )}
              <AnimatePresence initial={false}>
                {form.experience.map((exp, idx) => (
                  <Box key={exp.id || idx} component={motion.div} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ overflow: 'hidden' }}>
                    <Box sx={{ p: 2, mb: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => setForm((f) => ({ ...f, experience: f.experience.filter((_, i) => i !== idx) }))}
                        aria-label="Remove position"
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </IconButton>
                      <Grid container spacing={1.5} sx={{ pr: 4 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Role" fullWidth value={exp.role} onChange={(e) => setListItem('experience', idx, 'role', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Company" fullWidth value={exp.company} onChange={(e) => setListItem('experience', idx, 'company', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Period" fullWidth placeholder="2021 – Present" value={exp.period} onChange={(e) => setListItem('experience', idx, 'period', e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Key achievements"
                            fullWidth
                            multiline
                            minRows={2}
                            value={exp.description}
                            onChange={(e) => setListItem('experience', idx, 'description', e.target.value)}
                            helperText={exp.description && !/\d/.test(exp.description) ? 'Tip: add a number (%, users, time saved) to show impact' : ' '}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
              </AnimatePresence>
            </SectionCard>

            <SectionCard
              title="Education"
              icon={<SchoolRounded fontSize="small" />}
              action={
                <Button size="small" startIcon={<AddRounded />} onClick={() => setForm((f) => ({ ...f, education: [{ id: uid('ed'), degree: '', school: '', year: '' }, ...f.education] }))}>
                  Add
                </Button>
              }
            >
              {form.education.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No education added.
                </Typography>
              )}
              <AnimatePresence initial={false}>
                {form.education.map((edu, idx) => (
                  <Box key={edu.id || idx} component={motion.div} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ overflow: 'hidden' }}>
                    <Box sx={{ p: 2, mb: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, i) => i !== idx) }))}
                        aria-label="Remove education"
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </IconButton>
                      <Grid container spacing={1.5} sx={{ pr: 4 }}>
                        <Grid item xs={12} sm={5}>
                          <TextField label="Degree" fullWidth value={edu.degree} onChange={(e) => setListItem('education', idx, 'degree', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField label="School" fullWidth value={edu.school} onChange={(e) => setListItem('education', idx, 'school', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField label="Year" fullWidth value={edu.year} onChange={(e) => setListItem('education', idx, 'year', e.target.value.replace(/[^\d]/g, '').slice(0, 4))} inputProps={{ inputMode: 'numeric' }} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
              </AnimatePresence>
            </SectionCard>
          </Box>
        </Grid>
      </Grid>

      {/* Sticky unsaved-changes bar */}
      <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 24 }, zIndex: (t) => t.zIndex.snackbar, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <AnimatePresence>
        {dirty && (
          <Box
            component={motion.div}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            sx={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pl: 2.5,
              pr: 1,
              py: 1,
              borderRadius: 99,
              bgcolor: '#111827',
              color: '#fff',
              boxShadow: '0 16px 40px rgba(0,0,0,.3)',
              width: 'max-content',
              maxWidth: 'calc(100vw - 32px)',
            }}
            role="status"
          >
            <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              You have unsaved changes
            </Typography>
            <Button size="small" startIcon={<UndoRounded />} onClick={() => setForm(profile)} sx={{ color: '#cbd5e1' }}>
              Discard
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveRounded />} onClick={save} sx={{ borderRadius: 99 }}>
              Save changes
            </Button>
          </Box>
        )}
      </AnimatePresence>
      </Box>

      {/* Parsed resume preview */}
      <Dialog open={Boolean(preview)} onClose={() => applyParsed(false)} fullWidth maxWidth="sm" aria-labelledby="cv-dialog-title">
        <DialogTitle id="cv-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeRounded color="primary" /> We read your resume
        </DialogTitle>
        <DialogContent dividers>
          {previewFields.length ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Apply these details to your profile? You can review and edit everything afterwards.
              </Alert>
              <List dense disablePadding>
                {previewFields.map((f) => (
                  <ListItem key={f.label} disablePadding sx={{ py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{f.icon}</ListItemIcon>
                    <ListItemText
                      primary={f.label}
                      secondary={f.value}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', fontWeight: 500 }}
                    />
                  </ListItem>
                ))}
              </List>
              <LinearProgress variant="determinate" value={Math.round((previewFields.length / 9) * 100)} sx={{ mt: 2 }} />
              <Typography variant="caption" color="text.secondary">
                {previewFields.length} of 9 sections detected
              </Typography>
            </>
          ) : (
            <Alert severity="warning">We couldn't detect structured sections in this file. It will be saved, and you can fill in your profile manually.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => applyParsed(false)}>Just save file</Button>
          {previewFields.length > 0 && (
            <Button variant="contained" onClick={() => applyParsed(true)} startIcon={<CheckCircleRounded />}>
              Apply to profile
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
