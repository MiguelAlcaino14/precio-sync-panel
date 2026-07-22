import { useState, useEffect, useCallback, useRef } from 'react';
import { C, F, shadow, table, btn } from '../theme';
import { apiFetch } from '../api';
import PageHeader from '../components/PageHeader';

const LIMIT = 50;

const CATEGORIAS = [
  { value: '',          label: 'Todas las categorías' },
  { value: 'aseo',     label: 'Aseo' },
  { value: 'libreria', label: 'Librería' },
  { value: 'alimentos',label: 'Alimentos' },
];

const ESTADOS = [
  { value: 'todos',      label: 'Todos' },
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'ambiguo',   label: 'Ambiguos' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'ignorado',   label: 'Ignorados' },
];

const TEMA_COLOR = {
  aseo:      { bg: '#dbeafe', color: '#1d4ed8' },
  libreria:  { bg: '#d1fae5', color: '#059669' },
  alimentos: { bg: '#fef3c7', color: '#d97706' },
};

const PURPLE = '#7c3aed';

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

const selectStyle = { ...inputStyle, cursor: 'pointer', width: 'auto' };

function Badge({ estado }) {
  const map = {
    pendiente:  { bg: C.yellowBg,  color: C.yellow,    label: 'Pendiente'  },
    confirmado: { bg: C.greenBg,   color: C.green,     label: 'Confirmado' },
    ignorado:   { bg: '#f1f5f9',   color: C.textMuted, label: 'Ignorado'   },
    ambiguo:    { bg: '#f3e8ff',   color: PURPLE,      label: 'Ambiguo'    },
  };
  const s = map[estado] || map.pendiente;
  return (
    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function MismatchTag({ item }) {
  if (item.estado === 'ambiguo') {
    return <span style={{ display: 'inline-block', marginLeft: 4, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#f3e8ff', color: PURPLE }}>SKU duplicado</span>;
  }
  if (item.estado === 'confirmado' && item.similitud != null) {
    return <span style={{ display: 'inline-block', marginLeft: 4, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: C.yellowBg, color: C.yellow }}>~{Math.round(item.similitud * 100)}% nombre</span>;
  }
  if (item.estado === 'pendiente') {
    return <span style={{ display: 'inline-block', marginLeft: 4, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: C.red }}>Sin coincidencia</span>;
  }
  return null;
}

function StatChip({ label, value, bg, color }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: bg, border: `1px solid ${color}22` }}>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: F.sans }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: F.sans }}>{value}</span>
    </div>
  );
}

const TEMA_LABEL = { aseo: 'Aseo', libreria: 'Librería', alimentos: 'Alimentos' };

function TemaTag({ tema }) {
  if (!tema) return null;
  const tc = TEMA_COLOR[tema] || {};
  return (
    <span style={{ display: 'inline-block', marginLeft: 5, fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.color }}>
      {TEMA_LABEL[tema] ?? tema}
    </span>
  );
}

