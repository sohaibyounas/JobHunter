import React, { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout/Layout';

// Route-level code splitting: each page downloads only when first visited
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Jobs = lazy(() => import('../pages/Jobs'));
const Tracker = lazy(() => import('../pages/Tracker'));
const Profile = lazy(() => import('../pages/Profile'));
const AITools = lazy(() => import('../pages/AITools'));
const MockInterview = lazy(() => import('../pages/MockInterview'));
const Networking = lazy(() => import('../pages/Networking'));
const Settings = lazy(() => import('../pages/Settings'));
const SalaryInsights = lazy(() => import('../pages/SalaryInsights'));
const SkillsGap = lazy(() => import('../pages/SkillsGap'));
const Documents = lazy(() => import('../pages/Documents'));
const CareerTimeline = lazy(() => import('../pages/CareerTimeline'));
const NotFound = lazy(() => import('../pages/NotFound'));

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ai-tools" element={<AITools />} />
          <Route path="ai-tools/:tool" element={<AITools />} />
          <Route path="interview" element={<MockInterview />} />
          <Route path="networking" element={<Networking />} />
          <Route path="settings" element={<Settings />} />
          <Route path="salary" element={<SalaryInsights />} />
          <Route path="skills" element={<SkillsGap />} />
          <Route path="documents" element={<Documents />} />
          <Route path="timeline" element={<CareerTimeline />} />
          {/* Legacy URLs from v1 */}
          <Route path="applications" element={<Navigate to="/tracker" replace />} />
          <Route path="saved" element={<Navigate to="/jobs?tab=saved" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
