import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FolderRounded,
  DescriptionRounded,
  ArticleOutlined,
  EditNoteRounded,
  CampaignRounded,
  SearchRounded,
  GridViewRounded,
  ViewListRounded,
  ContentCopyRounded,
  DownloadRounded,
  DeleteOutlineRounded,
  AddRounded,
  AutoAwesomeRounded,
  MoreVertRounded,
  CloseRounded,
  StorageRounded,
  CheckCircleRounded,
  PictureAsPdfRounded,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import StatCard from '../components/Common/StatCard';
import EmptyState from '../components/Common/EmptyState';
import { Stagger, MotionItem } from '../components/Common/motion';
import { useApp } from '../context/AppContext';
import { copyToClipboard, downloadText, formatDate, timeAgo, uid } from '../data/helpers';

const INITIAL_DOCUMENTS = [
  {
    id: 'doc_1',
    title: 'Senior Frontend Resume (ATS-Optimized)',
    category: 'resume',
    targetCompany: 'Google',
    targetRole: 'Senior React Developer',
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    format: 'ATS-Safe PDF / TXT',
    content: `ALEX JOHNSON\nSan Francisco, CA · alex.johnson@email.com · linkedin.com/in/alexjohnson\n\nPROFESSIONAL SUMMARY\nSenior Frontend Developer with 5+ years of experience engineering high-performance React and TypeScript applications. Reduced load times by 40% and led enterprise design system initiatives.\n\nTECHNICAL SKILLS\nReact, TypeScript, Next.js, Redux, Node.js, GraphQL, Tailwind CSS, AWS, Docker, Jest, CI/CD\n\nWORK EXPERIENCE\nSenior Frontend Developer — TechCorp Inc. (2021 – Present)\n• Architected scalable web dashboard serving 200,000+ monthly active users.\n• Improved Core Web Vitals resulting in 40% reduction in initial bundle load time.`,
  },
  {
    id: 'doc_2',
    title: 'Tailored Cover Letter - Stripe',
    category: 'cover_letter',
    targetCompany: 'Stripe',
    targetRole: 'Staff Frontend Engineer',
    updatedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    format: 'Text / Markdown',
    content: `Dear Stripe Hiring Team,\n\nI am writing to express my enthusiastic interest in the Staff Frontend Engineer position at Stripe. Having been an avid user of Stripe's clean API design and developer documentation for years, the opportunity to contribute directly to your developer surfaces is compelling.\n\nThroughout my career leading frontend architecture at high-growth startups, I have prioritized performance, developer ergonomics, and rock-solid reliability. I would be thrilled to bring this dedication to Stripe.`,
  },
  {
    id: 'doc_3',
    title: 'Elevator Pitch (30s Hiring Manager Intro)',
    category: 'pitch',
    targetCompany: 'General / Networking',
    targetRole: 'Engineering Leadership',
    updatedAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    format: 'Text Script',
    content: `I am a Senior Frontend Engineer who specializes in building blazing-fast React and TypeScript interfaces. Over the last 5 years, I've led team rebuilds that cut load times by 40% and scaled systems to hundreds of thousands of users. Right now, I'm seeking high-impact roles where I can combine technical rigor with intuitive product design.`,
  },
  {
    id: 'doc_4',
    title: 'LinkedIn Outreach - Alumni Referral Request',
    category: 'outreach',
    targetCompany: 'Airbnb',
    targetRole: 'Full Stack Engineer',
    updatedAt: new Date(Date.now() - 11 * 86_400_000).toISOString(),
    format: 'Message Draft',
    content: `Hi Sarah! Hope you're doing great. I noticed you're currently engineering at Airbnb and also graduated from UC Berkeley. I'm currently preparing an application for the Full Stack role on your Guest Experience team and would love to ask 2 quick questions about the engineering culture if you ever have 5 minutes. Appreciate your time!`,
  },
];

const CATEGORY_META = {
  resume: { label: 'Resumes', icon: ArticleOutlined, color: '#ec4899' },
  cover_letter: { label: 'Cover Letters', icon: EditNoteRounded, color: '#0ea5e9' },
  pitch: { label: 'Elevator Pitches', icon: CampaignRounded, color: '#f59e0b' },
  outreach: { label: 'Outreach & Notes', icon: DescriptionRounded, color: '#8b5cf6' },
};

