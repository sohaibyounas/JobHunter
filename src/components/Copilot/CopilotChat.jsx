import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import {
  AutoAwesomeRounded,
  CloseRounded,
  SendRounded,
  ArrowForwardRounded,
  DeleteSweepRounded,
} from "@mui/icons-material";
import { useApp } from "../../context/AppContext";
import { copilotReply } from "../../lib/ai";
import { firstName, getInitials } from "../../data/helpers";
import { MOBILE_NAV_HEIGHT } from "../Layout/MobileNav";

const SUGGESTIONS = [
  "What are my best matches?",
  "How is my pipeline?",
  "Which skills am I missing?",
  "Salary negotiation tips",
  "Help me prep for interviews",
];

const greetingMessage = (name) => ({
  id: "hello",
  from: "bot",
  text: `Hi ${firstName(name)}! I'm your AI career copilot. I know your profile, job matches and pipeline. Ask me anything about your search.`,
});

function TypingDots() {
  return (
    <Box
      sx={{ display: "flex", gap: 0.5, py: 0.5 }}
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          component={motion.span}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "text.secondary",
            display: "block",
          }}
        />
      ))}
    </Box>
  );
}

export function CopilotFab({ hidden, isMobile }) {
  const { openCopilot } = useApp();
  return (
    <AnimatePresence>
      {!hidden && (
        <Box
          component={motion.button}
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => openCopilot()}
          aria-label="Open AI copilot"
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: isMobile
              ? `calc(${MOBILE_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`
              : 24,
            zIndex: (t) => t.zIndex.speedDial,
            width: 54,
            height: 54,
            border: '1px solid',
            borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(0,229,153,0.3)' : 'rgba(0,0,0,0.08)',
            borderRadius: '50%',
            cursor: 'pointer',
            color: '#00e599',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.paper',
            boxShadow: '0 8px 28px rgba(0,0,0,.15)',
            '&:hover': {
              boxShadow: '0 10px 32px rgba(0,229,153,.35)',
              transform: 'scale(1.05)',
            },
          }}
        >
          <AutoAwesomeRounded sx={{ fontSize: 28, color: '#00e599' }} />
        </Box>
      )}
    </AnimatePresence>
  );
}

