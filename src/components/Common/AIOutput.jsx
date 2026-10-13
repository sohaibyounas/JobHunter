import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { ContentCopyRounded, DownloadRounded, RefreshRounded, CheckRounded, AutoAwesomeRounded } from '@mui/icons-material';
import { useReducedMotion } from 'framer-motion';
import { copyToClipboard, downloadText } from '../../data/helpers';
import { useApp } from '../../context/AppContext';

/**
 * Shows generated text with a typewriter reveal, then becomes an editable field
 * with copy / download / regenerate actions.
 */
export default function AIOutput({ text, filename = 'document.txt', onRegenerate, minRows = 10, placeholder }) {
  const reduce = useReducedMotion();
  const { notify } = useApp();
  const [shown, setShown] = useState('');
  const [value, setValue] = useState('');
  const [typing, setTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const raf = useRef();

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!text) {
      setShown('');
      setValue('');
      return undefined;
    }
    if (reduce) {
      setShown(text);
      setValue(text);
      return undefined;
    }
    setTyping(true);
    const start = performance.now();
    const cps = Math.max(220, text.length / 2.2); // finish long texts in ~2s
    const tick = (now) => {
      const n = Math.min(text.length, Math.floor(((now - start) / 1000) * cps));
      setShown(text.slice(0, n));
      if (n < text.length) raf.current = requestAnimationFrame(tick);
      else {
        setTyping(false);
        setValue(text);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, reduce]);

  const copy = async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify('Could not copy. Select the text and copy manually.', 'error');
    }
  };

  if (!text) {
    return (
      <Box sx={{ minHeight: 240, height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'divider', color: 'text.secondary' }}>
        <Box>
          <AutoAwesomeRounded sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
          <Typography variant="body2">{placeholder || 'Your generated text will appear here.'}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {typing ? 'Writing…' : `${value.trim().split(/\s+/).length} words · edit freely before using`}
        </Typography>
        {onRegenerate && (
          <Tooltip title="Regenerate">
            <IconButton size="small" onClick={onRegenerate} disabled={typing} aria-label="Regenerate">
              <RefreshRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Download .txt">
          <IconButton size="small" onClick={() => downloadText(filename, value)} disabled={typing} aria-label="Download">
            <DownloadRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button size="small" variant="contained" onClick={copy} disabled={typing} startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </Box>
      {typing ? (
        <Box sx={{ p: 1.75, minHeight: minRows * 24, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.7 }} aria-live="polite">
          {shown}
          <Box component="span" sx={{ display: 'inline-block', width: 2, height: '1em', bgcolor: 'primary.main', ml: 0.25, verticalAlign: 'text-bottom', animation: 'blink 1s steps(1) infinite', '@keyframes blink': { '50%': { opacity: 0 } } }} />
        </Box>
      ) : (
        <TextField
          multiline
          fullWidth
          minRows={minRows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputProps={{ 'aria-label': 'Generated text' }}
          sx={{ '& textarea': { fontSize: '0.9rem', lineHeight: 1.7 } }}
        />
      )}
    </Box>
  );
}
