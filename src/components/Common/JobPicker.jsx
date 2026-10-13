import React from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import CompanyLogo from './CompanyLogo';
import { useApp } from '../../context/AppContext';

/** Autocomplete over the job catalog. value/onChange use the job object (or null). */
export default function JobPicker({ value, onChange, label = 'Choose a job' }) {
  const { rankedJobs } = useApp();
  return (
    <Autocomplete
      options={rankedJobs}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(j) => `${j.title} · ${j.company}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderOption={(props, j) => (
        <Box component="li" {...props} key={j.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <CompanyLogo company={j.company} domain={j.domain} size={28} radius={7} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {j.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {j.company} · {j.match.score}% match
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}
