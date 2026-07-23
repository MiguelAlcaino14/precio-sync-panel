import { useState, useEffect, useRef } from 'react';
import { C, F, shadow, table, btn, form as formStyles } from '../theme';
import { apiFetch } from '../api';

const TIPOS = [
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'marca',     label: 'Marca' },
  { value: 'categoria', label: 'Categoría' },
  { value: 'producto',  label: 'Producto específico' },
];

const CATEGORIAS = [
  { value: 'libreria',  label: 'Librería' },
  { value: 'aseo',      label: 'Aseo' },
  { value: 'alimentos', label: 'Alimentos' },
];

const vacio = {
  nombre: '', tipo: 'proveedor', descuentoPct: '',
  proveedorId: '', marca: '', categoria: 'libreria', productoIds: [],
  fechaInicio: '', fechaFin: '',
};

function badgeTipo(tipo) {
  const colores = {
    proveedor: { bg: '#dbeafe', color: '#1d4ed8' },
    marca:     { bg: '#d1fae5', color: '#059669' },
    categoria: { bg: '#fef3c7', color: '#d97706' },
    producto:  { bg: '#ede9fe', color: '#7c3aed' },
  };
  const etiquetas = { proveedor: 'Proveedor', marca: 'Marca', categoria: 'Categoría', producto: 'Producto' };
  const s = colores[tipo] || { bg: C.border, color: C.textSec };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: s.bg, color: s.color,
    }}>
      {etiquetas[tipo] || tipo}
    </span>
  );
}

function targetLabel(o) {
  if (o.tipo === 'proveedor') return o.proveedor?.nombre || '—';
  if (o.tipo === 'marca')     return o.marca || '—';
  if (o.tipo === 'categoria') return { libreria: 'Librería', aseo: 'Aseo', alimentos: 'Alimentos' }[o.categoria] || o.categoria;
  if (o.tipo === 'producto') {
    const prods = (o.productosOferta || []).map(p => p.producto).filter(Boolean);
    if (!prods.length) return o.producto ? `${o.producto.sku} — ${o.producto.nombre}` : '—';
    const primera = `${prods[0].sku} — ${prods[0].nombre}`;
    return prods.length > 1 ? `${primera} y ${prods.length - 1} más` : primera;
  }
  return '—';
}

function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-CL');
}