export default function CopilotChat() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const {
    copilot,
    closeCopilot,
    profile,
    rankedJobs,
    tracked,
    contacts,
    hiddenJobs,
  } = useApp();
  const [messages, setMessages] = useState(() => [
    greetingMessage(profile.name),
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timers = useRef([]);

  // Clear pending replies on unmount
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const send = (raw) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { id: `${Date.now()}u`, from: "user", text }]);
    setInput("");
    setTyping(true);
    const reply = copilotReply(text, {
      profile,
      rankedJobs: rankedJobs.filter((j) => !hiddenJobs.includes(j.id)),
      tracked,
      contacts,
    });
    const delay = Math.min(1400, 450 + reply.text.length * 3);
    timers.current.push(
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { id: `${Date.now()}b`, from: "bot", ...reply },
        ]);
        setTyping(false);
      }, delay),
    );
  };

  // Prompt passed from elsewhere (command palette, job drawer)
  useEffect(() => {
    if (copilot.open && copilot.prompt) send(copilot.prompt);
    if (copilot.open) setTimeout(() => inputRef.current?.focus(), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilot.open, copilot.prompt]);

  useEffect(() => {
    if (!copilot.open) return undefined;
    const onKey = (e) => e.key === "Escape" && closeCopilot();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copilot.open, closeCopilot]);

  return (
    <AnimatePresence>
      {copilot.open && (
        <Box
          component={motion.section}
          role="dialog"
          aria-label="AI copilot"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          sx={{
            position: "fixed",
            zIndex: (t) => t.zIndex.modal,
            ...(fullScreen
              ? { inset: 0, borderRadius: 0 }
              : {
                  right: 24,
                  bottom: 24,
                  width: 400,
                  height: "min(620px, calc(100vh - 48px))",
                  borderRadius: 5,
                }),
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
            border: fullScreen ? 0 : "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 64px rgba(15,23,42,.28)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              pt: fullScreen ? "max(12px, env(safe-area-inset-top))" : 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "#fff",
              background: "linear-gradient(135deg,#4f46e5,#9333ea)",
            }}
          >
            <Avatar
              sx={{ bgcolor: "rgba(255,255,255,.18)", width: 38, height: 38 }}
            >
              <AutoAwesomeRounded fontSize="small" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: "#fff", lineHeight: 1.2 }}
              >
                AI Copilot
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#34d399",
                  }}
                />{" "}
                Online · knows your profile
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setMessages([greetingMessage(profile.name)])}
              aria-label="Clear conversation"
              sx={{ color: "#fff" }}
            >
              <DeleteSweepRounded fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={closeCopilot}
              aria-label="Close copilot"
              sx={{ color: "#fff" }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
            aria-live="polite"
          >
            {messages.map((m) => {
              const mine = m.from === "user";
              return (
                <Box
                  key={m.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: mine ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                  }}
                >
                  {!mine && (
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "primary.main",
                        flexShrink: 0,
                      }}
                    >
                      <AutoAwesomeRounded sx={{ fontSize: 15 }} />
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: "82%" }}>
                    <Box
                      sx={{
                        px: 1.75,
                        py: 1.25,
                        borderRadius: mine
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        bgcolor: mine ? "primary.main" : "background.subtle",
                        color: mine ? "#fff" : "text.primary",
                        whiteSpace: "pre-line",
                        fontSize: "0.875rem",
                        lineHeight: 1.55,
                      }}
                    >
                      {m.text}
                    </Box>
                    {m.actions?.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                          mt: 1,
                        }}
                      >
                        {m.actions.map((a) => (
                          <Button
                            key={a.to}
                            size="small"
                            variant="outlined"
                            endIcon={
                              <ArrowForwardRounded
                                sx={{ fontSize: "16px !important" }}
                              />
                            }
                            onClick={() => {
                              navigate(a.to);
                              if (fullScreen) closeCopilot();
                            }}
                            sx={{ borderRadius: 99 }}
                          >
                            {a.label}
                          </Button>
                        ))}
                      </Box>
                    )}
                  </Box>
                  {mine && (
                    <Avatar
                      src={profile.avatar || undefined}
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: 12,
                        bgcolor: "secondary.main",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(profile.name)}
                    </Avatar>
                  )}
                </Box>
              );
            })}
            {typing && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main" }}>
                  <AutoAwesomeRounded sx={{ fontSize: 15 }} />
                </Avatar>
                <Box
                  sx={{
                    px: 1.75,
                    py: 1,
                    borderRadius: "16px 16px 16px 4px",
                    bgcolor: "background.subtle",
                  }}
                >
                  <TypingDots />
                </Box>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Suggestions */}
          {messages.length <= 2 && !typing && (
            <Box
              sx={{
                px: 2,
                pb: 1,
                display: "flex",
                gap: 0.75,
                overflowX: "auto",
                flexShrink: 0,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  variant="outlined"
                  onClick={() => send(s)}
                  sx={{ flexShrink: 0 }}
                />
              ))}
            </Box>
          )}

          {/* Composer */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            sx={{
              p: 1.5,
              pb: fullScreen ? "max(12px, env(safe-area-inset-bottom))" : 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 1,
              alignItems: "flex-end",
            }}
          >
            <InputBase
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about jobs, resume, interviews…"
              inputProps={{ "aria-label": "Message the copilot" }}
              sx={{
                px: 1.75,
                py: 1,
                borderRadius: 3,
                bgcolor: "background.subtle",
                fontSize: "0.875rem",
              }}
            />
            <IconButton
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              sx={{
                width: 40,
                height: 40,
                color: "#fff",
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": {
                  bgcolor: (t) => alpha(t.palette.text.primary, 0.08),
                  color: "text.disabled",
                },
              }}
            >
              <SendRounded fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
