// Client-side "AI" writers. They are deterministic templates driven by the user's
// profile and the selected job, so the app works offline with no API key.
// To use a real LLM later, swap these functions for calls to your own backend
// (never ship model API keys in frontend code).

import { firstName } from '../data/helpers';
import { computeMatch } from './matching';

const pick = (arr, seed = 0) => arr[Math.abs(seed) % arr.length];
const topSkills = (profile, n = 3) => (profile.skills || []).slice(0, n);
const latestRole = (profile) => (profile.experience || [])[0];
const listJoin = (items) => {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
};

/** Pull the first sentence that contains a number, a nice "proof point". */
function proofPoint(profile) {
  for (const e of profile.experience || []) {
    const sentence = (e.description || '').split(/(?<=\.)\s+/).find((s) => /\d/.test(s));
    if (sentence) return { text: sentence.replace(/\.$/, ''), company: e.company };
  }
  const e = latestRole(profile);
  return e?.description ? { text: e.description.replace(/\.$/, ''), company: e.company } : null;
}

const lowerFirst = (s = '') => s.charAt(0).toLowerCase() + s.slice(1);

// ─── Cover letter ──────────────────────────────────────────────────────────

export function generateCoverLetter({ profile, job, tone = 'Professional', extra = '' }) {
  const company = job.company || 'your company';
  const role = job.title || 'this role';
  const match = job.skills ? computeMatch(job, profile) : null;
  const skills = match?.skills.matched.length ? match.skills.matched.slice(0, 3) : topSkills(profile);
  const proof = proofPoint(profile);
  const current = latestRole(profile);

  const openers = {
    Professional: `I am writing to apply for the ${role} position at ${company}. With a background as a ${profile.title || 'professional'} and hands-on experience in ${listJoin(skills)}, I am confident I can contribute from day one.`,
    Enthusiastic: `I was genuinely excited to see the ${role} opening at ${company}. Building with ${listJoin(skills)} is what I love doing most, and the chance to do it on your team is exactly the next step I have been looking for.`,
    Concise: `I'd like to be considered for the ${role} role at ${company}. I bring ${listJoin(skills)} experience and a track record of shipping measurable results.`,
  };

  const middle = [
    current
      ? `In my current role as ${current.role} at ${current.company}, ${proof ? `I ${lowerFirst(proof.text.replace(/^(I\s)/i, ''))}` : 'I own features end to end, from planning through launch'}.`
      : proof
        ? `Most recently, I ${lowerFirst(proof.text)}.`
        : '',
    job.responsibilities?.length
      ? `Your focus on "${lowerFirst(job.responsibilities[0])}" stood out to me. It is closely aligned with work I have done and want to keep doing.`
      : `What draws me to ${company} is the opportunity to work on products with real impact.`,
    extra ? extra.trim() : '',
  ]
    .filter(Boolean)
    .join(' ');

  const closers = {
    Professional: `I would welcome the opportunity to discuss how my experience can support ${company}'s goals. Thank you for your time and consideration.`,
    Enthusiastic: `I would love to talk about how I can help ${company} build what's next. Thank you so much for considering my application!`,
    Concise: `I'd be glad to talk further. Thank you for your consideration.`,
  };

  return [
    `Dear ${company} Hiring Team,`,
    openers[tone] || openers.Professional,
    middle,
    closers[tone] || closers.Professional,
    `Best regards,\n${profile.name || ''}${profile.email ? `\n${profile.email}` : ''}${profile.phone ? ` · ${profile.phone}` : ''}`,
  ].join('\n\n');
}

// ─── LinkedIn optimizer ────────────────────────────────────────────────────

export function generateHeadlines(profile) {
  const title = profile.title || 'Professional';
  const s = topSkills(profile, 3);
  const proof = proofPoint(profile);
  const years = (profile.experience || []).length ? '5+ yrs' : '';
  return [
    `${title} | ${s.join(' · ')} | Building fast, accessible products`,
    `${title}${years ? ` (${years})` : ''} · Helping teams ship better UX with ${s[0] || 'modern tools'}`,
    proof ? `${title} · ${proof.text.length < 70 ? proof.text : `${s.join(', ')} specialist`}` : `${title} · ${s.join(', ')} specialist`,
    `${title} → open to ${(profile.preferences?.roles || [title])[0]} roles | ${s.slice(0, 2).join(' & ')}`,
  ];
}

