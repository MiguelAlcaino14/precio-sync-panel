export const C = {
  sidebar:     '#0f1729',
  sidebarHov:  '#1a2540',
  bg:          '#f0f2f5',
  surface:     '#ffffff',
  border:      '#e2e8f0',
  borderDark:  '#cbd5e1',
  text:        '#0f172a',
  textSec:     '#475569',
  textMuted:   '#94a3b8',
  accent:      '#1d4ed8',
  accentLight: '#dbeafe',
  accentHov:   '#1e40af',
  green:       '#059669',
  greenBg:     '#d1fae5',
  red:         '#dc2626',
  redBg:       '#fee2e2',
  yellow:      '#d97706',
  yellowBg:    '#fef3c7',
};

export const F = {
  sans: '"Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"Courier New", Courier, monospace',
};

export const shadow = {
  sm:  '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  md:  '0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)',
};

export const fmt = n => `$${Number(n).toLocaleString('es-CL')}`;
