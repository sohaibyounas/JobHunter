import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  TimelineRounded,
  EmojiEventsRounded,
  CalendarTodayRounded,
  CheckCircleRounded,
  LockRounded,
  ArrowForwardRounded,
  ForumRounded,
  SendRounded,
  BookmarkRounded,
  SpeedRounded,
  MilitaryTechRounded,
  GroupsRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import PageHeader from "../components/Common/PageHeader";
import SectionCard from "../components/Common/SectionCard";
import StatCard from "../components/Common/StatCard";
import CompanyLogo from "../components/Common/CompanyLogo";
import EmptyState from "../components/Common/EmptyState";
import { Stagger, MotionItem } from "../components/Common/motion";
import { STATUSES, statusMeta, useApp } from "../context/AppContext";
import { formatDate, timeAgo } from "../data/helpers";

const ACHIEVEMENTS = [
  {
    id: "start",
    title: "Search Kickoff",
    desc: "Began tracking your job pipeline",
    icon: BookmarkRounded,
    color: "#8b5cf6",
    unlockedWhen: (data) => data.tracked.length > 0,
  },
  {
    id: "applied_5",
    title: "High Velocity",
    desc: "Submitted 5+ tailored applications",
    icon: SendRounded,
    color: "#3b82f6",
    unlockedWhen: (data) =>
      data.tracked.filter((t) =>
        (t.history || []).some((h) => h.status === "applied"),
      ).length >= 5,
  },
  {
    id: "interview",
    title: "Interview Ready",
    desc: "Secured at least one interview invitation",
    icon: ForumRounded,
    color: "#f59e0b",
    unlockedWhen: (data) =>
      data.tracked.some(
        (t) =>
          t.status === "interview" ||
          (t.history || []).some((h) => h.status === "interview"),
      ),
  },
  {
    id: "networker",
    title: "Network Builder",
    desc: "Added 3+ industry contacts and referrals",
    icon: GroupsRounded,
    color: "#10b981",
    unlockedWhen: (data) => data.contacts.length >= 3,
  },
  {
    id: "offer",
    title: "Offer Secured",
    desc: "Received a competitive job offer",
    icon: EmojiEventsRounded,
    color: "#ec4899",
    unlockedWhen: (data) => data.tracked.some((t) => t.status === "offer"),
  },
];

