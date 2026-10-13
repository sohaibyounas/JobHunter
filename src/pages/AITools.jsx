import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, Chip, Grid, MenuItem, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DescriptionOutlined, EditNoteRounded, LinkedIn, CampaignRounded, AutoAwesomeRounded, CheckCircleRounded, CancelRounded,
  LightbulbOutlined, ContentCopyRounded, ArrowForwardRounded, ArticleOutlined, PictureAsPdfRounded,
} from '@mui/icons-material';
import { buildResumeHtml, TEMPLATES } from '../lib/resumeTemplate';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import MatchRing from '../components/Common/MatchRing';
import AIOutput from '../components/Common/AIOutput';
import JobPicker from '../components/Common/JobPicker';
import { useApp } from '../context/AppContext';
import { analyzeFit } from '../lib/matching';
import { generateAbout, generateCoverLetter, generateHeadlines, generatePitch, linkedinChecklist } from '../lib/ai';
import { copyToClipboard } from '../data/helpers';

const TOOLS = [
  { id: 'job-fit', label: 'Job Fit & ATS', icon: <DescriptionOutlined /> },
  { id: 'resume', label: 'Resume Builder', icon: <ArticleOutlined /> },
  { id: 'cover-letter', label: 'Cover Letter', icon: <EditNoteRounded /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <LinkedIn /> },
  { id: 'pitch', label: 'Elevator Pitch', icon: <CampaignRounded /> },
];

const jobToText = (j) =>
  j ? `${j.title} at ${j.company}\n\n${j.description}\n\nResponsibilities:\n${j.responsibilities.map((r) => `- ${r}`).join('\n')}\n\nQualifications:\n${j.qualifications.map((r) => `- ${r}`).join('\n')}\n\nSkills: ${j.skills.join(', ')}` : '';

/** Simulated "thinking" delay so results feel considered rather than instant. */
function useGenerate() {
  const [loading, setLoading] = useState(false);
  const run = (fn, ms = 700) => {
    setLoading(true);
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(fn());
        setLoading(false);
      }, ms),
    );
  };
  return [loading, run];
}

// ─── Job Fit / ATS ─────────────────────────────────────────────────────────

