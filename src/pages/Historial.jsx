import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';
import { apiFetch } from '../api';

const POR_PAGINA = 20;

const estadoBadge = {
  procesado:  { bg: C.greenBg,  color: C.green  },
  procesando: { bg: C.yellowBg, color: C.yellow },
  error:      { bg: C.redBg,    color: C.red    },
};

const thStyle = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 600,
  color: C.textSec,
  textAlign: 'left',
  background: '#f8fafc',
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
  fontFamily: F.sans,
};

const tdStyle = {
  padding: '11px 14px',
  fontSize: 13,
  borderBottom: `1px solid ${C.border}`,
  color: C.text,
  verticalAlign: 'middle',
};

const outlineBtn = {
  cursor: 'pointer',
  padding: '6px 11px',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontFamily: F.sans,
};

export default function Historial() {
  const [historial, setHistorial] = useState([]);
  const [pagina, setPagina]       = useState(1);

  useEffect(() => {
    apiFetch('/exportar/historial').then(r => r.json()).then(data => setHistorial(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const totalPaginas = Math.ceil(historial.length / POR_PAGINA) || 1;
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio       = (paginaActual - 1) * POR_PAGINA;
  const historialPag = historial.slice(inicio, inicio + POR_PAGINA);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          Historial de importaciones
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
          {historial.length} importaciones registradas
          {totalPaginas > 1 && (
            <> · página <strong style={{ color: C.text }}>{paginaActual}</strong> de {totalPaginas}</>
          )}
        </p>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: shadow.sm,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Archivo</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Matches</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Sin match</th>
            </tr>
          </thead>
          <tbody>
            {historialPag.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textMuted, padding: 40 }}>
                  No se han procesado archivos todavía.
                </td>
              </tr>
            )}
            {historialPag.map(h => {
              const badge = estadoBadge[h.estado] || { bg: '#f1f5f9', color: C.textSec };
              const matchPct = h.totalProductos > 0
                ? Math.round((h.matcheados / h.totalProductos) * 100)
                : null;

              return (
                <tr key={h.id} style={{ background: C.surface }}>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: C.textSec, whiteSpace: 'nowrap' }}>
                    {new Date(h.createdAt).toLocaleString('es-CL')}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{h.proveedor?.nombre}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: C.textSec, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.nombre}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                    }}>
                      {h.estado}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right' }}>
                    {h.totalProductos ?? '—'}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right' }}>
                    <span style={{ color: h.matcheados > 0 ? C.green : C.textMuted }}>
                      {h.matcheados ?? '—'}
                    </span>
                    {matchPct !== null && (
                      <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>({matchPct}%)</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right' }}>
                    <span style={{ color: h.sinMatch > 0 ? C.yellow : C.textMuted }}>
                      {h.sinMatch ?? '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <button
            onClick={() => setPagina(1)}
            disabled={paginaActual === 1}
            style={{ ...outlineBtn, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? 'default' : 'pointer' }}
          >«</button>
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            style={{ ...outlineBtn, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? 'default' : 'pointer' }}
          >‹</button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 2)
            .reduce((acc, n, i, arr) => {
              if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, [])
            .map((n, i) =>
              n === '…' ? (
                <span key={`e-${i}`} style={{ padding: '0 4px', color: C.textMuted, fontSize: 13 }}>…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  style={{
                    ...outlineBtn,
                    fontWeight: n === paginaActual ? 700 : 500,
                    background: n === paginaActual ? C.accent : C.surface,
                    color: n === paginaActual ? '#fff' : C.text,
                    border: n === paginaActual ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                  }}
                >{n}</button>
              )
            )}

          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            style={{ ...outlineBtn, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? 'default' : 'pointer' }}
          >›</button>
          <button
            onClick={() => setPagina(totalPaginas)}
            disabled={paginaActual === totalPaginas}
            style={{ ...outlineBtn, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? 'default' : 'pointer' }}
          >»</button>
        </div>
      )}
    </div>
  );
}
