export const C = {
  sidebar:      '#0f1729',
  sidebarHov:   '#1a2540',
  bg:           '#f0f2f5',
  surface:      '#ffffff',
  border:       '#e2e8f0',
  borderDark:   '#cbd5e1',
  text:         '#0f172a',
  textSec:      '#475569',
  textMuted:    '#94a3b8',
  accent:       '#1d4ed8',
  accentLight:  '#dbeafe',
  accentHov:    '#1e40af',
  green:        '#059669',
  greenBg:      '#d1fae5',
  red:          '#dc2626',
  redBg:        '#fee2e2',
  yellow:       '#d97706',
  yellowBg:     '#fef3c7',
  tableHead:    '#f8fafc',
  rowSelected:  '#eff6ff',
  surfaceHover: '#f8fafc',
};

export const F = {
  sans: '"Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"Courier New", Courier, monospace',
};

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  md: '0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)',
};

export const fmt = n => `$${Number(n).toLocaleString('es-CL')}`;

export const size = { xs: 10, sm: 11, base: 13, md: 14, lg: 16, xl: 22 };

export const table = {
  th: {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: C.textSec,
    textAlign: 'left',
    background: C.tableHead,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
    fontFamily: F.sans,
    letterSpacing: '0.02em',
  },
  td: {
    padding: '11px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${C.border}`,
    color: C.text,
    verticalAlign: 'middle',
  },
};

export const btn = {
  solid: {
    cursor: 'pointer',
    border: 'none',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    background: C.accent,
    color: '#ffffff',
    fontFamily: F.sans,
  },
  outline: {
    cursor: 'pointer',
    padding: '7px 15px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontFamily: F.sans,
  },
  green: {
    cursor: 'pointer',
    border: 'none',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    background: C.green,
    color: '#ffffff',
    fontFamily: F.sans,
  },
  danger: {
    cursor: 'pointer',
    border: 'none',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    background: C.red,
    color: '#ffffff',
    fontFamily: F.sans,
  },
};

export const form = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: C.textSec,
    fontFamily: F.sans,
  },
  input: {
    padding: '7px 10px',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    fontSize: 13,
    width: 140,
    color: C.text,
    background: C.surface,
    fontFamily: F.sans,
  },
};
