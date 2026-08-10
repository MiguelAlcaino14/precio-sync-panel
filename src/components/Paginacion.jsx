import { C, F, btn } from '../theme';

const OPCIONES_PAGINA = [10, 25, 50, 100];

export default function Paginacion({ paginaActual, totalPaginas, onChange, porPagina, onCambiarPorPagina }) {
  const pagesArr = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 2)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  const navBtn = (disabled) => ({
    ...btn.outline, padding: '6px 11px',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
  });

  const selectStyle = {
    padding: '5px 8px', fontSize: 12, fontFamily: F.sans, borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.sans }}>Mostrar</span>
        <select style={selectStyle} value={porPagina} onChange={e => onCambiarPorPagina(Number(e.target.value))}>
          {OPCIONES_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.sans }}>por página</span>
      </div>
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => onChange(1)} disabled={paginaActual === 1} style={{ ...navBtn(paginaActual === 1), padding: '6px 10px' }}>«</button>
          <button onClick={() => onChange(p => Math.max(1, p - 1))} disabled={paginaActual === 1} style={{ ...navBtn(paginaActual === 1), padding: '6px 12px' }}>‹</button>
          {pagesArr.map((n, i) =>
            n === '…' ? (
              <span key={`e-${i}`} style={{ padding: '0 4px', color: C.textMuted, fontSize: 13 }}>…</span>
            ) : (
              <button key={n} onClick={() => onChange(n)} style={{
                ...navBtn(false),
                fontWeight: n === paginaActual ? 700 : 500,
                background: n === paginaActual ? C.accent : C.surface,
                color: n === paginaActual ? '#fff' : C.text,
                border: n === paginaActual ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
              }}>{n}</button>
            )
          )}
          <button onClick={() => onChange(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} style={{ ...navBtn(paginaActual === totalPaginas), padding: '6px 12px' }}>›</button>
          <button onClick={() => onChange(totalPaginas)} disabled={paginaActual === totalPaginas} style={{ ...navBtn(paginaActual === totalPaginas), padding: '6px 10px' }}>»</button>
        </div>
      )}
    </div>
  );
}
