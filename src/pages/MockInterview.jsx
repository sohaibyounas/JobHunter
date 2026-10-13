import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Card, Chip, Grid, IconButton, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ShuffleRounded, PlayArrowRounded, PauseRounded, MicRounded, MicOffRounded, AutoAwesomeRounded, CheckCircleRounded,
  TipsAndUpdatesOutlined, HistoryRounded, RestartAltRounded, ArrowForwardRounded,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../components/Common/PageHeader';
import SectionCard from '../components/Common/SectionCard';
import MatchRing from '../components/Common/MatchRing';
import { interviewQuestions } from '../data/mockData';
import { evaluateAnswer } from '../lib/ai';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../data/helpers';

const CATEGORIES = Object.keys(interviewQuestions);
const TARGET_SECONDS = 120;

const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function useTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return [seconds, setSeconds];
}

export default function MockInterview() {
  const { interviewHistory, addInterviewResult, profile } = useApp();
  const [category, setCategory] = useState('Behavioral');
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useTimer(running);
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const questions = interviewQuestions[category];
  const question = questions[qIndex % questions.length];

  const avg = useMemo(
    () => (interviewHistory.length ? Math.round(interviewHistory.reduce((a, h) => a + h.score, 0) / interviewHistory.length) : 0),
    [interviewHistory],
  );

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  useEffect(() => () => recRef.current?.abort?.(), []);

  const reset = (nextIndex) => {
    stopListening();
    setQIndex(nextIndex);
    setAnswer('');
    setFeedback(null);
    setRunning(false);
    setSeconds(0);
  };

  const shuffle = () => {
    let next = qIndex;
    while (questions.length > 1 && next === qIndex) next = Math.floor(Math.random() * questions.length);
    reset(next);
  };

  const toggleVoice = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      stopListening();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0].transcript)
        .join(' ');
      setAnswer((a) => `${a}${a && !a.endsWith(' ') ? ' ' : ''}${transcript.trim()}`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    setRunning(true);
  };

  const evaluate = () => {
    stopListening();
    setRunning(false);
    setEvaluating(true);
    setTimeout(() => {
      const result = evaluateAnswer(question, answer, category);
      setFeedback(result);
      setEvaluating(false);
      addInterviewResult({ question, category, score: result.score, verdict: result.verdict, seconds });
    }, 900);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const overTime = seconds > TARGET_SECONDS;

  return (
    <Box>
      <PageHeader
        eyebrow="Interview prep"
        title="AI Mock Interview"
        subtitle={`Practice real ${profile.title ? `${profile.title} ` : ''}interview questions and get instant feedback on structure, impact and clarity.`}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  onClick={() => {
                    setCategory(c);
                    reset(0);
                  }}
                  color={c === category ? 'primary' : 'default'}
                  variant={c === category ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                  aria-pressed={c === category}
                />
              ))}
            </Box>

            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4, mb: 2.5, background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.1)}, ${alpha('#a855f7', 0.08)})`, border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.2) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="overline" color="primary">
                  Question {(qIndex % questions.length) + 1} of {questions.length}
                </Typography>
                <Tooltip title="Random question">
                  <IconButton size="small" onClick={shuffle} aria-label="Random question">
                    <ShuffleRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <AnimatePresence mode="wait">
                <motion.div key={question} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.15rem', sm: '1.375rem' } }}>
                    “{question}”
                  </Typography>
                </motion.div>
              </AnimatePresence>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={running ? <PauseRounded /> : <PlayArrowRounded />}
                onClick={() => setRunning((r) => !r)}
              >
                {running ? 'Pause' : seconds ? 'Resume' : 'Start timer'}
              </Button>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: overTime ? 'warning.main' : 'text.primary' }} aria-live="off">
                {mm}:{ss}
              </Typography>
              <LinearProgress variant="determinate" value={Math.min(100, (seconds / TARGET_SECONDS) * 100)} color={overTime ? 'warning' : 'primary'} sx={{ flexGrow: 1 }} aria-label="Time used of 2 minutes" />
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                aim for ~2 min
              </Typography>
            </Box>

            <TextField
              multiline
              fullWidth
              minRows={8}
              maxRows={18}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value.slice(0, 5000));
                if (!running && !feedback) setRunning(true);
              }}
              placeholder={category === 'Technical' ? 'Explain your approach step by step, with reasoning and trade-offs…' : 'Use STAR: the Situation, your Task, the Actions you took, and the measurable Result…'}
              inputProps={{ 'aria-label': 'Your answer' }}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {SpeechRecognition && (
                <Button variant={listening ? 'contained' : 'outlined'} color={listening ? 'error' : 'primary'} startIcon={listening ? <MicOffRounded /> : <MicRounded />} onClick={toggleVoice}>
                  {listening ? 'Stop dictation' : 'Answer by voice'}
                </Button>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
                {answer.trim() ? `${answer.trim().split(/\s+/).length} words` : ''}
              </Typography>
              <Button onClick={() => reset(qIndex)} startIcon={<RestartAltRounded />} disabled={!answer && !seconds}>
                Clear
              </Button>
              <Button variant="contained" onClick={evaluate} disabled={answer.trim().split(/\s+/).length < 10 || evaluating} startIcon={<AutoAwesomeRounded />}>
                {evaluating ? 'Evaluating…' : 'Get feedback'}
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.div key="fb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SectionCard title="Feedback" subtitle={`${feedback.wordCount} words · ${mm}:${ss}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <MatchRing score={feedback.score} size={88} stroke={8} label="score" />
                      <Box>
                        <Typography variant="h5">{feedback.verdict}</Typography>
                        {(category !== 'Technical') && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            {Object.entries(feedback.star).map(([k, ok]) => (
                              <Chip key={k} size="small" label={k} color={ok ? 'success' : 'default'} variant={ok ? 'filled' : 'outlined'} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    {feedback.strengths.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                          What went well
                        </Typography>
                        {feedback.strengths.map((s) => (
                          <Box key={s} sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
                            <CheckCircleRounded sx={{ fontSize: 18, color: 'success.main', mt: 0.25 }} />
                            <Typography variant="body2">{s}</Typography>
                          </Box>
                        ))}
                      </>
                    )}
                    {feedback.improvements.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.75 }}>
                          To improve
                        </Typography>
                        {feedback.improvements.map((s) => (
                          <Box key={s} sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
                            <TipsAndUpdatesOutlined sx={{ fontSize: 18, color: 'warning.main', mt: 0.25 }} />
                            <Typography variant="body2">{s}</Typography>
                          </Box>
                        ))}
                      </>
                    )}
                    <Button fullWidth variant="outlined" endIcon={<ArrowForwardRounded />} sx={{ mt: 2 }} onClick={() => reset(qIndex + 1)}>
                      Next question
                    </Button>
                  </SectionCard>
                </motion.div>
              ) : (
                <motion.div key="tips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SectionCard title="How to answer well" icon={<TipsAndUpdatesOutlined fontSize="small" />}>
                    {[
                      ['Situation', 'Set the scene in one or two sentences.'],
                      ['Task', 'What were you responsible for?'],
                      ['Action', 'What did you do? Say "I", not "we".'],
                      ['Result', 'The outcome, ideally with a number.'],
                    ].map(([k, v], i) => (
                      <Box key={k} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.selected', color: 'primary.main', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {'STAR'[i]}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2">{k}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {v}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>

            <SectionCard title="Practice history" subtitle={interviewHistory.length ? `${interviewHistory.length} answers · avg ${avg}` : 'Your sessions are saved here'} icon={<HistoryRounded fontSize="small" />}>
              {interviewHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Answer your first question to start tracking progress.
                </Typography>
              ) : (
                interviewHistory.slice(0, 6).map((h) => (
                  <Box key={h.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
                    <MatchRing score={h.score} size={38} stroke={3.5} showPercent={false} />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {h.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {h.category} · {h.verdict} · {timeAgo(h.at)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </SectionCard>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