function JobFit({ initialJob }) {
  const { profile } = useApp();
  const [job, setJob] = useState(initialJob);
  const [jd, setJd] = useState(jobToText(initialJob));
  const [report, setReport] = useState(null);
  const [loading, run] = useGenerate();

  const analyze = async () => setReport(await run(() => analyzeFit(jd, profile), 900));

  useEffect(() => {
    if (initialJob) analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <SectionCard title="Job description" subtitle="Pick a job or paste any posting">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <JobPicker
              value={job}
              onChange={(j) => {
                setJob(j);
                setJd(jobToText(j));
              }}
            />
            <TextField
              multiline
              minRows={10}
              maxRows={20}
              label="Job description"
              value={jd}
              onChange={(e) => setJd(e.target.value.slice(0, 15000))}
              placeholder="Paste the full job posting here…"
            />
            <Button variant="contained" size="large" onClick={analyze} disabled={jd.trim().length < 40 || loading} startIcon={<AutoAwesomeRounded />}>
              {loading ? 'Analyzing…' : 'Analyze my fit'}
            </Button>
            {jd.trim().length > 0 && jd.trim().length < 40 && (
              <Typography variant="caption" color="text.secondary">
                Add a bit more of the job description to analyze.
              </Typography>
            )}
          </Box>
        </SectionCard>
      </Grid>
      <Grid item xs={12} md={7}>
        <AnimatePresence mode="wait">
          {!report ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
              <Card sx={{ height: '100%', minHeight: 300, display: 'grid', placeItems: 'center', p: 4, textAlign: 'center' }}>
                <Box>
                  <DescriptionOutlined sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">See how your resume scores</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
                    We compare your profile against the posting the way an applicant tracking system does, then tell you exactly what to fix.
                  </Typography>
                </Box>
              </Card>
            </motion.div>
          ) : (
            <motion.div key={jd.length + report.score} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card sx={{ p: { xs: 2, sm: 3 }, display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                  <MatchRing score={report.score} size={110} stroke={9} label="ATS score" />
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {report.score >= 80 ? 'Excellent fit' : report.score >= 60 ? 'Good fit, with gaps' : 'Needs tailoring'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You match <b>{report.matched.length}</b> of <b>{report.keywordCount}</b> keywords we detected in this posting.
                      {report.missing.length > 0 && ' Add the missing ones where they honestly apply to you.'}
                    </Typography>
                  </Box>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <SectionCard title="Matched keywords">
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {report.matched.length ? report.matched.map((k) => <Chip key={k} size="small" icon={<CheckCircleRounded />} label={k} sx={{ bgcolor: alpha('#10b981', 0.12), color: 'success.dark', '& .MuiChip-icon': { color: 'success.main' } }} />) : <Typography variant="body2" color="text.secondary">None yet</Typography>}
                      </Box>
                    </SectionCard>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SectionCard title="Missing keywords">
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {report.missing.length ? report.missing.map((k) => <Chip key={k} size="small" icon={<CancelRounded />} label={k} sx={{ bgcolor: alpha('#f43f5e', 0.1), color: 'error.dark', '& .MuiChip-icon': { color: 'error.main' } }} />) : <Typography variant="body2" color="text.secondary">Nothing missing 🎉</Typography>}
                      </Box>
                    </SectionCard>
                  </Grid>
                </Grid>

                <SectionCard title="Resume checks">
                  {report.checks.map((c) => (
                    <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.6 }}>
                      {c.ok ? <CheckCircleRounded sx={{ color: 'success.main', fontSize: 20 }} /> : <CancelRounded sx={{ color: 'error.main', fontSize: 20 }} />}
                      <Typography variant="body2">{c.label}</Typography>
                    </Box>
                  ))}
                </SectionCard>

                {report.suggestions.length > 0 && (
                  <Alert icon={<LightbulbOutlined />} severity="info" action={<Button component={RouterLink} to="/profile" size="small" color="inherit">Edit profile</Button>}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      How to improve
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {report.suggestions.map((s) => (
                        <li key={s}>
                          <Typography variant="body2">{s}</Typography>
                        </li>
                      ))}
                    </Box>
                  </Alert>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Grid>
    </Grid>
  );
}

// ─── Cover letter ──────────────────────────────────────────────────────────

function CoverLetter({ initialJob }) {
  const { profile } = useApp();
  const [job, setJob] = useState(initialJob);
  const [manual, setManual] = useState({ title: '', company: '' });
  const [tone, setTone] = useState('Professional');
  const [extra, setExtra] = useState('');
  const [text, setText] = useState('');
  const [loading, run] = useGenerate();

  const target = job || { ...manual, skills: null };
  const canGenerate = job || (manual.title.trim() && manual.company.trim());

  const generate = async () => {
    setText('');
    setText(await run(() => generateCoverLetter({ profile, job: target, tone, extra })));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <SectionCard title="Details" subtitle="Personalized from your profile">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <JobPicker value={job} onChange={setJob} />
            {!job && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  or enter it manually
                </Typography>
                <TextField label="Job title" value={manual.title} onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))} inputProps={{ maxLength: 100 }} />
                <TextField label="Company" value={manual.company} onChange={(e) => setManual((m) => ({ ...m, company: e.target.value }))} inputProps={{ maxLength: 80 }} />
              </>
            )}
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Tone
              </Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" value={tone} onChange={(_, v) => v && setTone(v)}>
                {['Professional', 'Enthusiastic', 'Concise'].map((t) => (
                  <ToggleButton key={t} value={t} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    {t}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <TextField
              label="Anything to highlight? (optional)"
              multiline
              minRows={3}
              value={extra}
              onChange={(e) => setExtra(e.target.value.slice(0, 600))}
              placeholder="e.g. I've been a Stripe user for years and love the API design."
            />
            <Button variant="contained" size="large" onClick={generate} disabled={!canGenerate || loading} startIcon={<AutoAwesomeRounded />}>
              {loading ? 'Writing…' : text ? 'Rewrite' : 'Generate cover letter'}
            </Button>
          </Box>
        </SectionCard>
      </Grid>
      <Grid item xs={12} md={7}>
        <SectionCard title="Your cover letter">
          <AIOutput
            text={text}
            filename={`Cover Letter - ${target.company || 'Company'}.txt`}
            onRegenerate={generate}
            minRows={16}
            placeholder="Choose a job and tone, then generate a tailored cover letter."
          />
        </SectionCard>
      </Grid>
    </Grid>
  );
}

// ─── LinkedIn ──────────────────────────────────────────────────────────────

function LinkedInTool() {
  const { profile, notify } = useApp();
  const [headlines, setHeadlines] = useState([]);
  const [about, setAbout] = useState('');
  const [loading, run] = useGenerate();
  const checklist = linkedinChecklist(profile);
  const score = Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 100);

  const generate = async () => {
    const res = await run(() => ({ h: generateHeadlines(profile), a: generateAbout(profile) }));
    setHeadlines(res.h);
    setAbout(res.a);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <SectionCard title="Profile review" subtitle="What recruiters see first">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MatchRing score={score} size={80} stroke={7} label="score" />
            <Typography variant="body2" color="text.secondary">
              {score >= 80 ? 'Your profile is in great shape.' : 'A few changes will make you much easier to find.'}
            </Typography>
          </Box>
          {checklist.map((c) => (
            <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.6 }}>
              {c.ok ? <CheckCircleRounded sx={{ color: 'success.main', fontSize: 20 }} /> : <CancelRounded sx={{ color: 'text.disabled', fontSize: 20 }} />}
              <Typography variant="body2" color={c.ok ? 'text.primary' : 'text.secondary'}>
                {c.label}
              </Typography>
            </Box>
          ))}
          <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }} onClick={generate} disabled={loading} startIcon={<AutoAwesomeRounded />}>
            {loading ? 'Generating…' : headlines.length ? 'Regenerate' : 'Generate headline & About'}
          </Button>
        </SectionCard>
      </Grid>
      <Grid item xs={12} md={7}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SectionCard title="Headline options" subtitle="Max 220 characters on LinkedIn">
            {headlines.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Generate to see headline ideas tailored to your skills and target roles.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {headlines.map((h, i) => (
                  <Box
                    key={h}
                    component={motion.div}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {h}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyRounded />}
                      onClick={() => copyToClipboard(h).then(() => notify('Headline copied'))}
                    >
                      Copy
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
          <SectionCard title="About section">
            <AIOutput text={about} filename="LinkedIn About.txt" minRows={8} placeholder="Your About section will appear here." />
          </SectionCard>
        </Box>
      </Grid>
    </Grid>
  );
}

// ─── Resume builder ────────────────────────────────────────────────────────

function ResumeBuilder() {
  const { profile, notify } = useApp();
  const [template, setTemplate] = useState('modern');
  const frameRef = useRef(null);
  const html = useMemo(() => buildResumeHtml(profile, template), [profile, template]);
  const checks = [
    { label: 'Contact details complete', ok: Boolean(profile.email && profile.phone && profile.location) },
    { label: 'Summary written (80+ characters)', ok: (profile.summary || '').length >= 80 },
    { label: '8+ skills listed', ok: (profile.skills || []).length >= 8 },
    { label: 'Experience includes measurable results', ok: (profile.experience || []).some((e) => /\d/.test(e.description || '')) },
    { label: 'Education added', ok: (profile.education || []).length > 0 },
    { label: 'Single-column, ATS-safe layout', ok: true },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  const print = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
    notify('Choose "Save as PDF" as the destination to download your resume', 'info');
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
          <SectionCard title="Template" subtitle="All templates are ATS-friendly">
            <ToggleButtonGroup exclusive fullWidth size="small" value={template} onChange={(_, v) => v && setTemplate(v)} sx={{ mb: 2 }}>
              {Object.entries(TEMPLATES).map(([id, t]) => (
                <ToggleButton key={id} value={id} sx={{ fontWeight: 600 }}>
                  {t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button fullWidth variant="contained" size="large" startIcon={<PictureAsPdfRounded />} onClick={print}>
              Download PDF
            </Button>
            <Button fullWidth component={RouterLink} to="/profile" sx={{ mt: 1 }}>
              Edit resume content
            </Button>
          </SectionCard>
          <SectionCard title="Resume score">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <MatchRing score={score} size={72} stroke={7} />
              <Typography variant="body2" color="text.secondary">
                {score === 100 ? 'Your resume is complete and ready to send.' : 'Fix the items below to strengthen your resume.'}
              </Typography>
            </Box>
            {checks.map((c) => (
              <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}>
                {c.ok ? <CheckCircleRounded sx={{ color: 'success.main', fontSize: 19 }} /> : <CancelRounded sx={{ color: 'text.disabled', fontSize: 19 }} />}
                <Typography variant="body2">{c.label}</Typography>
              </Box>
            ))}
          </SectionCard>
        </Box>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'background.subtle' }}>
          <Box
            component={motion.div}
            key={template}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 8px 30px rgba(15,23,42,.12)', overflow: 'hidden', aspectRatio: '8.5 / 11', maxHeight: { xs: 'none', md: '80vh' }, mx: 'auto' }}
          >
            {/* No scripts may run inside the preview; same-origin lets the parent trigger print */}
            <Box component="iframe" ref={frameRef} title="Resume preview" srcDoc={html} sandbox="allow-same-origin allow-modals" sx={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
          </Box>
        </Card>
      </Grid>
    </Grid>
  );
}

// ─── Elevator pitch ────────────────────────────────────────────────────────

function Pitch() {
  const { profile } = useApp();
  const [length, setLength] = useState('30s');
  const [audience, setAudience] = useState('Recruiter');
  const [text, setText] = useState('');
  const [loading, run] = useGenerate();

  const generate = async () => {
    setText('');
    setText(await run(() => generatePitch(profile, { length, audience })));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <SectionCard title="Pitch settings" subtitle="For career fairs, intros and calls">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Length
              </Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" value={length} onChange={(_, v) => v && setLength(v)}>
                {['15s', '30s', '60s'].map((t) => (
                  <ToggleButton key={t} value={t} sx={{ fontWeight: 600 }}>
                    {t}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <TextField select label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {['Recruiter', 'Hiring Manager', 'Networking'].map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" size="large" onClick={generate} disabled={loading} startIcon={<AutoAwesomeRounded />}>
              {loading ? 'Writing…' : 'Generate pitch'}
            </Button>
            <Alert severity="info" icon={<LightbulbOutlined />}>
              Practice it out loud until it sounds natural, not memorized. Then try it in a mock interview.
            </Alert>
          </Box>
        </SectionCard>
      </Grid>
      <Grid item xs={12} md={7}>
        <SectionCard title="Your elevator pitch">
          <AIOutput text={text} filename="Elevator Pitch.txt" onRegenerate={generate} minRows={8} placeholder="Choose a length and audience, then generate." />
          {text && (
            <Button component={RouterLink} to="/interview" endIcon={<ArrowForwardRounded />} sx={{ mt: 2 }}>
              Practice in mock interview
            </Button>
          )}
        </SectionCard>
      </Grid>
    </Grid>
  );
}

export default function AITools() {
  const { tool = 'job-fit' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getJob } = useApp();
  const initialJob = useMemo(() => (params.get('job') ? getJob(params.get('job')) || null : null), [params, getJob]);
  const current = TOOLS.some((t) => t.id === tool) ? tool : 'job-fit';

  return (
    <Box>
      <PageHeader
        eyebrow="AI toolkit"
        title="Stand out with AI"
        subtitle="Tailor your resume, write cover letters, polish LinkedIn and craft your pitch, all from your profile in seconds."
      />
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs value={current} onChange={(_, v) => navigate(`/ai-tools/${v}`)} variant="scrollable" allowScrollButtonsMobile aria-label="AI tools">
          {TOOLS.map((t) => (
            <Tab key={t.id} value={t.id} label={t.label} icon={t.icon} iconPosition="start" sx={{ '& .MuiTab-iconWrapper': { fontSize: 20 } }} />
          ))}
        </Tabs>
      </Box>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          {current === 'job-fit' && <JobFit initialJob={initialJob} />}
          {current === 'resume' && <ResumeBuilder />}
          {current === 'cover-letter' && <CoverLetter initialJob={initialJob} />}
          {current === 'linkedin' && <LinkedInTool />}
          {current === 'pitch' && <Pitch />}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
