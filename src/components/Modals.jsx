import { C, F, btn, shadow } from '../theme';

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15,23,41,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};

const card = {
  background: C.surface,
  borderRadius: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  padding: '28px 28px 22px',
  maxWidth: 420,
  width: '90%',
  fontFamily: F.sans,
};

const title = { margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.text };
const body  = { margin: '0 0 22px', fontSize: 13, color: C.textSec, lineHeight: 1.6, whiteSpace: 'pre-line' };
const row   = { display: 'flex', gap: 8, justifyContent: 'flex-end' };

export function ConfirmModal({ message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel }) {
  return (
    <div style={overlay} onClick={onCancel}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <p style={title}>Confirmar acción</p>
        <p style={body}>{message}</p>
        <div style={row}>
          <button style={btn.outline} onClick={onCancel}>{cancelLabel}</button>
          <button style={danger ? btn.danger : btn.solid} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({ message, type = 'info', onClose }) {
  const colors = {
    success: { border: C.green,  bg: C.greenBg,  text: '#065f46' },
    error:   { border: C.red,    bg: C.redBg,    text: '#991b1b' },
    info:    { border: C.accent, bg: C.accentLight, text: '#1e3a8a' },
  };
  const col = colors[type] || colors.info;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...card, borderTop: `4px solid ${col.border}` }} onClick={e => e.stopPropagation()}>
        <p style={{ ...title, color: col.text }}>
          {type === 'success' ? '✓ Listo' : type === 'error' ? '✕ Error' : 'Aviso'}
        </p>
        <p style={body}>{message}</p>
        <div style={row}>
          <button style={btn.solid} onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}