// ─── FilaExpandida ─────────────────────────────────────────────────────────────
function FilaExpandida({ item, onConfirmado, onIgnorado, onRestaurado, onEditado, onCancelar }) {
  const [skuEdit, setSkuEdit]           = useState(item.skuProveedor || '');
  const [nombre, setNombre]             = useState(item.nombreProducto || '');
  const [query, setQuery]               = useState(item.nombreProducto || item.skuProveedor || '');
  const [resultados, setResultados]     = useState([]);
  const [buscando, setBuscando]         = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState('');
  const debounceRef = useRef(null);

  // Vínculos extra
  const [links, setLinks]               = useState(item.links ?? []);
  const [mostrarAddLink, setMostrarAddLink] = useState(false);
  const [queryLink, setQueryLink]       = useState('');
  const [resultadosLink, setResultadosLink] = useState([]);
  const [buscandoLink, setBuscandoLink] = useState(false);
  const [selLink, setSelLink]           = useState(null);
  const [guardandoLink, setGuardandoLink] = useState(false);
  const [errorLink, setErrorLink]       = useState('');
  const debounceLink = useRef(null);

  useEffect(() => {
    if (!queryLink.trim()) { setResultadosLink([]); return; }
    clearTimeout(debounceLink.current);
    debounceLink.current = setTimeout(async () => {
      setBuscandoLink(true);
      try {
        const res = await apiFetch(`/mapeo/buscar-jumpseller?q=${encodeURIComponent(queryLink)}`);
        if (res.ok) setResultadosLink((await res.json()) || []);
      } catch {} finally { setBuscandoLink(false); }
    }, 400);
  }, [queryLink]);

  async function agregarLink() {
    if (!selLink) { setErrorLink('Selecciona un producto.'); return; }
    setErrorLink(''); setGuardandoLink(true);
    try {
      const res  = await apiFetch(`/mapeo/${item.id}/links`, {
        method: 'POST',
        body: JSON.stringify({ jumpsellerProductId: selLink.productId, jumpsellerNombre: selLink.nombre }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorLink(data.error || 'Error al agregar.'); return; }
      setLinks(prev => [...prev, data]);
      setMostrarAddLink(false); setQueryLink(''); setResultadosLink([]); setSelLink(null);
    } catch { setErrorLink('Error de conexión.'); }
    finally { setGuardandoLink(false); }
  }

  async function eliminarLink(linkId) {
    try {
      const res = await apiFetch(`/mapeo/${item.id}/links/${linkId}`, { method: 'DELETE' });
      if (res.ok) setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch {}
  }

  const buscarJS = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await apiFetch(`/mapeo/buscar-jumpseller?q=${encodeURIComponent(q)}`);
        if (res.ok) setResultados((await res.json()) || []);
      } catch {}
      finally { setBuscando(false); }
    }, 400);
  }, []);

  useEffect(() => {
    buscarJS(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, buscarJS]);

  async function guardarEdicion() {
    const payload = {};
    const skuNorm = skuEdit.trim().toLowerCase();
    if (skuNorm && skuNorm !== item.skuProveedor) payload.skuProveedor = skuEdit.trim();
    const nombreTrim = nombre.trim();
    if (nombreTrim !== (item.nombreProducto || '')) payload.nombreProducto = nombreTrim || null;
    if (!Object.keys(payload).length) { setError('Sin cambios que guardar.'); return; }
    setError(''); setGuardando(true);
    try {
      const res  = await apiFetch(`/mapeo/${item.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar.'); return; }
      onEditado(data);
    } catch { setError('Error de conexión.'); }
    finally { setGuardando(false); }
  }

  async function confirmar() {
    if (!seleccionado) { setError('Selecciona un producto de JumpSeller.'); return; }
    setError(''); setGuardando(true);
    try {
      const payload = { jumpsellerProductId: seleccionado.productId };
      if (nombre.trim()) payload.nombreProducto = nombre.trim();
      const res  = await apiFetch(`/mapeo/${item.id}/confirmar`, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al confirmar.'); return; }
      onConfirmado(item.id);
    } catch { setError('Error de conexión.'); }
    finally { setGuardando(false); }
  }

  async function ignorar() {
    setError(''); setGuardando(true);
    try {
      const res  = await apiFetch(`/mapeo/${item.id}/ignorar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al ignorar.'); return; }
      onIgnorado(item.id);
    } catch { setError('Error de conexión.'); }
    finally { setGuardando(false); }
  }

  async function restaurar() {
    setError(''); setGuardando(true);
    try {
      const res  = await apiFetch(`/mapeo/${item.id}/restaurar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al restaurar.'); return; }
      onRestaurado(item.id);
    } catch { setError('Error de conexión.'); }
    finally { setGuardando(false); }
  }

  if (item.estado === 'ignorado') {
    return (
      <tr>
        <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderLeft: `3px solid ${C.textMuted}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 12, color: C.textSec, fontFamily: F.sans }}>
              Item ignorado. Restaurarlo lo devuelve a pendiente.
            </p>
            {error && <p style={{ margin: 0, fontSize: 12, color: C.red, fontFamily: F.sans, fontWeight: 500 }}>{error}</p>}
            <button onClick={restaurar} disabled={guardando} style={{ ...btn.solid, padding: '6px 14px', fontSize: 12, opacity: guardando ? 0.5 : 1, cursor: guardando ? 'default' : 'pointer' }}>
              {guardando ? 'Restaurando…' : 'Restaurar'}
            </button>
            <button onClick={onCancelar} style={{ ...btn.outline, padding: '6px 14px', fontSize: 12 }}>Cancelar</button>
          </div>
        </td>
      </tr>
    );
  }

  const skuCambiado = skuEdit.trim().toLowerCase() !== item.skuProveedor;

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '16px 20px', background: C.accentLight, borderLeft: `3px solid ${C.accent}` }}>
          <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: C.accent, fontFamily: F.sans }}>
            Revisar: <span style={{ fontFamily: F.mono }}>{item.skuProveedor}</span>
            {item.proveedor?.nombre && <span style={{ fontWeight: 400, color: C.textSec }}> · {item.proveedor.nombre}</span>}
          </p>

          {/* SKU original info */}
          {item.skuOriginal && (
            <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textMuted, fontFamily: F.sans, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4, padding: '5px 8px', display: 'inline-block' }}>
              SKU original: <span style={{ fontFamily: F.mono }}>{item.skuOriginal}</span>
              {' · Las importaciones con este SKU actualizarán este registro.'}
            </p>
          )}

          {/* Edición SKU + Nombre */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px', maxWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans, marginBottom: 4 }}>SKU del proveedor</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} value={skuEdit} onChange={e => setSkuEdit(e.target.value)} />
                {skuCambiado && (
                  <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: C.yellow, fontFamily: F.sans, pointerEvents: 'none' }}>✎</span>
                )}
              </div>
            </div>
            <div style={{ flex: '1 1 240px', maxWidth: 360 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans, marginBottom: 4 }}>Nombre del producto (proveedor)</label>
              <input style={inputStyle} value={nombre} placeholder="Nombre del producto…" onChange={e => setNombre(e.target.value)} />
            </div>
          </div>

          {/* Guardar solo SKU/nombre */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}44` }}>
            <button
              onClick={guardarEdicion} disabled={guardando}
              style={{ ...btn.outline, padding: '6px 14px', fontSize: 12, color: C.accent, borderColor: C.accent, opacity: guardando ? 0.5 : 1, cursor: guardando ? 'default' : 'pointer' }}
            >
              {guardando ? 'Guardando…' : 'Guardar SKU / nombre'}
            </button>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F.sans, marginLeft: 8 }}>sin vincular a JumpSeller</span>
          </div>

          {/* Búsqueda JumpSeller */}
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>Vincular a producto en JumpSeller</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: 400 }}>
              <input style={inputStyle} value={query} placeholder="Nombre o SKU en JumpSeller…" onChange={e => setQuery(e.target.value)} autoFocus />
            </div>
            {buscando && <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans }}>Buscando…</span>}
          </div>

          {resultados.length > 0 && (
            <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 6, background: C.surface, marginBottom: 12 }}>
              {resultados.map(r => (
                <div key={r.productId}
                  onClick={() => setSeleccionado(prev => prev?.productId === r.productId ? null : r)}
                  style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: seleccionado?.productId === r.productId ? C.rowSelected : 'transparent', borderLeft: seleccionado?.productId === r.productId ? `3px solid ${C.accent}` : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => { if (seleccionado?.productId !== r.productId) e.currentTarget.style.background = C.surfaceHover; }}
                  onMouseLeave={e => { if (seleccionado?.productId !== r.productId) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: seleccionado?.productId === r.productId ? 600 : 400, color: C.text, fontFamily: F.sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.nombre || '(sin nombre)'}
                    </p>
                    {r.sku && <p style={{ margin: '1px 0 0', fontSize: 11, color: C.textMuted, fontFamily: F.mono }}>{r.sku}</p>}
                  </div>
                  {seleccionado?.productId === r.productId && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </div>
              ))}
            </div>
          )}

          {!buscando && query.trim() && !resultados.length && (
            <p style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans, margin: '0 0 12px' }}>Sin resultados para "{query}"</p>
          )}

          {error && <p style={{ fontSize: 12, color: C.red, fontFamily: F.sans, margin: '0 0 10px', fontWeight: 500 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={confirmar} disabled={guardando || !seleccionado}
              style={{ ...btn.green, opacity: (guardando || !seleccionado) ? 0.5 : 1, cursor: (guardando || !seleccionado) ? 'not-allowed' : 'pointer', padding: '7px 14px', fontSize: 12 }}>
              {guardando ? 'Guardando…' : 'Confirmar'}
            </button>
            <button onClick={ignorar} disabled={guardando}
              style={{ ...btn.outline, color: C.textMuted, padding: '7px 14px', fontSize: 12, opacity: guardando ? 0.5 : 1 }}>
              Ignorar
            </button>
            <button onClick={onCancelar} disabled={guardando} style={{ ...btn.outline, padding: '7px 14px', fontSize: 12 }}>
              Cancelar
            </button>
          </div>

          {/* ── Vínculos JumpSeller extra ── */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}44` }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>
                Vínculos JumpSeller adicionales
              </p>

              {links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {links.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 12, color: C.text, fontFamily: F.sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.jumpsellerNombre || `ID ${l.jumpsellerProductId}`}
                      </span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F.mono }}>#{l.jumpsellerProductId}</span>
                      <button onClick={() => eliminarLink(l.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.red, fontSize: 16, lineHeight: 1, padding: '0 2px' }} title="Eliminar vínculo">×</button>
                    </div>
                  ))}
                </div>
              )}

              {!mostrarAddLink ? (
                <button onClick={() => setMostrarAddLink(true)} style={{ ...btn.outline, padding: '6px 14px', fontSize: 12, color: C.accent, borderColor: C.accent }}>
                  + Agregar vínculo
                </button>
              ) : (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>Buscar producto en JumpSeller</p>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input style={{ ...inputStyle, paddingRight: 30 }} value={queryLink} placeholder="Nombre o SKU en JumpSeller…"
                      onChange={e => { setQueryLink(e.target.value); setSelLink(null); }} autoFocus />
                    {buscandoLink && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.textMuted }}>…</span>}
                  </div>
                  {resultadosLink.length > 0 && (
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 6, background: C.surface, marginBottom: 10 }}>
                      {resultadosLink.map(r => (
                        <div key={r.productId} onClick={() => setSelLink(prev => prev?.productId === r.productId ? null : r)}
                          style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 12,
                            background: selLink?.productId === r.productId ? C.rowSelected : 'transparent',
                            borderLeft: selLink?.productId === r.productId ? `3px solid ${C.accent}` : '3px solid transparent',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                          onMouseEnter={e => { if (selLink?.productId !== r.productId) e.currentTarget.style.background = C.surfaceHover; }}
                          onMouseLeave={e => { if (selLink?.productId !== r.productId) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selLink?.productId === r.productId ? 600 : 400 }}>{r.nombre}</div>
                            {r.sku && <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.mono }}>{r.sku}</div>}
                          </div>
                          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F.mono, flexShrink: 0 }}>#{r.productId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {errorLink && <p style={{ margin: '0 0 8px', fontSize: 12, color: C.red, fontWeight: 500 }}>{errorLink}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={agregarLink} disabled={guardandoLink || !selLink}
                      style={{ ...btn.solid, padding: '6px 14px', fontSize: 12, opacity: (guardandoLink || !selLink) ? 0.5 : 1, cursor: (guardandoLink || !selLink) ? 'default' : 'pointer' }}>
                      {guardandoLink ? 'Guardando…' : 'Agregar'}
                    </button>
                    <button onClick={() => { setMostrarAddLink(false); setQueryLink(''); setResultadosLink([]); setSelLink(null); setErrorLink(''); }}
                      style={{ ...btn.outline, padding: '6px 12px', fontSize: 12 }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </td>
    </tr>
  );
}