export default function CareerTimeline() {
  const { tracked, contacts, rankedJobs } = useApp();

  // Extract all timeline events sorted chronologically
  const timelineEvents = useMemo(() => {
    const list = [];
    tracked.forEach((item) => {
      (item.history || []).forEach((h) => {
        list.push({
          id: `${item.id}-${h.status}-${h.at}`,
          status: h.status,
          at: h.at,
          jobTitle: item.title,
          company: item.company,
          domain: item.domain,
          salary: item.salary,
        });
      });
    });

    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [tracked]);

  const earliestDate = useMemo(() => {
    if (!timelineEvents.length) return new Date();
    const sorted = [...timelineEvents].sort(
      (a, b) => new Date(a.at) - new Date(b.at),
    );
    return new Date(sorted[0].at);
  }, [timelineEvents]);

  const daysActive = Math.max(
    1,
    Math.round((Date.now() - earliestDate.getTime()) / 86_400_000),
  );

  const totalApplied = tracked.filter((t) =>
    (t.history || []).some((h) => h.status === "applied"),
  ).length;

  const totalInterviews = tracked.filter(
    (t) =>
      t.status === "interview" ||
      (t.history || []).some((h) => h.status === "interview"),
  ).length;

  const interviewRate = totalApplied
    ? Math.round((totalInterviews / totalApplied) * 100)
    : 0;

  const unlockedCount = ACHIEVEMENTS.filter((a) =>
    a.unlockedWhen({ tracked, contacts, rankedJobs }),
  ).length;

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        eyebrow="Journey & Momentum"
        title="Career Search Timeline"
        subtitle="A visual progression of every application stage, response velocity, and career milestone reached."
        actions={
          <Button component={RouterLink} to="/tracker" variant="outlined">
            Open Pipeline Tracker
          </Button>
        }
      />

      <Stagger delay={0.05}>
        {/* Top KPIs */}
        <MotionItem>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: { xs: 1.5, sm: 2 },
              mb: 3,
            }}
          >
            <StatCard
              label="Days in Cycle"
              value={`${daysActive}d`}
              icon={<CalendarTodayRounded />}
              color="#6366f1"
              hint={`Started ${formatDate(earliestDate)}`}
            />
            <StatCard
              label="Applications Sent"
              value={totalApplied}
              icon={<SendRounded />}
              color="#3b82f6"
              hint="Tailored applications"
            />
            <StatCard
              label="Interview Rate"
              value={`${interviewRate}%`}
              icon={<SpeedRounded />}
              color="#10b981"
              hint="Above 12% industry avg"
            />
            <StatCard
              label="Milestones Unlocked"
              value={`${unlockedCount} / ${ACHIEVEMENTS.length}`}
              icon={<MilitaryTechRounded />}
              color="#f59e0b"
              hint="Achievement badges"
            />
          </Box>
        </MotionItem>

        <Grid container spacing={3}>
          {/* Main Visual Stream */}
          <Grid item xs={12} lg={8}>
            <SectionCard
              title="Pipeline Activity Stream"
              subtitle="Full chronological ledger of your job opportunities"
              icon={<TimelineRounded fontSize="small" />}
            >
              {timelineEvents.length === 0 ? (
                <EmptyState
                  icon={<TimelineRounded />}
                  title="No timeline events yet"
                  description="As you bookmark, submit applications, and progress through stages, your journey will appear here."
                  actionLabel="Go to Tracker"
                  onAction={() => window.location.assign("/tracker")}
                />
              ) : (
                <Box sx={{ position: "relative", pl: 3, py: 1 }}>
                  {/* Vertical connecting line */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 17,
                      top: 16,
                      bottom: 24,
                      width: 2,
                      bgcolor: "divider",
                    }}
                  />

                  {timelineEvents.map((evt, idx) => {
                    const meta = statusMeta(evt.status);
                    return (
                      <Box
                        key={evt.id}
                        component={motion.div}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        sx={{
                          position: "relative",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          pb: idx === timelineEvents.length - 1 ? 0 : 3,
                        }}
                      >
                        {/* Dot */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: -24,
                            top: 4,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            bgcolor: meta.color,
                            boxShadow: (t) =>
                              `0 0 0 4px ${t.palette.background.paper}`,
                            zIndex: 1,
                          }}
                        />

                        {/* Event Content */}
                        <Card
                          sx={{
                            p: 2,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <CompanyLogo
                            company={evt.company}
                            domain={evt.domain}
                            size={40}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.25,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                {evt.jobTitle}
                              </Typography>
                              <Chip
                                size="small"
                                label={meta.label}
                                sx={{
                                  bgcolor: alpha(meta.color, 0.12),
                                  color: meta.color,
                                  fontWeight: 700,
                                  height: 22,
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {evt.company}{" "}
                              {evt.salary ? `· ${evt.salary}` : ""}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {timeAgo(evt.at)}
                          </Typography>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </SectionCard>
          </Grid>

          {/* Right Column: Achievements & Velocity */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Gamification Badges */}
              <MotionItem>
                <SectionCard
                  title="Achievement Milestones"
                  subtitle="Unlock badges as your search progresses"
                  icon={<EmojiEventsRounded fontSize="small" />}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {ACHIEVEMENTS.map((badge) => {
                      const isUnlocked = badge.unlockedWhen({
                        tracked,
                        contacts,
                        rankedJobs,
                      });
                      const Icon = badge.icon;
                      return (
                        <Box
                          key={badge.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 1.5,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: isUnlocked ? "divider" : "transparent",
                            bgcolor: isUnlocked
                              ? "background.paper"
                              : "background.subtle",
                            opacity: isUnlocked ? 1 : 0.6,
                          }}
                        >
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: isUnlocked
                                ? alpha(badge.color, 0.14)
                                : "action.disabledBackground",
                              color: isUnlocked ? badge.color : "text.disabled",
                            }}
                          >
                            <Icon />
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {badge.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {badge.desc}
                            </Typography>
                          </Box>
                          {isUnlocked ? (
                            <CheckCircleRounded
                              sx={{ color: "success.main", fontSize: 20 }}
                            />
                          ) : (
                            <LockRounded
                              sx={{ color: "text.disabled", fontSize: 18 }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </SectionCard>
              </MotionItem>

              {/* Cycle Insights Card */}
              <MotionItem>
                <Card
                  sx={{
                    p: 2.5,
                    background: (t) =>
                      `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)}, ${alpha("#10b981", 0.08)})`,
                    border: "1px solid",
                    borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Velocity Insight
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You have maintained an average of{" "}
                    <b>
                      {(totalApplied / Math.max(1, daysActive / 7)).toFixed(1)}
                    </b>{" "}
                    applications per week. High-converting job seekers target{" "}
                    <b>8–12</b> tailored submissions per week.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/jobs"
                    size="small"
                    endIcon={<ArrowForwardRounded />}
                    sx={{ mt: 2 }}
                  >
                    Browse New Matches
                  </Button>
                </Card>
              </MotionItem>
            </Box>
          </Grid>
        </Grid>
      </Stagger>
    </Box>
  );
}