export function generateAbout(profile) {
  const s = topSkills(profile, 5);
  const proof = proofPoint(profile);
  const current = latestRole(profile);
  return [
    `I'm a ${profile.title || 'professional'} who loves turning complex problems into simple, useful products.`,
    current ? `Right now I'm ${current.role} at ${current.company}, where ${proof ? lowerFirst(proof.text) : 'I lead high-impact projects'}.` : '',
    `My toolkit: ${s.join(', ')}.`,
    `What I care about: clean code, measurable impact, and teams that ship with craft.`,
    `I'm currently exploring ${(profile.preferences?.roles || ['new'])[0]} opportunities${profile.location ? ` in ${profile.location} or remote` : ''}. Feel free to reach out${profile.email ? ` at ${profile.email}` : ''}.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function linkedinChecklist(profile) {
  return [
    { label: 'Professional photo uploaded', ok: Boolean(profile.avatar) },
    { label: 'Headline includes target role and skills', ok: Boolean(profile.title) && (profile.skills || []).length >= 3 },
    { label: 'About section is 3+ sentences', ok: (profile.summary || '').split('.').length > 3 },
    { label: 'Experience includes quantified results', ok: (profile.experience || []).some((e) => /\d+%|\d+k|\d+ (users|teams|people)/i.test(e.description || '')) },
    { label: 'At least 10 skills listed', ok: (profile.skills || []).length >= 10 },
    { label: 'LinkedIn URL added to profile', ok: Boolean(profile.linkedin) },
    { label: 'Education listed', ok: (profile.education || []).length > 0 },
  ];
}

// ─── Elevator pitch ────────────────────────────────────────────────────────

export function generatePitch(profile, { length = '30s', audience = 'Recruiter' } = {}) {
  const s = topSkills(profile, 2);
  const proof = proofPoint(profile);
  const current = latestRole(profile);
  const role = (profile.preferences?.roles || [profile.title])[0];

  const intro = `Hi, I'm ${firstName(profile.name)}, a ${profile.title || 'professional'}${current ? ` at ${current.company}` : ''}.`;
  const value = `I specialize in ${listJoin(s)}${proof ? `, and most recently I ${lowerFirst(proof.text)}` : ''}.`;
  const ask = {
    Recruiter: `I'm looking for my next ${role} role where I can have that kind of impact, and I'd love to hear what you're hiring for.`,
    'Hiring Manager': `I'd love to learn about the challenges your team is facing and how I could help solve them.`,
    Networking: `I'm always keen to meet people in the space. What are you working on these days?`,
  }[audience];

  if (length === '15s') return `${intro} ${ask}`;
  if (length === '60s') {
    const extra = `Before that, I ${(profile.experience || [])[1] ? `worked as ${profile.experience[1].role} at ${profile.experience[1].company}, where I ${lowerFirst(profile.experience[1].description || 'grew my craft').replace(/\.$/, '')}` : 'built a strong foundation in product engineering'}. What sets me apart is that I pair strong technical depth with a real focus on users and business outcomes.`;
    return `${intro} ${value} ${extra} ${ask}`;
  }
  return `${intro} ${value} ${ask}`;
}

// ─── Mock interview feedback ───────────────────────────────────────────────

const FILLERS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'kind of', 'sort of'];

export function evaluateAnswer(question, answer, category = 'Behavioral') {
  const text = answer.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const lower = ` ${text.toLowerCase()} `;

  const star = {
    Situation: /\b(when|at my|while|situation|context|project|team was|we were)\b/.test(lower),
    Task: /\b(my (role|task|goal|responsibility)|i needed to|i was responsible|goal was|had to)\b/.test(lower),
    Action: /\b(i (built|led|created|designed|implemented|decided|wrote|organized|proposed|refactored|introduced|worked))\b/.test(lower),
    Result: /\b(result|as a result|outcome|improved|reduced|increased|saved|grew|led to|which meant)\b/.test(lower),
  };
  const hasMetrics = /\d/.test(text);
  const fillerCount = FILLERS.reduce((n, f) => n + (lower.match(new RegExp(`\\s${f}\\s`, 'g')) || []).length, 0);
  const usesI = (lower.match(/\si\s/g) || []).length;
  const usesWe = (lower.match(/\swe\s/g) || []).length;

  let score = 40;
  const strengths = [];
  const improvements = [];

  if (wc >= 80 && wc <= 300) {
    score += 15;
    strengths.push('Good length: detailed without rambling.');
  } else if (wc < 80) {
    improvements.push(`Your answer is short (${wc} words). Aim for 120–250 words with a concrete example.`);
  } else {
    score += 5;
    improvements.push(`Your answer is long (${wc} words). Trim to the most important points.`);
  }

  if (category === 'Behavioral' || category === 'Leadership' || category === 'Situational') {
    const starHits = Object.values(star).filter(Boolean).length;
    score += starHits * 7;
    if (starHits >= 3) strengths.push('Clear STAR structure (Situation, Task, Action, Result).');
    const missing = Object.entries(star).filter(([, ok]) => !ok).map(([k]) => k);
    if (missing.length) improvements.push(`Strengthen the STAR parts that are missing: ${missing.join(', ')}.`);
  } else {
    const techTerms = (lower.match(/\b(because|trade-?off|for example|e\.g\.|first|then|finally|measure|profile|cache|memo|bundle|render|test)\b/g) || []).length;
    score += Math.min(techTerms * 4, 28);
    if (techTerms >= 4) strengths.push('Structured explanation with reasoning and examples.');
    else improvements.push('Explain your reasoning step by step and mention trade-offs.');
  }

  if (hasMetrics) {
    score += 10;
    strengths.push('Uses numbers to show impact.');
  } else {
    improvements.push('Add a metric (%, time saved, users affected) to make the impact concrete.');
  }

  if (fillerCount > 2) {
    score -= Math.min(fillerCount * 2, 10);
    improvements.push(`Cut filler words (found ${fillerCount}). Pause instead.`);
  }
  if (usesWe > usesI * 2 && usesWe > 3) {
    improvements.push('You say "we" a lot. Make your own contribution clear with "I".');
  } else if (usesI > 0) {
    strengths.push('Your personal contribution is clear.');
  }

  score = Math.max(10, Math.min(98, score));
  const verdict = score >= 80 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 50 ? 'Developing' : 'Needs work';
  return { score, verdict, strengths, improvements, wordCount: wc, star };
}

