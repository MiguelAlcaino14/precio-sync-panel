import { useState, useEffect, useCallback, useRef } from 'react';
import { C, F, shadow, table, btn } from '../theme';
import { apiFetch } from '../api';
import PageHeader from '../components/PageHeader';

const inputStyle = {
  padding: '7px 10px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 13,
  color: C.text,
  background: C.surface,
  fontFamily: F.sans,
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  width: 'auto',
};

function Badge({ estado }) {
  const map = {
    pendiente:  { bg: C.yellowBg,  color: C.yellow,  label: 'Pendiente' },
    confirmado: { bg: C.greenBg,   color: C.green,   label: 'Confirmado' },
    ignorado:   { bg: '#f1f5f9',   color: C.textMuted, label: 'Ignorado' },
  };
  const s = map[estado] || map.pendiente;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function StatChip({ label, value, bg, color }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 12px',
      borderRadius: 20,
      background: bg,
      border: `1px solid ${color}22`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: F.sans }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: F.sans }}>{value}</span>
    </div>
  );
}

function FilaExpandida({ item, onConfirmado, onIgnorado, onCancelar }) {
  const [query, setQuery]           = useState(item.skuProveedor || '');
  const [nombre, setNombre]         = useState(item.nombreProducto || '');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando]     = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState('');
  const debounceRef = useRef(null);

  const buscar = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await apiFetch(`/mapeo/buscar-jumpseller?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResultados(Array.isArray(data) ? data.slice(0, 20) : []);
        }
      } catch {}
      finally { setBuscando(false); }
    }, 400);
  }, []);

  useEffect(() => {
    buscar(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, buscar]);

  async function guardar() {
    if (!seleccionado) { setError('Selecciona un producto de JumpSeller.'); return; }
    setError('');
    setGuardando(true);
    try {
      const payload = { jumpsellerProductId: seleccionado.productId };
      if (nombre.trim() && nombre.trim() !== item.nombreProducto) {
        payload.nombreProducto = nombre.trim();
      }
      const res = await apiFetch(`/mapeo/${item.id}/confirmar`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al confirmar.'); return; }
      onConfirmado(item.id);
    } catch {
      setError('Error de conexión.');
    } finally {
      setGuardando(false);
    }
  }

  async function ignorar() {
    setError('');
    setGuardando(true);
    try {
      const res = await apiFetch(`/mapeo/${item.id}/ignorar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al ignorar.'); return; }
      onIgnorado(item.id);
    } catch {
      setError('Error de conexión.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr>
      <td colSpan={5} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          padding: '16px 20px',
          background: C.accentLight,
          borderLeft: `3px solid ${C.accent}`,
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: C.accent, fontFamily: F.sans }}>
            Revisar mapeo para: <span style={{ fontFamily: F.mono }}>{item.skuProveedor}</span>
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans, marginBottom: 4 }}>
              Nombre del producto (proveedor)
            </label>
            <input
              style={{ ...inputStyle, maxWidth: 400 }}
              value={nombre}
              placeholder="Nombre del producto…"
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: 400 }}>
              <input
                style={inputStyle}
                value={query}
                placeholder="Nombre o SKU en JumpSeller…"
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {buscando && (
              <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans }}>Buscando…</span>
            )}
          </div>

          {resultados.length > 0 && (
            <div style={{
              maxHeight: 240,
              overflowY: 'auto',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              background: C.surface,
              marginBottom: 12,
            }}>
              {resultados.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSeleccionado(prev => prev?.id === r.id ? null : r)}
                  style={{
                    padding: '9px 12px',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    background: seleccionado?.id === r.id ? C.rowSelected : 'transparent',
                    borderLeft: seleccionado?.id === r.id ? `3px solid ${C.accent}` : '3px solid transparent',
                    transition: 'background 0.1s',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => {
                    if (seleccionado?.id !== r.id) e.currentTarget.style.background = C.surfaceHover;
                  }}
                  onMouseLeave={e => {
                    if (seleccionado?.id !== r.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: seleccionado?.id === r.id ? 600 : 400, color: C.text, fontFamily: F.sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.nombre || r.name || '(sin nombre)'}
                    </p>
                    {(r.sku || r.codigo) && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSec, fontFamily: F.mono }}>
                        {r.sku || r.codigo}
                      </p>
                    )}
                  </div>
                  {seleccionado?.id === r.id && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}

          {!buscando && query.trim() && resultados.length === 0 && (
            <p style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans, margin: '0 0 12px' }}>
              Sin resultados para "{query}"
            </p>
          )}

          {error && (
            <p style={{ fontSize: 12, color: C.red, fontFamily: F.sans, margin: '0 0 10px', fontWeight: 500 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={guardar}
              disabled={guardando || !seleccionado}
              style={{
                ...btn.green,
                opacity: (guardando || !seleccionado) ? 0.5 : 1,
                cursor: (guardando || !seleccionado) ? 'not-allowed' : 'pointer',
                padding: '7px 14px',
                fontSize: 12,
              }}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={ignorar}
              disabled={guardando}
              style={{
                ...btn.outline,
                color: C.textMuted,
                padding: '7px 14px',
                fontSize: 12,
                opacity: guardando ? 0.5 : 1,
              }}
            >
              Ignorar
            </button>
            <button
              onClick={onCancelar}
              disabled={guardando}
              style={{ ...btn.outline, padding: '7px 14px', fontSize: 12 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Mapeo() {
  const [items, setItems]               = useState([]);
  const [proveedores, setProveedores]   = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [proveedorId, setProveedorId]   = useState('');
  const [pagina, setPagina]             = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal]               = useState(0);
  const [expandido, setExpandido]       = useState(null);
  const [ignorandoId, setIgnorandoId]   = useState(null);
  const LIMIT = 50;

  useEffect(() => {
    cargarProveedores();
    cargarStats();
  }, []);

  useEffect(() => {
    setPagina(1);
    setExpandido(null);
  }, [proveedorId]);

  useEffect(() => {
    cargarItems();
  }, [proveedorId, pagina]); // eslint-disable-line

  async function cargarProveedores() {
    try {
      const res = await apiFetch('/proveedores');
      if (res.ok) {
        const data = await res.json();
        setProveedores(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function cargarStats() {
    try {
      const res = await apiFetch('/mapeo/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function cargarItems() {
    setLoading(true);
    setError('');
    try {
      let url = `/mapeo/pendientes?page=${pagina}&limit=${LIMIT}`;
      if (proveedorId) url += `&proveedorId=${proveedorId}`;
      const res = await apiFetch(url);
      if (!res.ok) { setError('Error al cargar items.'); return; }
      const data = await res.json();
      // Soporta { items, total, totalPaginas } o array directo
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
        setTotalPaginas(1);
      } else {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(data.total ?? 0);
        setTotalPaginas(data.totalPaginas ?? 1);
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleIgnorarDirecto(id) {
    setIgnorandoId(id);
    try {
      const res = await apiFetch(`/mapeo/${id}/ignorar`, { method: 'POST' });
      if (res.ok) handleIgnorado(id);
    } catch {}
    finally { setIgnorandoId(null); }
  }

  function handleConfirmado(id) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, estado: 'confirmado' } : it));
    setExpandido(null);
    cargarStats();
  }

  function handleIgnorado(id) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, estado: 'ignorado' } : it));
    setExpandido(null);
    cargarStats();
  }

  function toggleExpandido(id) {
    setExpandido(prev => prev === id ? null : id);
  }

  return (
    <div>
      <PageHeader
        title="Mapeo de SKU"
        subtitle="Revisión manual de productos sin match entre proveedores y JumpSeller."
        action={
          stats && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatChip label="Total"       value={stats.total      ?? 0} bg="#f1f5f9"    color={C.textSec} />
              <StatChip label="Pendientes"  value={stats.pendientes ?? 0} bg={C.yellowBg} color={C.yellow}  />
              <StatChip label="Confirmados" value={stats.confirmados ?? 0} bg={C.greenBg} color={C.green}   />
              <StatChip label="Ignorados"   value={stats.ignorados  ?? 0} bg="#f1f5f9"    color={C.textMuted}/>
            </div>
          )
        }
      />

      {/* Filtros */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        boxShadow: shadow.sm,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>
          Proveedor
        </label>
        <select
          style={selectStyle}
          value={proveedorId}
          onChange={e => setProveedorId(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        {total > 0 && (
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans, marginLeft: 'auto' }}>
            {total} item{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 14,
          padding: '10px 14px',
          borderRadius: 6,
          fontSize: 13,
          fontFamily: F.sans,
          background: C.redBg,
          color: C.red,
          border: `1px solid ${C.red}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Tabla */}
      <div className="scroll-x" style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: shadow.sm,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={table.th}>SKU Proveedor</th>
              <th style={table.th}>Nombre Producto</th>
              <th style={table.th}>Proveedor</th>
              <th style={{ ...table.th, textAlign: 'center' }}>Estado</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={table.td}>
                      <div style={{
                        height: 13,
                        background: C.border,
                        borderRadius: 4,
                        width: j === 0 ? '60%' : j === 1 ? '40%' : '30%',
                        animation: 'shimmer 1.4s ease-in-out infinite',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 48 }}>
                  No hay items pendientes de revisión.
                </td>
              </tr>
            )}

            {!loading && items.map(item => (
              <>
                <tr
                  key={item.id}
                  style={{
                    background: expandido === item.id ? C.accentLight : C.surface,
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ ...table.td, fontFamily: F.mono, fontSize: 12 }}>
                    {item.skuProveedor}
                  </td>
                  <td style={{ ...table.td, color: C.text, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nombreProducto || '—'}
                  </td>
                  <td style={{ ...table.td, color: C.textSec }}>
                    {item.proveedor?.nombre || item.proveedorNombre || '—'}
                  </td>
                  <td style={{ ...table.td, textAlign: 'center' }}>
                    <Badge estado={item.estado} />
                  </td>
                  <td style={{ ...table.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {item.estado === 'pendiente' && (
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => toggleExpandido(item.id)}
                          style={{
                            ...btn.solid,
                            padding: '5px 12px',
                            fontSize: 12,
                            background: expandido === item.id ? C.accentHov : C.accent,
                          }}
                        >
                          {expandido === item.id ? 'Cancelar' : 'Revisar'}
                        </button>
                        <button
                          onClick={() => handleIgnorarDirecto(item.id)}
                          disabled={ignorandoId === item.id}
                          style={{
                            ...btn.outline,
                            padding: '5px 12px',
                            fontSize: 12,
                            color: C.red,
                            borderColor: C.red,
                            opacity: ignorandoId === item.id ? 0.5 : 1,
                            cursor: ignorandoId === item.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {ignorandoId === item.id ? '…' : 'Ignorar'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {expandido === item.id && (
                  <FilaExpandida
                    key={`exp-${item.id}`}
                    item={item}
                    onConfirmado={handleConfirmado}
                    onIgnorado={handleIgnorado}
                    onCancelar={() => setExpandido(null)}
                  />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{
              ...btn.outline,
              padding: '6px 12px',
              fontSize: 12,
              opacity: pagina === 1 ? 0.4 : 1,
              cursor: pagina === 1 ? 'default' : 'pointer',
            }}
          >
            ‹ Anterior
          </button>
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.sans, padding: '0 8px' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              ...btn.outline,
              padding: '6px 12px',
              fontSize: 12,
              opacity: pagina === totalPaginas ? 0.4 : 1,
              cursor: pagina === totalPaginas ? 'default' : 'pointer',
            }}
          >
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  );
}
