import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  InsightsRounded,
  CheckCircleRounded,
  AddCircleOutlineRounded,
  AutoAwesomeRounded,
  SchoolRounded,
  TrendingUpRounded,
  BuildRounded,
  LightbulbOutlined,
  ArrowForwardRounded,
  PsychologyRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import StatCard from '../components/Common/StatCard';
import MatchRing from '../components/Common/MatchRing';
import { Stagger, MotionItem } from '../components/Common/motion';
import { useApp } from '../context/AppContext';

const SKILL_LEARNING_GUIDES = {
  'Next.js': {
    category: 'Frameworks',
    difficulty: 'Intermediate',
    estTime: '1-2 weeks',
    salaryImpact: '+8%',
    desc: 'Server-side rendering, App Router, and full-stack React capabilities demanded by modern high-traffic startups.',
    resources: 'Next.js Official Learn Course, Fullstack React Masterclass',
  },
  Docker: {
    category: 'DevOps & Cloud',
    difficulty: 'Intermediate',
    estTime: '2-3 weeks',
    salaryImpact: '+12%',
    desc: 'Containerization standard required across full-stack and senior frontend roles for local environment parity and CI/CD pipelines.',
    resources: 'Docker for Web Developers, Container Fundamentals',
  },
  'System Design': {
    category: 'Architecture',
    difficulty: 'Advanced',
    estTime: '3-4 weeks',
    salaryImpact: '+18%',
    desc: 'Client-side caching, latency budgets, state architecture, and micro-frontend design patterns.',
    resources: 'Frontend System Design Playbook, Web Architecture Patterns',
  },
  GraphQL: {
    category: 'APIs & Data',
    difficulty: 'Intermediate',
    estTime: '1 week',
    salaryImpact: '+7%',
    desc: 'Declarative data fetching with Apollo Client/Relay for high-performance enterprise applications.',
    resources: 'How to GraphQL, Apollo Client Documentation',
  },
  Python: {
    category: 'Languages',
    difficulty: 'Beginner-Friendly',
    estTime: '2-3 weeks',
    salaryImpact: '+10%',
    desc: 'Essential for AI tool orchestration, automated testing suites, and backend utility scripting.',
    resources: 'Python Crash Course, Automate the Boring Stuff',
  },
  'Tailwind CSS': {
    category: 'Styling',
    difficulty: 'Beginner',
    estTime: '3-5 days',
    salaryImpact: '+5%',
    desc: 'Modern utility-first CSS standard used across high-velocity product teams.',
    resources: 'Tailwind CSS Docs, Tailwind Labs YouTube',
  },
};

