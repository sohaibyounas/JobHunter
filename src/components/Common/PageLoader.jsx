import React from 'react';
import { Box, Skeleton } from '@mui/material';

/** Skeleton shown while a lazily loaded page chunk downloads. */
export default function PageLoader() {
  return (
    <Box aria-busy="true" aria-label="Loading page">
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="text" width={340} height={22} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={112} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
    </Box>
  );
}
