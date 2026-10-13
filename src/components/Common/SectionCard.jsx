import React from 'react';
import { Box, Card, Typography } from '@mui/material';

/** Card with a consistent header row (title, optional subtitle and action). */
export default function SectionCard({ title, subtitle, action, icon, children, sx, contentSx, ...rest }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }} {...rest}>
      {(title || action) && (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.25 }, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {icon && (
            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.selected', color: 'primary.main', flexShrink: 0 }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h2" noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: title ? 0 : { xs: 2, sm: 2.5 }, flexGrow: 1, ...contentSx }}>{children}</Box>
    </Card>
  );
}
