import {
  SpaceDashboardRounded,
  TravelExploreRounded,
  ViewKanbanRounded,
  BadgeRounded,
  AutoAwesomeRounded,
  RecordVoiceOverRounded,
  GroupsRounded,
  SettingsRounded,
  PaidRounded,
  InsightsRounded,
  FolderRounded,
  TimelineRounded,
} from '@mui/icons-material';

export const NAV_SECTIONS = [
  {
    title: 'Job search',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: SpaceDashboardRounded },
      { to: '/jobs', label: 'Job Matches', icon: TravelExploreRounded, badgeKey: 'jobs' },
      { to: '/tracker', label: 'Job Tracker', icon: ViewKanbanRounded },
      { to: '/timeline', label: 'Career Timeline', icon: TimelineRounded },
    ],
  },
  {
    title: 'AI tools',
    items: [
      { to: '/profile', label: 'Resume & Profile', icon: BadgeRounded },
      { to: '/ai-tools', label: 'AI Toolkit', icon: AutoAwesomeRounded },
      { to: '/interview', label: 'Mock Interview', icon: RecordVoiceOverRounded },
      { to: '/skills', label: 'Skills Gap', icon: InsightsRounded },
      { to: '/salary', label: 'Salary Insights', icon: PaidRounded },
    ],
  },
  {
    title: 'Network & Docs',
    items: [
      { to: '/networking', label: 'Networking', icon: GroupsRounded, badgeKey: 'followups' },
      { to: '/documents', label: 'Documents', icon: FolderRounded },
    ],
  },
];

export const SETTINGS_ITEM = { to: '/settings', label: 'Settings', icon: SettingsRounded };

export const ALL_NAV_ITEMS = [...NAV_SECTIONS.flatMap((s) => s.items), SETTINGS_ITEM];

export const MOBILE_NAV = [
  { to: '/dashboard', label: 'Home', icon: SpaceDashboardRounded },
  { to: '/jobs', label: 'Jobs', icon: TravelExploreRounded },
  { to: '/tracker', label: 'Tracker', icon: ViewKanbanRounded },
  { to: '/ai-tools', label: 'AI Tools', icon: AutoAwesomeRounded },
];