export default function Documents() {
  const { notify } = useApp();
  const [docs, setDocs] = useState(INITIAL_DOCUMENTS);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeDocForMenu, setActiveDocForMenu] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (q && ![d.title, d.targetCompany, d.targetRole].some((s) => s.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [docs, categoryFilter, search]);

  const handleDelete = (docId) => {
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    notify('Document removed from your library', 'info');
  };

  const handleCopy = (text) => {
    copyToClipboard(text);
    notify('Document content copied to clipboard');
  };

  const handleDownload = (doc) => {
    downloadText(`${doc.title}.txt`, doc.content);
    notify(`Downloaded ${doc.title}.txt`);
  };

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        eyebrow="Asset management"
        title="Document & Asset Library"
        subtitle="Manage and export all your tailored resumes, cover letters, elevator pitches, and message drafts in one centralized workspace."
        actions={
          <Button
            component={RouterLink}
            to="/ai-tools/resume"
            variant="contained"
            startIcon={<AddRounded />}
          >
            Create New Document
          </Button>
        }
      />

      <Stagger delay={0.05}>
        {/* KPI Summary */}
        <MotionItem>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, sm: 2 },
              mb: 3,
            }}
          >
            <StatCard
              label="Total Assets"
              value={docs.length}
              icon={<FolderRounded />}
              color="#6366f1"
              hint="Saved locally on device"
            />
            <StatCard
              label="Resumes"
              value={docs.filter((d) => d.category === 'resume').length}
              icon={<ArticleOutlined />}
              color="#ec4899"
              hint="Tailored variants"
            />
            <StatCard
              label="Cover Letters"
              value={docs.filter((d) => d.category === 'cover_letter').length}
              icon={<EditNoteRounded />}
              color="#0ea5e9"
              hint="Company customized"
            />
            <StatCard
              label="Pitches & Outreach"
              value={docs.filter((d) => d.category === 'pitch' || d.category === 'outreach').length}
              icon={<CampaignRounded />}
              color="#f59e0b"
              hint="Ready for interviews"
            />
          </Box>
        </MotionItem>

        {/* Filter and View bar */}
        <MotionItem>
          <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'center' },
              }}
            >
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents by title, company or role…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto' }}>
                <Chip
                  label="All Docs"
                  onClick={() => setCategoryFilter('all')}
                  color={categoryFilter === 'all' ? 'primary' : 'default'}
                  variant={categoryFilter === 'all' ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <Chip
                    key={key}
                    label={meta.label}
                    onClick={() => setCategoryFilter(key)}
                    color={categoryFilter === key ? 'primary' : 'default'}
                    variant={categoryFilter === key ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600 }}
                  />
                ))}

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={viewMode}
                  onChange={(_, v) => v && setViewMode(v)}
                  sx={{ ml: 'auto' }}
                >
                  <ToggleButton value="grid" aria-label="Grid view">
                    <GridViewRounded fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="List view">
                    <ViewListRounded fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Card>
        </MotionItem>

        {/* Document Grid / List */}
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FolderRounded />}
              title="No documents found"
              description={search ? 'No saved documents match your search.' : 'Create your first tailored resume or cover letter using our AI tools.'}
              actionLabel="Go to AI Toolkit"
              onAction={() => window.location.assign('/ai-tools')}
            />
          </Card>
        ) : viewMode === 'grid' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <AnimatePresence>
              {filtered.map((doc) => {
                const meta = CATEGORY_META[doc.category] || CATEGORY_META.resume;
                const Icon = meta.icon;
                return (
                  <Card
                    key={doc.id}
                    component={motion.div}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'border-color .15s, box-shadow .15s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: (t) => `0 8px 24px ${alpha(t.palette.primary.main, 0.08)}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(meta.color, 0.12),
                          color: meta.color,
                        }}
                      >
                        <Icon />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {doc.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          Target: <b>{doc.targetCompany}</b>
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setActiveDocForMenu(doc);
                        }}
                      >
                        <MoreVertRounded fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.subtle',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        lineHeight: 1.5,
                        color: 'text.secondary',
                        height: 90,
                        overflow: 'hidden',
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {doc.content}
                    </Box>

                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.disabled">
                        Updated {timeAgo(doc.updatedAt)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Preview">
                          <Button size="small" onClick={() => setPreviewDoc(doc)}>
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Copy Content">
                          <IconButton size="small" onClick={() => handleCopy(doc.content)}>
                            <ContentCopyRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownload(doc)}>
                            <DownloadRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </AnimatePresence>
          </Box>
        ) : (
          <Card sx={{ overflow: 'hidden' }}>
            {filtered.map((doc, idx) => {
              const meta = CATEGORY_META[doc.category] || CATEGORY_META.resume;
              const Icon = meta.icon;
              return (
                <Box
                  key={doc.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'auto 1fr auto', md: 'auto 2fr 1fr 1fr auto' },
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderTop: idx ? '1px solid' : 0,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(meta.color, 0.12),
                      color: meta.color,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {doc.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {doc.targetCompany} · {doc.targetRole}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                    {doc.format}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', md: 'block' } }}>
                    {formatDate(doc.updatedAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" onClick={() => setPreviewDoc(doc)}>
                      Preview
                    </Button>
                    <IconButton size="small" onClick={() => handleCopy(doc.content)}>
                      <ContentCopyRounded fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(doc)}>
                      <DownloadRounded fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {previewDoc?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Target: {previewDoc?.targetCompany} ({previewDoc?.targetRole})
              </Typography>
            </Box>
            <IconButton onClick={() => setPreviewDoc(null)}>
              <CloseRounded />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.subtle',
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              {previewDoc?.content}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              startIcon={<ContentCopyRounded />}
              onClick={() => handleCopy(previewDoc?.content)}
            >
              Copy Text
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadRounded />}
              onClick={() => handleDownload(previewDoc)}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>

        {/* Card Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              if (activeDocForMenu) handleCopy(activeDocForMenu.content);
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <ContentCopyRounded fontSize="small" />
            </ListItemIcon>
            Copy Text
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (activeDocForMenu) handleDownload(activeDocForMenu);
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <DownloadRounded fontSize="small" />
            </ListItemIcon>
            Download
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              if (activeDocForMenu) handleDelete(activeDocForMenu.id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteOutlineRounded fontSize="small" color="error" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </Stagger>
    </Box>
  );
}

