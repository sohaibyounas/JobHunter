import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { defaultProfile, defaultSettings, jobs as jobCatalog, seedContacts, seedTracked } from '../data/mockData';
import { formatSalary, uid } from '../data/helpers';
import { computeMatch } from '../lib/matching';
import { clearPersistedState, usePersistentState } from '../hooks/usePersistentState';

const AppContext = createContext(null);

export const STATUSES = [
  { id: 'saved', label: 'Saved', color: '#8b5cf6' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview', label: 'Interviewing', color: '#f59e0b' },
  { id: 'offer', label: 'Offer', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#f43f5e' },
];
export const statusMeta = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

export function AppProvider({ children }) {
  const [profile, setProfile] = usePersistentState('profile', defaultProfile, { delay: 400 });
  const [tracked, setTracked] = usePersistentState('tracked', seedTracked);
  const [contacts, setContacts] = usePersistentState('contacts', seedContacts);
  const [hiddenJobs, setHiddenJobs] = usePersistentState('hiddenJobs', []);
  const [settings, setSettings] = usePersistentState('settings', defaultSettings);
  const [interviewHistory, setInterviewHistory] = usePersistentState('interviews', []);

  const [copilot, setCopilot] = useState({ open: false, prompt: '' });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success', key: 0 });

  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const darkMode = settings.darkMode ?? prefersDark;

  const notify = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity, key: Date.now() });
  }, []);
  const closeToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);

  // ── Settings ──
  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [setSettings]);
  const toggleDarkMode = useCallback(
    () => setSettings((s) => ({ ...s, darkMode: !(s.darkMode ?? prefersDark) })),
    [setSettings, prefersDark],
  );

  // ── Profile ──
  const updateProfile = useCallback((patch) => setProfile((p) => ({ ...p, ...patch })), [setProfile]);

  // ── Jobs: ranked by explainable match score ──
  const rankedJobs = useMemo(
    () =>
      jobCatalog
        .map((job) => ({
          ...job,
          postedAt: new Date(Date.now() - job.daysAgo * 86_400_000).toISOString(),
          match: computeMatch(job, profile),
        }))
        .sort((a, b) => b.match.score - a.match.score),
    [profile],
  );
  const getJob = useCallback((id) => rankedJobs.find((j) => String(j.id) === String(id)), [rankedJobs]);

  // ── Tracker ──
  const trackedByJobId = useMemo(() => {
    const map = new Map();
    tracked.forEach((t) => t.jobId != null && map.set(t.jobId, t));
    return map;
  }, [tracked]);

  const addTracked = useCallback(
    (item) => {
      const now = new Date().toISOString();
      const status = item.status || 'saved';
      const entry = {
        id: uid('t'),
        jobId: null,
        notes: '',
        url: '',
        location: '',
        salary: '',
        domain: '',
        ...item,
        status,
        createdAt: now,
        updatedAt: now,
        history: [{ status, at: now }],
      };
      setTracked((prev) => [entry, ...prev]);
      return entry;
    },
    [setTracked],
  );

  const updateTracked = useCallback(
    (id, patch) => {
      setTracked((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const now = new Date().toISOString();
          const statusChanged = patch.status && patch.status !== t.status;
          return {
            ...t,
            ...patch,
            updatedAt: now,
            history: statusChanged ? [...(t.history || []), { status: patch.status, at: now }] : t.history,
          };
        }),
      );
    },
    [setTracked],
  );

  const removeTracked = useCallback((id) => setTracked((prev) => prev.filter((t) => t.id !== id)), [setTracked]);

  const jobToTracked = (job, status) => ({
    jobId: job.id,
    title: job.title,
    company: job.company,
    domain: job.domain,
    location: job.location,
    salary: formatSalary(job),
    status,
  });

  const toggleSaveJob = useCallback(
    (job) => {
      const existing = trackedByJobId.get(job.id);
      if (existing) {
        if (existing.status === 'saved') {
          removeTracked(existing.id);
          notify('Removed from saved jobs', 'info');
        } else {
          notify(`Already in your tracker as "${statusMeta(existing.status).label}"`, 'info');
        }
        return;
      }
      addTracked(jobToTracked(job, 'saved'));
      notify(`Saved ${job.title} at ${job.company}`);
    },
    [trackedByJobId, addTracked, removeTracked, notify],
  );

  const markApplied = useCallback(
    (job) => {
      const existing = trackedByJobId.get(job.id);
      if (existing && existing.status !== 'saved') {
        notify('You already applied to this job', 'info');
        return;
      }
      if (existing) updateTracked(existing.id, { status: 'applied' });
      else addTracked(jobToTracked(job, 'applied'));
      notify(`Marked as applied: ${job.company}. Good luck!`);
    },
    [trackedByJobId, addTracked, updateTracked, notify],
  );

  // ── Hidden ("not interested") jobs ──
  const hideJob = useCallback(
    (jobId) => {
      setHiddenJobs((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
      notify('Job hidden. We will show you fewer like it.', 'info');
    },
    [setHiddenJobs, notify],
  );
  const unhideJob = useCallback((jobId) => setHiddenJobs((prev) => prev.filter((id) => id !== jobId)), [setHiddenJobs]);

  // ── Contacts ──
  const saveContact = useCallback(
    (contact) => {
      if (contact.id) {
        setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, ...contact } : c)));
        return contact;
      }
      const created = { ...contact, id: uid('c') };
      setContacts((prev) => [created, ...prev]);
      return created;
    },
    [setContacts],
  );
  const removeContact = useCallback((id) => setContacts((prev) => prev.filter((c) => c.id !== id)), [setContacts]);

  // ── Interviews ──
  const addInterviewResult = useCallback(
    (result) => setInterviewHistory((prev) => [{ id: uid('iv'), at: new Date().toISOString(), ...result }, ...prev].slice(0, 50)),
    [setInterviewHistory],
  );

  // ── Copilot ──
  const openCopilot = useCallback((prompt = '') => setCopilot({ open: true, prompt }), []);
  const closeCopilot = useCallback(() => setCopilot({ open: false, prompt: '' }), []);

  const resetAllData = useCallback(() => {
    clearPersistedState();
    setProfile(defaultProfile);
    setTracked(seedTracked);
    setContacts(seedContacts);
    setHiddenJobs([]);
    setSettings(defaultSettings);
    setInterviewHistory([]);
    notify('Workspace reset to demo data', 'info');
  }, [setProfile, setTracked, setContacts, setHiddenJobs, setSettings, setInterviewHistory, notify]);

  const exportData = useCallback(
    () => JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), profile, tracked, contacts, settings, interviewHistory }, null, 2),
    [profile, tracked, contacts, settings, interviewHistory],
  );

  const value = useMemo(
    () => ({
      profile, updateProfile,
      rankedJobs, getJob,
      tracked, trackedByJobId, addTracked, updateTracked, removeTracked, toggleSaveJob, markApplied,
      hiddenJobs, hideJob, unhideJob,
      contacts, saveContact, removeContact,
      interviewHistory, addInterviewResult,
      settings, updateSettings, darkMode, toggleDarkMode,
      copilot, openCopilot, closeCopilot,
      toast, notify, closeToast,
      resetAllData, exportData,
    }),
    [
      profile, updateProfile, rankedJobs, getJob, tracked, trackedByJobId, addTracked, updateTracked, removeTracked,
      toggleSaveJob, markApplied, hiddenJobs, hideJob, unhideJob, contacts, saveContact, removeContact,
      interviewHistory, addInterviewResult, settings, updateSettings, darkMode, toggleDarkMode, copilot,
      openCopilot, closeCopilot, toast, notify, closeToast, resetAllData, exportData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
