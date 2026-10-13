import React, { useState } from 'react';
import { Box, Button, Checkbox, ListItemText, Menu, MenuItem } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { KeyboardArrowDownRounded, CheckRounded } from '@mui/icons-material';

/**
 * Dropdown filter pill. Single-select by default; pass `multiple` for checkboxes.
 * options: [{ value, label }]
 */
export default function FilterChip({ label, value, options, onChange, multiple = false, icon }) {
  const [anchor, setAnchor] = useState(null);
  const active = multiple ? value.length > 0 : value !== '' && value != null;
  const display = multiple
    ? value.length
      ? value.length === 1
        ? options.find((o) => o.value === value[0])?.label
        : `${label} · ${value.length}`
      : label
    : active
      ? options.find((o) => o.value === value)?.label
      : label;

  const select = (v) => {
    if (multiple) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange(v);
      setAnchor(null);
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={icon}
        endIcon={<KeyboardArrowDownRounded sx={{ transition: 'transform .2s', transform: anchor ? 'rotate(180deg)' : 'none' }} />}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchor)}
        sx={{
          flexShrink: 0,
          borderRadius: 99,
          px: 1.5,
          height: 34,
          border: '1px solid',
          borderColor: active ? 'primary.main' : 'divider',
          bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.08) : 'background.paper',
          color: active ? 'primary.main' : 'text.primary',
          fontWeight: active ? 600 : 500,
          whiteSpace: 'nowrap',
          '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
        }}
      >
        {display}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} PaperProps={{ sx: { minWidth: 200, mt: 0.75 } }}>
        {options.map((o) => {
          const selected = multiple ? value.includes(o.value) : value === o.value;
          return (
            <MenuItem key={String(o.value)} onClick={() => select(o.value)} selected={!multiple && selected} role="option" aria-selected={selected}>
              {multiple && <Checkbox size="small" checked={selected} sx={{ p: 0.5, mr: 1 }} />}
              <ListItemText primary={o.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              {!multiple && selected && <CheckRounded fontSize="small" color="primary" />}
            </MenuItem>
          );
        })}
        {multiple && value.length > 0 && (
          <Box sx={{ px: 1, pt: 0.5 }}>
            <Button size="small" fullWidth onClick={() => onChange([])}>
              Clear
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
}
