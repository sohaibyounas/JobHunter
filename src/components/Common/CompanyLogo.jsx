import React, { memo, useState } from 'react';
import { Box } from '@mui/material';

const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];
const colorFor = (name = '') => PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

/**
 * Company logo from the domain's favicon, falling back to a coloured monogram.
 * (The Clearbit logo API used previously has been shut down.)
 */
function CompanyLogo({ company = '', domain, size = 44, radius = 12 }) {
  const [failed, setFailed] = useState(false);
  const src = domain && !failed ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null;
  const bg = colorFor(company);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${radius}px`,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: src ? '#fff' : bg,
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.42,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt={`${company} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            // Google returns a tiny generic globe for unknown domains
            if (e.currentTarget.naturalWidth <= 16) setFailed(true);
          }}
          sx={{ width: '62%', height: '62%', objectFit: 'contain' }}
        />
      ) : (
        (company[0] || '?').toUpperCase()
      )}
    </Box>
  );
}

export default memo(CompanyLogo);