// ─── Networking outreach ───────────────────────────────────────────────────

export function generateOutreach(contact, profile, kind = 'intro') {
  const me = firstName(profile.name);
  const them = firstName(contact.name);
  if (kind === 'followup') {
    return `Hi ${them},\n\nI hope you're doing well! I wanted to follow up on my last message. I'm still very interested in opportunities at ${contact.company} and would really value 15 minutes of your time to hear about your experience there.\n\nThanks so much,\n${me}`;
  }
  if (kind === 'referral') {
    return `Hi ${them},\n\nThank you again for chatting with me. I've found a role at ${contact.company} that fits my background as a ${profile.title}. Would you be comfortable referring me? I'm happy to send my resume and a short blurb to make it easy.\n\nI really appreciate it,\n${me}`;
  }
  return `Hi ${them},\n\nI'm ${me}, a ${profile.title} working with ${topSkills(profile, 2).join(' and ')}. I've been following ${contact.company}'s work and would love to hear about your experience as ${/^[aeiou]/i.test(contact.role || '') ? 'an' : 'a'} ${contact.role || 'member of the team'}. Would you be open to a quick 15-minute chat?\n\nBest,\n${me}`;
}

// ─── Copilot ───────────────────────────────────────────────────────────────

/**
 * Returns { text, actions? } where actions are { label, to } links the chat
 * renders as buttons. ctx = { profile, rankedJobs, tracked, contacts }.
 */