export default function SkillsGap() {
  const { profile, updateProfile, rankedJobs, notify } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Aggregated in-demand skills from all ranked jobs
  const marketDemand = useMemo(() => {
    const counts = {};
    (rankedJobs || []).forEach((j) => {
      (j?.skills || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });

    const totalJobs = Math.max(1, (rankedJobs || []).length);
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        demandPct: Math.round((count / totalJobs) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [rankedJobs]);

  const userSkillsSet = useMemo(
    () => new Set((profile?.skills || []).map((s) => s.toLowerCase())),
    [profile?.skills]
  );

  const matchedSkills = marketDemand.filter((s) =>
    userSkillsSet.has(s.name.toLowerCase())
  );
  const missingSkills = marketDemand.filter(
    (s) => !userSkillsSet.has(s.name.toLowerCase())
  );

  const coveragePct = Math.round(
    (matchedSkills.length / Math.max(1, marketDemand.length)) * 100
  );

  const addSkillToProfile = (skillName) => {
    const current = profile?.skills || [];
    if (!current.some((s) => s.toLowerCase() === skillName.toLowerCase())) {
      updateProfile({ skills: [...current, skillName] });
      notify(`Added "${skillName}" to your profile skills!`);
    }
  };

  const highDemandMissing = missingSkills.slice(0, 6);

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        eyebrow="Market readiness analysis"
        title="Skills Gap & Competency Matrix"
        subtitle="Benchmark your profile skills against live market postings to spot high-ROI missing competencies and boost your interview call rate."
        actions={
          <Button
            component={RouterLink}
            to="/profile"
            variant="outlined"
            startIcon={<BuildRounded />}
          >
            Manage Profile Skills
          </Button>
        }
      />

      <Stagger delay={0.05}>
        {/* Top KPIs */}
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
              label="Skill Coverage"
              value={`${coveragePct}%`}
              icon={<InsightsRounded />}
              color="#6366f1"
              hint="Overlap with target jobs"
            />
            <StatCard
              label="Verified Skills"
              value={profile.skills?.length || 0}
              icon={<CheckCircleRounded />}
              color="#10b981"
              hint="Listed on your profile"
            />
            <StatCard
              label="Missing Opportunities"
              value={missingSkills.length}
              icon={<AddCircleOutlineRounded />}
              color="#f59e0b"
              hint="High-demand in market"
            />
            <StatCard
              label="Top Market Trend"
              value={marketDemand[0]?.name || 'TypeScript'}
              icon={<TrendingUpRounded />}
              color="#8b5cf6"
              hint="Present in 90%+ openings"
            />
          </Box>
        </MotionItem>

        <Grid container spacing={3}>
          {/* Main Matrix */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Coverage Ring Hero */}
              <MotionItem>
                <Card
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexDirection: { xs: 'column', sm: 'row' },
                    textAlign: { xs: 'center', sm: 'left' },
                    background: (t) =>
                      `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha('#a855f7', 0.08)})`,
                  }}
                >
                  <MatchRing score={coveragePct} size={110} stroke={9} label="Readiness" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {coveragePct >= 75
                        ? 'Strong Market Alignment'
                        : coveragePct >= 50
                        ? 'Moderate Fit with High Upside'
                        : 'Opportunity to Upskill'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      You match <b>{matchedSkills.length}</b> of <b>{marketDemand.length}</b> top
                      skills requested across your currently matched job listings. Adding the top 3
                      missing skills could boost your match score by up to <b>+22%</b>.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                      {highDemandMissing.slice(0, 3).map((s) => (
                        <Button
                          key={s.name}
                          size="small"
                          variant="contained"
                          startIcon={<AddCircleOutlineRounded />}
                          onClick={() => addSkillToProfile(s.name)}
                          sx={{ borderRadius: 99 }}
                        >
                          Add {s.name}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Card>
              </MotionItem>

              {/* Skills Breakdown */}
              <MotionItem>
                <SectionCard
                  title="Market Skills Demand vs. Your Profile"
                  subtitle="Ranked by frequency in matching job listings"
                  icon={<BuildRounded fontSize="small" />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {marketDemand.slice(0, 12).map((item) => {
                      const hasIt = userSkillsSet.has(item.name.toLowerCase());
                      return (
                        <Box
                          key={item.name}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '110px 1fr auto', sm: '140px 1fr 100px auto' },
                            alignItems: 'center',
                            gap: 2,
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: hasIt ? 'transparent' : (t) => alpha(t.palette.warning.main, 0.04),
                            border: '1px solid',
                            borderColor: hasIt ? 'divider' : (t) => alpha(t.palette.warning.main, 0.2),
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {item.name}
                          </Typography>

                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Demand in matches
                              </Typography>
                              <Typography variant="caption" fontWeight={700}>
                                {item.demandPct}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={item.demandPct}
                              color={hasIt ? 'primary' : 'warning'}
                              sx={{ height: 6, borderRadius: 99 }}
                            />
                          </Box>

                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Chip
                              size="small"
                              icon={hasIt ? <CheckCircleRounded /> : <AddCircleOutlineRounded />}
                              label={hasIt ? 'In Profile' : 'Missing'}
                              color={hasIt ? 'success' : 'default'}
                              variant={hasIt ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>

                          {!hasIt && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => addSkillToProfile(item.name)}
                              sx={{ minWidth: 64, px: 1 }}
                            >
                              Add
                            </Button>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </SectionCard>
              </MotionItem>
            </Box>
          </Grid>

          {/* Right Column: High-ROI Learning Roadmap */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <MotionItem>
                <SectionCard
                  title="Targeted Upskill Roadmaps"
                  subtitle="Fastest paths to fill critical skill gaps"
                  icon={<SchoolRounded fontSize="small" />}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(SKILL_LEARNING_GUIDES).map(([skill, guide]) => {
                      const alreadyHave = userSkillsSet.has(skill.toLowerCase());
                      return (
                        <Card
                          key={skill}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: alreadyHave ? 'divider' : 'primary.main',
                            bgcolor: alreadyHave ? 'background.subtle' : 'background.paper',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {skill}
                            </Typography>
                            <Chip
                              size="small"
                              label={guide.salaryImpact}
                              color="success"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            {guide.desc}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.disabled">
                              Est: {guide.estTime}
                            </Typography>
                            {alreadyHave ? (
                              <Chip size="small" icon={<CheckCircleRounded />} label="Mastered" color="success" variant="outlined" />
                            ) : (
                              <Button
                                size="small"
                                onClick={() => addSkillToProfile(skill)}
                                sx={{ textTransform: 'none', py: 0.2 }}
                              >
                                Mark as Learned
                              </Button>
                            )}
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                </SectionCard>
              </MotionItem>

              <MotionItem>
                <Alert icon={<PsychologyRounded />} severity="info">
                  <Typography variant="subtitle2" fontWeight={700}>
                    AI Recommendation
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Highlighting <b>Next.js</b> and <b>Docker</b> in your recent experience bullet points will immediately elevate your candidacy for Full Stack and Senior Frontend roles.
                  </Typography>
                </Alert>
              </MotionItem>
            </Box>
          </Grid>
        </Grid>
      </Stagger>
    </Box>
  );
}

