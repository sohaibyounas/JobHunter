// Explainable job ↔ profile matching. Every score can be broken down so the UI
// can tell the user *why* a job fits, not just a number.

const ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  'react.js': 'react',
  reactjs: 'react',
  'node': 'node.js',
  nodejs: 'node.js',
  'next': 'next.js',
  nextjs: 'next.js',
  postgres: 'postgresql',
  'ci/cd': 'ci/cd',
  a11y: 'accessibility',
  'unit testing': 'testing',
  jest: 'testing',
  'react testing library': 'testing',
  cypress: 'testing',
  playwright: 'testing',
  tailwind: 'tailwind css',
  'design system': 'design systems',
};

export const normalizeSkill = (s = '') => {
  const k = s.trim().toLowerCase();
  return ALIASES[k] || k;
};

const LEVEL_YEARS = { Entry: 0, Mid: 3, Senior: 5, Lead: 7 };

/** Rough total years of experience from "2019 – 2021" / "2021 – Present" periods. */
export function estimateYears(experience = []) {
  const now = new Date().getFullYear();
  let total = 0;
  for (const e of experience) {
    const years = String(e.period || '').match(/(19|20)\d{2}/g);
    if (!years) continue;
    const start = Number(years[0]);
    const end = /present|current|now/i.test(e.period) ? now : Number(years[years.length - 1]);
    if (end >= start) total += Math.max(end - start, 0.5);
  }
  return Math.round(total);
}

function titleSimilarity(jobTitle, targets) {
  const words = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['and', 'the', 'for'].includes(w));
  const jt = new Set(words(jobTitle));
  let best = 0;
  for (const target of targets) {
    const tw = words(target);
    if (!tw.length) continue;
    const hits = tw.filter((w) => jt.has(w) || (w === 'frontend' && jt.has('ui')) || (w === 'developer' && jt.has('engineer')) || (w === 'engineer' && jt.has('developer'))).length;
    best = Math.max(best, hits / tw.length);
  }
  return best;
}

export function computeMatch(job, profile) {
  const profileSkills = new Set((profile.skills || []).map(normalizeSkill));
  const jobSkills = job.skills || [];
  const matched = jobSkills.filter((s) => profileSkills.has(normalizeSkill(s)));
  const missing = jobSkills.filter((s) => !profileSkills.has(normalizeSkill(s)));
  const skillsPct = jobSkills.length ? matched.length / jobSkills.length : 0.5;

  const years = estimateYears(profile.experience);
  const need = LEVEL_YEARS[job.level] ?? 3;
  let expPct;
  if (years >= need) expPct = years - need > 6 && need < 3 ? 0.7 : 1; // very over-qualified for entry roles
  else expPct = Math.max(0.25, 1 - (need - years) * 0.22);

  const targets = [profile.title, ...(profile.preferences?.roles || [])].filter(Boolean);
  const titlePct = Math.max(0.3, titleSimilarity(job.title, targets));

  const prefModels = profile.preferences?.workModels || [];
  const prefBonus = prefModels.length && prefModels.includes(job.workModel) ? 0.04 : 0;

  const raw = skillsPct * 0.5 + expPct * 0.3 + titlePct * 0.2 + prefBonus;
  const score = Math.round(Math.min(0.98, Math.max(0.35, raw)) * 100);

  return {
    score,
    label: matchLabel(score),
    skills: { matched, missing, pct: Math.round(skillsPct * 100) },
    experience: { years, need, pct: Math.round(expPct * 100) },
    title: { pct: Math.round(titlePct * 100) },
  };
}

export function matchLabel(score) {
  if (score >= 85) return 'Strong match';
  if (score >= 70) return 'Good match';
  if (score >= 55) return 'Fair match';
  return 'Stretch role';
}

export function matchColor(score) {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#6366f1';
  if (score >= 55) return '#f59e0b';
  return '#f43f5e';
}

// ─── Keyword analysis for the Job Fit / ATS analyzer ───────────────────────

