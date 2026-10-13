# JobHunter AI

An AI-powered job search workspace: personalized job matching, an application tracker, resume and cover letter tools, LinkedIn optimization, mock interviews and a networking CRM, all in one responsive app.

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Greeting, weekly application goal, pipeline KPIs, 14-day activity chart, funnel, top matches, profile-strength checklist, follow-ups and activity timeline |
| **Job Matches** | Jobs ranked by an explainable match score (skills, experience, title). Recommended / Saved / Applied / Hidden tabs, filters (work model, type, level, date, salary, H1B), sorting, and a detail drawer with "why this fits", skill gaps, company info and insider connections |
| **Job Tracker** | Kanban board (Saved → Applied → Interviewing → Offer → Rejected) with drag & drop on desktop and a move menu on touch devices, list view, notes, links and a status timeline |
| **Resume & Profile** | Resume import (PDF/DOCX/TXT, parsed on-device), editable profile, job preferences, skills, experience and education with an unsaved-changes bar |
| **AI Toolkit** | Job Fit / ATS analyzer, Resume Builder (3 templates, PDF export), Cover Letter writer, LinkedIn headline & About generator, Elevator Pitch |
| **Mock Interview** | Question bank by category, timer, voice dictation (where supported), STAR-based scoring and practice history |
| **Networking** | Contact CRM with statuses, follow-up reminders and AI outreach messages |
| **AI Copilot** | Chat assistant that knows your profile, matches and pipeline |
| **Everywhere** | ⌘K / Ctrl+K command palette, notifications, light/dark/system theme, framer-motion animations, mobile bottom nav |

## Tech stack

React 18 · React Router 6 · MUI 5 · framer-motion · Vite 5 · pdf.js · mammoth

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build → build/
npm run preview   # serve the production build
```

## Project structure

```
src/
├── App.jsx                 # Theme, motion config, error boundary
├── context/AppContext.jsx  # Global state (persisted to localStorage)
├── hooks/                  # usePersistentState
├── lib/
│   ├── matching.js         # Explainable job matching + ATS analysis
│   ├── ai.js               # Cover letter, LinkedIn, pitch, interview feedback, copilot
│   ├── cvParser.js         # Resume text extraction & parsing
│   └── resumeTemplate.js   # ATS-friendly resume HTML templates
├── data/                   # Seed data and helpers
├── components/
│   ├── Layout/             # Sidebar, Header, MobileNav, CommandPalette
│   ├── Jobs/ Tracker/ Copilot/ Common/
└── pages/                  # Route-level pages (lazy loaded)
```

## Production notes

- **Data storage:** everything is stored in the user's browser (`localStorage`, prefixed `jobhunter:v2:`). Users can export a JSON backup from Settings. For accounts and cross-device sync, add a backend (e.g. Supabase or Firebase) behind `AppContext`.
- **AI:** the "AI" features are deterministic, client-side generators so the app works with no API key. To use a real LLM, call **your own backend** from `src/lib/ai.js`. Never put model API keys in frontend code.
- **Job data:** jobs come from `src/data/mockData.js`. Real listings need a jobs API on a server (most job boards don't allow direct browser scraping).
- **Deployment:** `vercel.json` sets up the SPA rewrite, immutable caching for hashed assets, and security headers (HSTS, nosniff, frame-deny, referrer and permissions policies).
- **Performance:** pages are code-split. pdf.js and mammoth only download when a resume is uploaded.
- **Accessibility:** skip link, keyboard-navigable command palette and cards, ARIA labels, visible focus rings, and `prefers-reduced-motion` respected for all animations.