// ─── FilaComparacion ───────────────────────────────────────────────────────────
function FilaComparacion({ skuProveedor, propioId, onAccion, onCerrar }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/mapeo/comparar/${encodeURIComponent(skuProveedor)}`);
      if (res.ok) setItems(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [skuProveedor]);

  useEffect(() => { cargar(); }, [cargar]);

  async function accion(id, tipo) {
    setAccionId(id);
    try {
      const res = await apiFetch(`/mapeo/${id}/${tipo}`, { method: 'POST' });
      if (res.ok) { await cargar(); onAccion(); }
    } catch {}
    finally { setAccionId(null); }
  }

  async function ignorarTodos() {
    const ids = items.filter(it => ['pendiente', 'ambiguo'].includes(it.estado)).map(it => it.id);
    if (!ids.length) return;
    try {
      const res = await apiFetch('/mapeo/bulk/ignorar', { method: 'POST', body: JSON.stringify({ ids }) });
      if (res.ok) { await cargar(); onAccion(); }
    } catch {}
  }

  const hayAccionables = items.some(it => ['pendiente', 'ambiguo'].includes(it.estado));

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '16px 20px', background: '#faf5ff', borderLeft: `3px solid ${PURPLE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: PURPLE, fontFamily: F.sans }}>
              Comparación · SKU: <span style={{ fontFamily: F.mono }}>{skuProveedor}</span>
              {!loading && <span style={{ fontWeight: 400, color: C.textSec }}> · {items.length} proveedor{items.length !== 1 ? 'es' : ''}</span>}
            </p>
            {!loading && hayAccionables && (
              <button onClick={ignorarTodos} style={{ ...btn.outline, padding: '4px 10px', fontSize: 11, color: C.red, borderColor: C.red }}>
                Ignorar todos los pendientes
              </button>
            )}
            <button onClick={onCerrar} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 18, lineHeight: 1, marginLeft: 'auto', padding: 2 }}>×</button>
          </div>

          {loading ? (
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontFamily: F.sans }}>Cargando…</p>
          ) : (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', background: C.surface }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
                <thead>
                  <tr>
                    <th style={table.th}>Proveedor</th>
                    <th style={table.th}>Nombre producto</th>
                    <th style={table.th}>SKU guardado</th>
                    <th style={{ ...table.th, color: C.textMuted }}>SKU original</th>
                    <th style={{ ...table.th, textAlign: 'center' }}>Estado</th>
                    <th style={{ ...table.th, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} style={{ background: it.id === propioId ? '#f0f9ff' : C.surface }}>
                      <td style={table.td}>
                        <span style={{ fontWeight: it.id === propioId ? 600 : 400 }}>{it.proveedor?.nombre || '—'}</span>
                        <TemaTag tema={it.proveedor?.tema} />
                      </td>
                      <td style={{ ...table.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.nombreProducto || <span style={{ color: C.textMuted }}>—</span>}
                      </td>
                      <td style={{ ...table.td, fontFamily: F.mono, fontSize: 12 }}>{it.skuProveedor}</td>
                      <td style={{ ...table.td, fontFamily: F.mono, fontSize: 11, color: C.textMuted }}>
                        {it.skuOriginal || <span style={{ color: C.border }}>—</span>}
                      </td>
                      <td style={{ ...table.td, textAlign: 'center' }}><Badge estado={it.estado} /></td>
                      <td style={{ ...table.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 5 }}>
                          {['pendiente', 'ambiguo', 'confirmado'].includes(it.estado) && (
                            <button onClick={() => accion(it.id, 'ignorar')} disabled={accionId === it.id}
                              style={{ ...btn.outline, padding: '4px 10px', fontSize: 11, color: C.red, borderColor: C.red, opacity: accionId === it.id ? 0.5 : 1, cursor: accionId === it.id ? 'default' : 'pointer' }}>
                              {accionId === it.id ? '…' : 'Ignorar'}
                            </button>
                          )}
                          {it.estado === 'ignorado' && (
                            <button onClick={() => accion(it.id, 'restaurar')} disabled={accionId === it.id}
                              style={{ ...btn.outline, padding: '4px 10px', fontSize: 11, color: C.accent, borderColor: C.accent, opacity: accionId === it.id ? 0.5 : 1, cursor: accionId === it.id ? 'default' : 'pointer' }}>
                              {accionId === it.id ? '…' : 'Restaurar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Mapeo (página principal) ──────────────────────────────────────────────────
export default function Mapeo() {
  const [items, setItems]               = useState([]);
  const [proveedores, setProveedores]   = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Filtros
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [busqueda, setBusqueda]           = useState('');
  const [proveedorId, setProveedorId]     = useState('');
  const [categoria, setCategoria]         = useState('');
  const [estado, setEstado]               = useState('todos');

  // Paginación
  const [pagina, setPagina]             = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal]               = useState(0);

  // UI
  const [expandido, setExpandido]         = useState(null);
  const [comparando, setComparando]       = useState(null); // { id, skuProveedor }
  const [ignorandoId, setIgnorandoId]     = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [bulkLoading, setBulkLoading]     = useState(false);
  const [detectando, setDetectando]       = useState(false);
  const [mensajeConflictos, setMensajeConflictos] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    apiFetch('/proveedores').then(r => r.json()).then(d => setProveedores(Array.isArray(d) ? d : [])).catch(() => {});
    cargarStats();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setBusqueda(inputBusqueda.trim()); setPagina(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [inputBusqueda]);

  useEffect(() => {
    setPagina(1); setExpandido(null); setComparando(null); setSeleccionados(new Set());
  }, [proveedorId, categoria, estado, busqueda]);

  useEffect(() => { cargarItems(); }, [proveedorId, categoria, estado, busqueda, pagina]); // eslint-disable-line

  async function cargarStats() {
    try {
      const res = await apiFetch('/mapeo/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function cargarItems() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: pagina, limit: LIMIT, estado });
      if (proveedorId) params.set('proveedorId', proveedorId);
      if (categoria)   params.set('categoria', categoria);
      if (busqueda)    params.set('q', busqueda);
      const res = await apiFetch(`/mapeo/items?${params}`);
      if (!res.ok) { setError('Error al cargar items.'); return; }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setTotalPaginas(data.totalPaginas ?? Math.ceil((data.total ?? 0) / LIMIT));
      setSeleccionados(new Set());
    } catch { setError('Error de conexión.'); }
    finally { setLoading(false); }
  }

  function actualizarEstado(id, nuevoEstado) {
    if (estado !== 'todos' && estado !== nuevoEstado) {
      setItems(prev => prev.filter(it => it.id !== id));
      setTotal(t => Math.max(0, t - 1));
    } else {
      setItems(prev => prev.map(it => it.id === id ? { ...it, estado: nuevoEstado } : it));
    }
    setExpandido(null); setComparando(null);
    setSeleccionados(prev => { const n = new Set(prev); n.delete(id); return n; });
    cargarStats();
  }

  function handleEditado(itemActualizado) {
    setItems(prev => prev.map(it => it.id === itemActualizado.id ? { ...it, ...itemActualizado } : it));
    setExpandido(null); setComparando(null);
    cargarStats();
  }

  async function handleIgnorarDirecto(id) {
    setIgnorandoId(id);
    try { if ((await apiFetch(`/mapeo/${id}/ignorar`, { method: 'POST' })).ok) actualizarEstado(id, 'ignorado'); } catch {}
    finally { setIgnorandoId(null); }
  }

  async function handleRestaurarDirecto(id) {
    setRestaurandoId(id);
    try { if ((await apiFetch(`/mapeo/${id}/restaurar`, { method: 'POST' })).ok) actualizarEstado(id, 'pendiente'); } catch {}
    finally { setRestaurandoId(null); }
  }

  async function bulkAccion(accion) {
    const ids = [...seleccionados];
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const res = await apiFetch(`/mapeo/bulk/${accion}`, { method: 'POST', body: JSON.stringify({ ids }) });
      if (res.ok) { await cargarItems(); await cargarStats(); }
    } catch {}
    finally { setBulkLoading(false); }
  }

  async function detectarConflictos() {
    setDetectando(true); setMensajeConflictos('');
    try {
      const res  = await apiFetch('/mapeo/detectar-conflictos', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMensajeConflictos(data.marcados > 0
          ? `${data.marcados} item${data.marcados !== 1 ? 's' : ''} marcados como ambiguos (${data.skusConflicto} SKU${data.skusConflicto !== 1 ? 's' : ''} con conflicto)`
          : 'Sin conflictos nuevos encontrados.');
        await cargarItems(); await cargarStats();
      }
    } catch {}
    finally { setDetectando(false); }
  }

  function toggleExpandido(id) {
    setExpandido(prev => prev === id ? null : id);
    setComparando(null);
  }

  function toggleComparando(item) {
    setComparando(prev => prev?.id === item.id ? null : { id: item.id, skuProveedor: item.skuProveedor });
    setExpandido(null);
  }

  function toggleSeleccion(id) {
    setSeleccionados(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleTodos() {
    setSeleccionados(seleccionados.size === items.length ? new Set() : new Set(items.map(it => it.id)));
  }

  const todosMarcados   = items.length > 0 && seleccionados.size === items.length;
  const algunosMarcados = seleccionados.size > 0 && seleccionados.size < items.length;

  return (
    <div>
      <PageHeader
        title="Validación de productos"
        subtitle="Revisión y confirmación de productos pendientes de mapeo con JumpSeller."
        action={
          stats && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatChip label="Total"       value={stats.total      ?? 0} bg="#f1f5f9"    color={C.textSec}   />
              <StatChip label="Pendientes"  value={stats.pendientes ?? 0} bg={C.yellowBg} color={C.yellow}    />
              {(stats.ambiguos ?? 0) > 0 && <StatChip label="Ambiguos" value={stats.ambiguos} bg="#f3e8ff" color={PURPLE} />}
              <StatChip label="Confirmados" value={stats.confirmados ?? 0} bg={C.greenBg} color={C.green}     />
              <StatChip label="Ignorados"   value={stats.ignorados  ?? 0} bg="#f1f5f9"    color={C.textMuted} />
            </div>
          )
        }
      />

      {/* Filtros */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, boxShadow: shadow.sm, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Buscar SKU o nombre…" value={inputBusqueda} onChange={e => setInputBusqueda(e.target.value)} style={{ ...inputStyle, paddingLeft: 30 }} />
          {inputBusqueda && (
            <button onClick={() => setInputBusqueda('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 15, lineHeight: 1, padding: 2 }}>×</button>
          )}
        </div>

        <select style={{ ...selectStyle, minWidth: 130 }} value={estado} onChange={e => setEstado(e.target.value)}>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select style={selectStyle} value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
          <option value="">Todos los proveedores</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select style={selectStyle} value={categoria} onChange={e => setCategoria(e.target.value)}>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <button onClick={detectarConflictos} disabled={detectando} style={{
          ...btn.outline, padding: '7px 12px', fontSize: 12,
          color: PURPLE, borderColor: PURPLE,
          opacity: detectando ? 0.6 : 1, cursor: detectando ? 'default' : 'pointer',
        }}>
          {detectando ? 'Detectando…' : 'Detectar conflictos'}
        </button>

        {total > 0 && <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F.sans, marginLeft: 'auto' }}>{total} item{total !== 1 ? 's' : ''}</span>}
      </div>

      {/* Mensaje detectar conflictos */}
      {mensajeConflictos && (
        <div style={{ marginBottom: 8, padding: '8px 14px', borderRadius: 6, fontSize: 12, fontFamily: F.sans, background: '#f3e8ff', color: PURPLE, border: `1px solid ${PURPLE}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{mensajeConflictos}</span>
          <button onClick={() => setMensajeConflictos('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, color: 'inherit', padding: '0 2px' }}>×</button>
        </div>
      )}

      {/* Bulk actions */}
      {seleccionados.size > 0 && (
        <div style={{ background: C.accent, borderRadius: 8, padding: '10px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: shadow.sm }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: F.sans }}>{seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
          {['ignorar', 'restaurar'].map(accion => (
            <button key={accion} onClick={() => bulkAccion(accion)} disabled={bulkLoading} style={{ border: '1px solid rgba(255,255,255,0.45)', borderRadius: 6, background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600, padding: '5px 12px', cursor: bulkLoading ? 'default' : 'pointer', fontFamily: F.sans, opacity: bulkLoading ? 0.6 : 1 }}>
              {accion.charAt(0).toUpperCase() + accion.slice(1)} seleccionados
            </button>
          ))}
          <button onClick={() => setSeleccionados(new Set())} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1, marginLeft: 'auto', padding: 2 }}>×</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 8, padding: '10px 14px', borderRadius: 6, fontSize: 13, fontFamily: F.sans, background: C.redBg, color: C.red, border: `1px solid ${C.red}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Tabla */}
      <div className="scroll-x" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={{ ...table.th, width: 36, paddingLeft: 14 }}>
                <input type="checkbox" checked={todosMarcados}
                  ref={el => { if (el) el.indeterminate = algunosMarcados; }}
                  onChange={toggleTodos} style={{ cursor: 'pointer' }} />
              </th>
              <th style={table.th}>SKU proveedor</th>
              <th style={table.th}>Nombre producto</th>
              <th style={table.th}>Marca</th>
              <th style={table.th}>Proveedor</th>
              <th style={{ ...table.th, textAlign: 'center' }}>Estado</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                <td key={j} style={table.td}>
                  <div style={{ height: 13, background: C.border, borderRadius: 4, width: j === 0 ? 16 : j === 1 ? '60%' : '40%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                </td>
              ))}</tr>
            ))}

            {!loading && !items.length && (
              <tr><td colSpan={7} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 48 }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay items en este estado.'}
              </td></tr>
            )}

            {!loading && items.map(item => (
              <>
                <tr key={item.id} style={{ background: expandido === item.id || comparando?.id === item.id ? C.accentLight : seleccionados.has(item.id) ? '#f0f9ff' : C.surface, transition: 'background 0.15s' }}>
                  <td style={{ ...table.td, width: 36, paddingLeft: 14 }}>
                    <input type="checkbox" checked={seleccionados.has(item.id)} onChange={() => toggleSeleccion(item.id)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ ...table.td, fontFamily: F.mono, fontSize: 12 }}>
                    {item.skuProveedor}
                    {item.skuOriginal && <span style={{ display: 'block', fontSize: 10, color: C.textMuted, fontFamily: F.mono }}>orig: {item.skuOriginal}</span>}
                  </td>
                  <td style={{ ...table.td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nombreProducto || <span style={{ color: C.textMuted }}>—</span>}
                  </td>
                  <td style={{ ...table.td, fontSize: 12, color: C.textSec, whiteSpace: 'nowrap' }}>
                    {item.marca || <span style={{ color: C.textMuted }}>—</span>}
                  </td>
                  <td style={{ ...table.td, color: C.textSec }}>
                    <span>{item.proveedor?.nombre || '—'}</span>
                    <TemaTag tema={item.proveedor?.tema} />
                  </td>
                  <td style={{ ...table.td, textAlign: 'center' }}>
                    <Badge estado={item.estado} />
                    <MismatchTag item={item} />
                  </td>
                  <td style={{ ...table.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {item.estado === 'ambiguo' && (
                        <button onClick={() => toggleComparando(item)}
                          style={{ ...btn.outline, padding: '5px 12px', fontSize: 12, color: PURPLE, borderColor: PURPLE, background: comparando?.id === item.id ? '#f3e8ff' : 'transparent' }}>
                          {comparando?.id === item.id ? 'Cerrar' : 'Comparar'}
                        </button>
                      )}
                      <button onClick={() => toggleExpandido(item.id)}
                        style={{ ...btn.solid, padding: '5px 12px', fontSize: 12, background: expandido === item.id ? C.accentHov : C.accent }}>
                        {expandido === item.id ? 'Cancelar' : 'Revisar'}
                      </button>
                      {['pendiente', 'ambiguo', 'confirmado'].includes(item.estado) && (
                        <button onClick={() => handleIgnorarDirecto(item.id)} disabled={ignorandoId === item.id}
                          style={{ ...btn.outline, padding: '5px 12px', fontSize: 12, color: C.red, borderColor: C.red, opacity: ignorandoId === item.id ? 0.5 : 1, cursor: ignorandoId === item.id ? 'not-allowed' : 'pointer' }}>
                          {ignorandoId === item.id ? '…' : 'Ignorar'}
                        </button>
                      )}
                      {item.estado === 'ignorado' && (
                        <button onClick={() => handleRestaurarDirecto(item.id)} disabled={restaurandoId === item.id}
                          style={{ ...btn.outline, padding: '5px 12px', fontSize: 12, color: C.accent, borderColor: C.accent, opacity: restaurandoId === item.id ? 0.5 : 1, cursor: restaurandoId === item.id ? 'not-allowed' : 'pointer' }}>
                          {restaurandoId === item.id ? '…' : 'Restaurar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {expandido === item.id && (
                  <FilaExpandida key={`exp-${item.id}`} item={item}
                    onConfirmado={id => actualizarEstado(id, 'confirmado')}
                    onIgnorado={id => actualizarEstado(id, 'ignorado')}
                    onRestaurado={id => actualizarEstado(id, 'pendiente')}
                    onEditado={handleEditado}
                    onCancelar={() => setExpandido(null)}
                  />
                )}

                {comparando?.id === item.id && (
                  <FilaComparacion key={`cmp-${item.id}`}
                    skuProveedor={item.skuProveedor}
                    propioId={item.id}
                    onAccion={() => { cargarItems(); cargarStats(); }}
                    onCerrar={() => setComparando(null)}
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
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            style={{ ...btn.outline, padding: '6px 12px', fontSize: 12, opacity: pagina === 1 ? 0.4 : 1, cursor: pagina === 1 ? 'default' : 'pointer' }}>
            ‹ Anterior
          </button>
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: F.sans, padding: '0 8px' }}>Página {pagina} de {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            style={{ ...btn.outline, padding: '6px 12px', fontSize: 12, opacity: pagina === totalPaginas ? 0.4 : 1, cursor: pagina === totalPaginas ? 'default' : 'pointer' }}>
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  );
}