const KNOWN_KEYWORDS = [
  'react', 'typescript', 'javascript', 'node.js', 'next.js', 'graphql', 'rest', 'css', 'html', 'sass',
  'tailwind css', 'redux', 'vue', 'angular', 'svelte', 'webpack', 'vite', 'testing', 'accessibility',
  'performance', 'design systems', 'storybook', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd',
  'sql', 'postgresql', 'mongodb', 'python', 'java', 'go', 'ruby', 'c#', 'c++', 'react native', 'ios',
  'android', 'figma', 'agile', 'scrum', 'leadership', 'mentoring', 'communication', 'a/b testing',
  'analytics', 'seo', 'security', 'microservices', 'webgl', 'git', 'linux', 'machine learning',
];

export function extractKeywords(text = '') {
  const lower = ` ${text.toLowerCase().replace(/[\n\r]+/g, ' ')} `;
  const found = new Set();
  for (const kw of KNOWN_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    if (new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`, 'i').test(lower)) found.add(kw);
  }
  // Alias detection (e.g. "Jest" → testing)
  for (const [alias, target] of Object.entries(ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    if (new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`, 'i').test(lower)) found.add(target);
  }
  return [...found];
}

/** Compares a job description against the profile and returns an ATS-style report. */
export function analyzeFit(jdText, profile) {
  const jdKeywords = extractKeywords(jdText);
  const profileText = [
    profile.title,
    profile.summary,
    ...(profile.skills || []),
    ...(profile.experience || []).map((e) => `${e.role} ${e.description}`),
  ].join(' ');
  const have = new Set([...extractKeywords(profileText), ...(profile.skills || []).map(normalizeSkill)]);

  const matched = jdKeywords.filter((k) => have.has(k));
  const missing = jdKeywords.filter((k) => !have.has(k));
  const keywordPct = jdKeywords.length ? matched.length / jdKeywords.length : 0;

  const checks = [
    { label: 'Summary is present and specific', ok: (profile.summary || '').length >= 80 },
    { label: 'Experience bullets include numbers', ok: (profile.experience || []).some((e) => /\d/.test(e.description || '')) },
    { label: 'At least 8 skills listed', ok: (profile.skills || []).length >= 8 },
    { label: 'Contact details complete', ok: Boolean(profile.email && profile.phone && profile.location) },
    { label: 'Job title aligns with the role', ok: titleSimilarity(jdText.slice(0, 200), [profile.title || '']) >= 0.5 },
  ];
  const checksPct = checks.filter((c) => c.ok).length / checks.length;
  const score = Math.round((keywordPct * 0.7 + checksPct * 0.3) * 100);

  const suggestions = [];
  if (missing.length) {
    suggestions.push(`Add these keywords where they are true for you: ${missing.slice(0, 6).join(', ')}.`);
  }
  if (!checks[1].ok) suggestions.push('Quantify impact in your experience bullets (e.g. "cut load time by 40%").');
  if (!checks[0].ok) suggestions.push('Write a 2–3 sentence summary that mirrors the job title and top requirements.');
  if (!checks[2].ok) suggestions.push('List more of your relevant tools and skills. ATS systems match on exact terms.');
  if (keywordPct >= 0.8) suggestions.push('Great keyword coverage. Focus on tailoring your top bullet points to this role.');

  return { score, matched, missing, checks, suggestions, keywordCount: jdKeywords.length };
}

/** Profile completeness used for the dashboard "profile strength" widget. */
export function profileStrength(profile, trackedCount = 0, contactsCount = 0) {
  const items = [
    { key: 'cv', label: 'Upload your resume', done: Boolean(profile.cvUploaded), to: '/profile' },
    { key: 'summary', label: 'Write a professional summary', done: (profile.summary || '').length >= 80, to: '/profile' },
    { key: 'skills', label: 'Add at least 8 skills', done: (profile.skills || []).length >= 8, to: '/profile' },
    { key: 'exp', label: 'Add work experience', done: (profile.experience || []).length > 0, to: '/profile' },
    { key: 'track', label: 'Track 5 jobs', done: trackedCount >= 5, to: '/jobs' },
    { key: 'network', label: 'Add a networking contact', done: contactsCount > 0, to: '/networking' },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, pct: Math.round((done / items.length) * 100) };
}