export default function Ofertas() {
  const [ofertas,      setOfertas]      = useState([]);
  const [proveedores,  setProveedores]  = useState([]);
  const [marcasDisp,   setMarcasDisp]   = useState([]);
  const [form,         setForm]         = useState(vacio);
  const [editandoId,   setEditandoId]   = useState(null);
  const [feedback,     setFeedback]     = useState(null);
  const [skuBusqueda,  setSkuBusqueda]  = useState('');
  const [skuOpts,      setSkuOpts]      = useState([]);
  const [mostrarSkus,  setMostrarSkus]  = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [publicando,   setPublicando]   = useState({});
  const skuInputRef = useRef(null);

  useEffect(() => {
    cargar();
    apiFetch('/proveedores')
      .then(r => r.json())
      .then(d => setProveedores(Array.isArray(d) ? d : []))
      .catch(() => {});
    apiFetch('/ofertas/marcas')
      .then(r => r.json())
      .then(d => setMarcasDisp(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function cargar() {
    try {
      const res = await apiFetch('/ofertas');
      if (res.ok) setOfertas(await res.json());
    } catch {}
  }

  function abrirEditar(o) {
    // Construir lista de productos seleccionados desde productosOferta (junction) o productoId legacy
    let productosSeleccionados = [];
    if (o.productosOferta?.length > 0) {
      productosSeleccionados = o.productosOferta
        .map(p => p.producto)
        .filter(Boolean)
        .map(p => ({ id: p.id, sku: p.sku, nombre: p.nombre }));
    } else if (o.productoId && o.producto) {
      productosSeleccionados = [{ id: o.producto.id, sku: o.producto.sku, nombre: o.producto.nombre }];
    }

    setForm({
      nombre:       o.nombre,
      tipo:         o.tipo,
      descuentoPct: String(o.descuentoPct),
      proveedorId:  o.proveedorId  || '',
      marca:        o.marca        || '',
      categoria:    o.categoria    || 'libreria',
      productoIds:  productosSeleccionados,
      fechaInicio:  o.fechaInicio ? o.fechaInicio.slice(0, 10) : '',
      fechaFin:     o.fechaFin    ? o.fechaFin.slice(0, 10)    : '',
    });
    setSkuBusqueda('');
    setEditandoId(o.id);
    setFeedback(null);
  }

  function cancelar() {
    setForm(vacio);
    setEditandoId(null);
    setSkuBusqueda('');
    setSkuOpts([]);
    setFeedback(null);
  }

  async function buscarProductos(q) {
    if (q.length < 2) { setSkuOpts([]); return; }
    try {
      const res  = await apiFetch(`/reglas/skus?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSkuOpts(Array.isArray(data) ? data : []);
      setMostrarSkus(true);
    } catch {}
  }

  function agregarProducto(p) {
    setForm(f => {
      if (f.productoIds.some(x => x.id === p.id)) return f;
      return { ...f, productoIds: [...f.productoIds, { id: p.id, sku: p.sku, nombre: p.nombre }] };
    });
    // Mantener el dropdown abierto y el input enfocado para seguir agregando
    skuInputRef.current?.focus();
  }

  function quitarProducto(id) {
    setForm(f => ({ ...f, productoIds: f.productoIds.filter(p => p.id !== id) }));
  }

  async function guardar() {
    const body = {
      nombre:      form.nombre,
      tipo:        form.tipo,
      descuentoPct: parseFloat(form.descuentoPct),
      proveedorId:  form.tipo === 'proveedor' ? form.proveedorId   : undefined,
      marca:        form.tipo === 'marca'     ? form.marca          : undefined,
      categoria:    form.tipo === 'categoria' ? form.categoria      : undefined,
      productoIds:  form.tipo === 'producto'  ? form.productoIds.map(p => p.id) : undefined,
      fechaInicio:  form.fechaInicio || undefined,
      fechaFin:     form.fechaFin    || undefined,
    };

    setCargando(true);
    try {
      const res  = editandoId
        ? await apiFetch(`/ofertas/${editandoId}`, { method: 'PUT', body: JSON.stringify(body) })
        : await apiFetch('/ofertas',               { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) { setFeedback({ ok: false, texto: data.error || 'Error al guardar.' }); return; }

      if (editandoId) {
        setOfertas(prev => prev.map(o => o.id === editandoId ? data : o));
        setFeedback({ ok: true, texto: 'Oferta actualizada.' });
      } else {
        setOfertas(prev => [data, ...prev]);
        setFeedback({ ok: true, texto: 'Oferta creada.' });
      }
      cancelar();
    } catch {
      setFeedback({ ok: false, texto: 'Error de conexión.' });
    } finally {
      setCargando(false);
    }
  }

  async function toggleActiva(o) {
    try {
      const res  = await apiFetch(`/ofertas/${o.id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) setOfertas(prev => prev.map(x => x.id === o.id ? { ...x, activa: data.activa } : x));
    } catch {}
  }

  async function publicarOferta(o) {
    setPublicando(p => ({ ...p, [o.id]: true }));
    setFeedback(null);
    try {
      const res  = await apiFetch(`/ofertas/${o.id}/publicar`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setFeedback({ ok: false, texto: data.error || 'Error al publicar.' }); return; }
      setOfertas(prev => prev.map(x => x.id === o.id ? { ...x, publicada: true } : x));
      setFeedback({ ok: true, texto: `Oferta publicada — ${data.aplicados} productos actualizados en JumpSeller.${data.errores?.length ? ` ${data.errores.length} errores.` : ''}` });
    } catch {
      setFeedback({ ok: false, texto: 'Error de conexión al publicar.' });
    } finally {
      setPublicando(p => ({ ...p, [o.id]: false }));
    }
  }

  async function revertirOferta(o) {
    if (!window.confirm(`¿Revertir la oferta "${o.nombre}" en JumpSeller? Se restaurarán los precios originales.`)) return;
    setPublicando(p => ({ ...p, [o.id]: true }));
    setFeedback(null);
    try {
      const res  = await apiFetch(`/ofertas/${o.id}/revertir`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setFeedback({ ok: false, texto: data.error || 'Error al revertir.' }); return; }
      setOfertas(prev => prev.map(x => x.id === o.id ? { ...x, publicada: false } : x));
      setFeedback({ ok: true, texto: `Oferta revertida — ${data.revertidos} productos restaurados en JumpSeller.` });
    } catch {
      setFeedback({ ok: false, texto: 'Error de conexión al revertir.' });
    } finally {
      setPublicando(p => ({ ...p, [o.id]: false }));
    }
  }

  async function eliminar(o) {
    if (!window.confirm(`¿Eliminar oferta "${o.nombre}"?`)) return;
    try {
      await apiFetch(`/ofertas/${o.id}`, { method: 'DELETE' });
      setOfertas(prev => prev.filter(x => x.id !== o.id));
      setFeedback({ ok: true, texto: 'Oferta eliminada.' });
    } catch {
      setFeedback({ ok: false, texto: 'Error al eliminar.' });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          Ofertas
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
          Aplica descuentos por proveedor, marca, categoría o producto. Se aplican al publicar precios en JumpSeller.
          La oferta más específica tiene prioridad (Producto {'>'} Marca {'>'} Proveedor {'>'} Categoría).
        </p>
      </div>

      {feedback && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 6,
          background: feedback.ok ? C.greenBg : C.redBg,
          border: `1px solid ${feedback.ok ? C.green : C.red}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: feedback.ok ? C.green : C.red, fontWeight: 500 }}>
            {feedback.texto}
          </span>
          <button onClick={() => setFeedback(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: feedback.ok ? C.green : C.red, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Formulario */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 16, boxShadow: shadow.sm }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: C.text }}>
          {editandoId ? 'Editar oferta' : 'Nueva oferta'}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Nombre */}
          <div style={formStyles.field}>
            <label style={formStyles.label}>Nombre</label>
            <input style={{ ...formStyles.input, width: 200 }} value={form.nombre} placeholder="Ej: Liquidación julio"
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>

          {/* Tipo */}
          <div style={formStyles.field}>
            <label style={formStyles.label}>Aplica a</label>
            <select style={{ ...formStyles.input, cursor: 'pointer', width: 170 }} value={form.tipo}
              onChange={e => { setSkuBusqueda(''); setSkuOpts([]); setMostrarSkus(false); setForm(f => ({ ...f, tipo: e.target.value, proveedorId: '', marca: '', categoria: 'libreria', productoIds: [] })); }}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Target según tipo */}
          {form.tipo === 'proveedor' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Proveedor</label>
              <select style={{ ...formStyles.input, cursor: 'pointer', width: 200 }} value={form.proveedorId}
                onChange={e => setForm(f => ({ ...f, proveedorId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}

          {form.tipo === 'marca' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Marca</label>
              {marcasDisp.length > 0 ? (
                <select style={{ ...formStyles.input, cursor: 'pointer', width: 180 }} value={form.marca}
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {marcasDisp.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input style={{ ...formStyles.input, width: 160 }} value={form.marca} placeholder="Ej: Torre"
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
              )}
            </div>
          )}

          {form.tipo === 'categoria' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Categoría</label>
              <select style={{ ...formStyles.input, cursor: 'pointer', width: 140 }} value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {form.tipo === 'producto' && (
            <div style={{ ...formStyles.field, minWidth: 260 }}>
              <label style={formStyles.label}>Productos (SKU o nombre)</label>

              {/* Chips de productos seleccionados */}
              {form.productoIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {form.productoIds.map(p => (
                    <span key={p.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 12, fontSize: 11,
                      background: '#ede9fe', color: '#7c3aed', fontWeight: 500,
                    }}>
                      <span style={{ fontFamily: F.mono }}>{p.sku}</span>
                      <button
                        onMouseDown={e => { e.preventDefault(); quitarProducto(p.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, lineHeight: 1, fontSize: 13 }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Búsqueda */}
              <div style={{ position: 'relative' }}>
                <input
                  ref={skuInputRef}
                  style={{ ...formStyles.input, width: 240 }}
                  value={skuBusqueda}
                  placeholder="Buscar y agregar..."
                  autoComplete="off"
                  onChange={e => { setSkuBusqueda(e.target.value); buscarProductos(e.target.value); }}
                  onFocus={() => { if (skuOpts.length > 0) setMostrarSkus(true); }}
                  onBlur={() => setTimeout(() => setMostrarSkus(false), 150)}
                />
                {mostrarSkus && skuOpts.length > 0 && (
                  <div
                    onMouseDown={e => e.preventDefault()}
                    style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: 320,
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                      boxShadow: shadow.sm, maxHeight: 200, overflowY: 'auto',
                    }}>
                    {skuOpts.map(p => {
                      const yaAgregado = form.productoIds.some(x => x.id === p.id);
                      return (
                        <div key={p.sku} onMouseDown={() => { if (!yaAgregado) agregarProducto(p); }}
                          style={{
                            padding: '7px 12px', cursor: yaAgregado ? 'default' : 'pointer',
                            fontSize: 12, borderBottom: `1px solid ${C.border}`,
                            opacity: yaAgregado ? 0.45 : 1,
                          }}>
                          <span style={{ fontFamily: F.mono, fontWeight: 600 }}>{p.sku}</span>
                          <span style={{ color: C.textSec, marginLeft: 8 }}>{p.nombre}</span>
                          {yaAgregado && <span style={{ marginLeft: 8, color: C.textMuted, fontSize: 10 }}>ya agregado</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Descuento */}
          <div style={formStyles.field}>
            <label style={formStyles.label}>Descuento %</label>
            <input style={{ ...formStyles.input, width: 90 }} type="number" min="1" max="100"
              value={form.descuentoPct} placeholder="10"
              onChange={e => setForm(f => ({ ...f, descuentoPct: e.target.value }))} />
          </div>

          {/* Fechas */}
          <div style={formStyles.field}>
            <label style={formStyles.label}>Desde *</label>
            <input required style={{ ...formStyles.input, width: 140 }} type="date" value={form.fechaInicio}
              onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Hasta *</label>
            <input required style={{ ...formStyles.input, width: 140 }} type="date" value={form.fechaFin}
              onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button onClick={guardar} disabled={cargando} style={btn.solid}>
              {cargando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear oferta'}
            </button>
            {editandoId && (
              <button onClick={cancelar} style={btn.outline}>Cancelar</button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="scroll-x" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={table.th}>Nombre</th>
              <th style={table.th}>Aplica a</th>
              <th style={table.th}>Target</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Descuento</th>
              <th style={table.th}>Desde</th>
              <th style={table.th}>Hasta</th>
              <th style={{ ...table.th, textAlign: 'center' }}>Estado</th>
              <th style={{ ...table.th, textAlign: 'center' }}>JumpSeller</th>
              <th style={table.th}></th>
            </tr>
          </thead>
          <tbody>
            {ofertas.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 36 }}>
                  No hay ofertas creadas. Agrega una para comenzar.
                </td>
              </tr>
            )}
            {ofertas.map(o => (
              <tr key={o.id} style={{ background: editandoId === o.id ? C.rowSelected : C.surface, opacity: o.activa ? 1 : 0.55 }}>
                <td style={{ ...table.td, fontWeight: 500 }}>{o.nombre}</td>
                <td style={table.td}>{badgeTipo(o.tipo)}</td>
                <td style={{ ...table.td, fontSize: 12, color: C.textSec }}>{targetLabel(o)}</td>
                <td style={{ ...table.td, textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: '#fee2e2', color: C.red, fontSize: 13, fontWeight: 700, fontFamily: F.mono }}>
                    -{o.descuentoPct}%
                  </span>
                </td>
                <td style={{ ...table.td, fontSize: 12, color: C.textSec }}>{fmtFecha(o.fechaInicio)}</td>
                <td style={{ ...table.td, fontSize: 12, color: C.textSec }}>{fmtFecha(o.fechaFin)}</td>
                <td style={{ ...table.td, textAlign: 'center' }}>
                  <button onClick={() => toggleActiva(o)} style={{
                    cursor: 'pointer', border: 'none', borderRadius: 12,
                    padding: '3px 10px', fontSize: 11, fontWeight: 600, fontFamily: F.sans,
                    background: o.activa ? C.greenBg : C.border,
                    color: o.activa ? C.green : C.textMuted,
                  }}>
                    {o.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td style={{ ...table.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {publicando[o.id] ? (
                    <span style={{ fontSize: 11, color: C.textMuted }}>Procesando...</span>
                  ) : o.publicada ? (
                    <button onClick={() => revertirOferta(o)} style={{
                      cursor: 'pointer', border: `1px solid ${C.red}`, padding: '4px 10px',
                      fontSize: 11, fontWeight: 600, borderRadius: 5, background: '#fee2e2',
                      color: C.red, fontFamily: F.sans,
                    }}>↩ Revertir</button>
                  ) : (
                    <button onClick={() => publicarOferta(o)} disabled={!o.activa} style={{
                      cursor: o.activa ? 'pointer' : 'not-allowed',
                      border: `1px solid ${o.activa ? '#16a34a' : C.border}`,
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 5,
                      background: o.activa ? '#dcfce7' : C.border,
                      color: o.activa ? '#16a34a' : C.textMuted, fontFamily: F.sans,
                      opacity: o.activa ? 1 : 0.5,
                    }}>↑ Publicar en JS</button>
                  )}
                </td>
                <td style={{ ...table.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => abrirEditar(o)} style={{
                    cursor: 'pointer', border: `1px solid ${C.border}`, padding: '4px 10px',
                    fontSize: 12, fontWeight: 500, borderRadius: 5, background: 'transparent',
                    color: C.textSec, fontFamily: F.sans, marginRight: 6,
                  }}>Editar</button>
                  <button onClick={() => eliminar(o)} style={{
                    cursor: 'pointer', border: `1px solid ${C.border}`, padding: '4px 10px',
                    fontSize: 12, fontWeight: 500, borderRadius: 5, background: 'transparent',
                    color: C.red, fontFamily: F.sans,
                  }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