export function copilotReply(input, ctx) {
  const q = input.toLowerCase();
  const { profile, rankedJobs = [], tracked = [], contacts = [] } = ctx;
  const count = (s) => tracked.filter((t) => t.status === s).length;

  if (/\b(hi|hello|hey)\b/.test(q) && q.length < 20) {
    return { text: `Hi ${firstName(profile.name)}! Ask me about your best job matches, your pipeline, resume tips, interviews or salary.` };
  }

  if (/(best|top|recommend|match|which job|good fit)/.test(q)) {
    const top = rankedJobs.slice(0, 3);
    if (!top.length) return { text: 'I have no recommendations yet. Add skills to your profile so I can match you.' };
    return {
      text: `Your top matches right now:\n\n${top
        .map((j, i) => `${i + 1}. ${j.title} at ${j.company} · ${j.match.score}% (${j.match.label})`)
        .join('\n')}\n\n${top[0].company} is the strongest fit: you already have ${top[0].match.skills.matched.slice(0, 3).join(', ') || 'most of the core skills'}.`,
      actions: [{ label: 'Open job matches', to: '/jobs' }],
    };
  }

  if (/(pipeline|status|progress|how am i doing|applications?|stats)/.test(q)) {
    return {
      text: `Here's your pipeline:\n• Saved: ${count('saved')}\n• Applied: ${count('applied')}\n• Interviewing: ${count('interview')}\n• Offers: ${count('offer')}\n• Rejected: ${count('rejected')}\n\n${count('offer') ? 'Congrats on the offer! Ask me about negotiating it.' : count('interview') ? 'You have interviews in progress. Want to practice with a mock interview?' : 'Keep momentum: aim for 2–3 tailored applications a day.'}`,
      actions: [{ label: 'Open tracker', to: '/tracker' }, ...(count('interview') ? [{ label: 'Practice interview', to: '/interview' }] : [])],
    };
  }

  if (/(skill|gap|learn|missing)/.test(q)) {
    const freq = {};
    rankedJobs.slice(0, 8).forEach((j) => j.match.skills.missing.forEach((s) => (freq[s] = (freq[s] || 0) + 1)));
    const gaps = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (!gaps.length) return { text: 'Your skills already cover your top matches really well. Focus on showing depth and impact.', actions: [{ label: 'Skills gap matrix', to: '/skills' }] };
    return {
      text: `Across your top matches, the skills that come up most often that aren't in your profile are:\n\n${gaps.map(([s, n]) => `• ${s} (in ${n} jobs)`).join('\n')}\n\nIf you already have any of these, add them to your profile and your match scores will go up right away. Check out the Skills Gap Matrix for complete learning roadmaps.`,
      actions: [{ label: 'Skills gap matrix', to: '/skills' }, { label: 'Update skills in profile', to: '/profile' }],
    };
  }

  if (/(cover letter)/.test(q)) {
    return { text: 'I can draft a tailored cover letter from your profile and any job in your list. Pick the job and a tone.', actions: [{ label: 'Write a cover letter', to: '/ai-tools/cover-letter' }] };
  }

  if (/(resume|cv|ats)/.test(q)) {
    return {
      text: `Resume tips that move the needle:\n• Mirror the job title and top 5 keywords from the posting.\n• Start each bullet with an action verb and end with a number.\n• Keep it to 1 page under 7 years of experience, 2 pages above.\n• Use a simple layout. Columns and tables can break ATS parsing.\n\nTry the Job Fit Analyzer to see exactly which keywords you're missing for a role, or view your saved documents.`,
      actions: [{ label: 'Job Fit Analyzer', to: '/ai-tools/job-fit' }, { label: 'Document Library', to: '/documents' }],
    };
  }

  if (/(linkedin|headline)/.test(q)) {
    return { text: 'Recruiters search LinkedIn by title and skills. Your headline should include your target role plus 2–3 core skills. I can generate options for you.', actions: [{ label: 'Optimize LinkedIn', to: '/ai-tools/linkedin' }] };
  }

  if (/(interview|prepare|behavioral|star)/.test(q)) {
    return {
      text: 'Use the STAR method for behavioral questions: Situation (1 sentence), Task (1 sentence), Action (most of your answer, say "I"), Result (with a number). Prepare 5–6 stories you can adapt. Then practice out loud.',
      actions: [{ label: 'Start mock interview', to: '/interview' }],
    };
  }

  if (/(salary|pay|compensation|negotiat|offer)/.test(q)) {
    const relevant = rankedJobs.filter((j) => j.salaryMin && j.type === 'Full-time').slice(0, 6);
    const lo = relevant.length ? Math.round(relevant.reduce((a, j) => a + j.salaryMin, 0) / relevant.length) : null;
    const hi = relevant.length ? Math.round(relevant.reduce((a, j) => a + j.salaryMax, 0) / relevant.length) : null;
    return {
      text: `${lo ? `Based on your closest matches, roles like yours pay about $${lo}k – $${hi}k base. ` : ''}Negotiation tips:\n• Let them name a number first if you can.\n• Anchor at the top of the range and justify with impact.\n• Negotiate the whole package: base, equity, sign-on, start date.\n• Check out the Salary Insights tool for geographic benchmarking and copyable negotiation scripts!`,
      actions: [{ label: 'Salary Insights & Scripts', to: '/salary' }],
    };
  }

  if (/(follow.?up|email|haven'?t heard)/.test(q)) {
    const due = contacts.filter((c) => c.followUp && new Date(c.followUp) <= new Date()).length;
    return {
      text: `Follow up 5–7 business days after applying. Keep it short: restate interest, mention one relevant win, and offer to share more.${due ? `\n\nHeads up: you have ${due} networking follow-up${due > 1 ? 's' : ''} due.` : ''}`,
      actions: [{ label: 'Open networking', to: '/networking' }],
    };
  }

  if (/(network|referral|connect|insider)/.test(q)) {
    return { text: 'Referrals are the #1 way to get interviews. Start with alumni and former colleagues at your target companies. Send a short, specific note and ask for 15 minutes, not a job.', actions: [{ label: 'Open networking', to: '/networking' }] };
  }

  return {
    text: "I can help with job matches, your application pipeline, skill gaps, resumes, cover letters, LinkedIn, interviews, salary and networking. Try one of the suggestions below.",
  };
}
