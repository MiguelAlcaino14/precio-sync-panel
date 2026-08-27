import { useState, useEffect, useRef } from 'react';
import { C, F, shadow, table, btn, form as formStyles } from '../theme';
import { apiFetch } from '../api';
import { ConfirmModal } from '../components/Modals';

const TIPOS = [
  { value: 'proveedor',       label: 'Proveedor' },
  { value: 'marca',           label: 'Marca' },
  { value: 'categoria',       label: 'Categoría' },
  { value: 'producto',        label: 'Grupo' },
  { value: 'producto_precio', label: 'Producto específico' },
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
  productoEspecifico: null, // { id, sku, nombre, ultimoCosto, precioSugerido }
  nuevoPrecio: '',
};

function badgeTipo(tipo) {
  const colores = {
    proveedor:       { bg: '#dbeafe', color: '#1d4ed8' },
    marca:           { bg: '#d1fae5', color: '#059669' },
    categoria:       { bg: '#fef3c7', color: '#d97706' },
    producto:        { bg: '#ede9fe', color: '#7c3aed' },
    producto_precio: { bg: '#fce7f3', color: '#be185d' },
  };
  const etiquetas = { proveedor: 'Proveedor', marca: 'Marca', categoria: 'Categoría', producto: 'Grupo', producto_precio: 'Producto específico' };
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
  if (o.tipo === 'producto_precio') {
    const prods = (o.productosOferta || []).map(p => p.producto).filter(Boolean);
    if (!prods.length) return '—';
    return `${prods[0].sku} — ${prods[0].nombre}`;
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
  const [confirmModal, setConfirmModal] = useState(null);
  const showConfirm = (message, onConfirm, opts = {}) =>
    new Promise(resolve => setConfirmModal({ message, ...opts, onConfirm: () => { setConfirmModal(null); resolve(true); onConfirm?.(); }, onCancel: () => { setConfirmModal(null); resolve(false); } }));

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
    let productosSeleccionados = [];
    if (o.productosOferta?.length > 0) {
      productosSeleccionados = o.productosOferta
        .map(p => p.producto)
        .filter(Boolean)
        .map(p => ({ id: p.id, sku: p.sku, nombre: p.nombre }));
    } else if (o.productoId && o.producto) {
      productosSeleccionados = [{ id: o.producto.id, sku: o.producto.sku, nombre: o.producto.nombre }];
    }

    let productoEspecifico = null;
    if (o.tipo === 'producto_precio') {
      const prods = (o.productosOferta || []).map(p => p.producto).filter(Boolean);
      if (prods.length > 0) {
        productoEspecifico = { id: prods[0].id, sku: prods[0].sku, nombre: prods[0].nombre, ultimoCosto: null, precioSugerido: null };
      }
    }

    setForm({
      nombre:             o.nombre,
      tipo:               o.tipo,
      descuentoPct:       String(o.descuentoPct),
      proveedorId:        o.proveedorId  || '',
      marca:              o.marca        || '',
      categoria:          o.categoria    || 'libreria',
      productoIds:        productosSeleccionados,
      fechaInicio:        o.fechaInicio ? o.fechaInicio.slice(0, 10) : '',
      fechaFin:           o.fechaFin    ? o.fechaFin.slice(0, 10)    : '',
      productoEspecifico,
      nuevoPrecio:        '',
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

  async function buscarProductosConPrecio(q) {
    if (q.length < 2) { setSkuOpts([]); return; }
    try {
      const res  = await apiFetch(`/productos?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setSkuOpts(Array.isArray(data.productos) ? data.productos : []);
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
    if (!form.nombre.trim()) {
      setFeedback({ ok: false, texto: 'El nombre es obligatorio.' });
      return;
    }

    let descuento;
    if (form.tipo === 'producto_precio') {
      if (!form.productoEspecifico) {
        setFeedback({ ok: false, texto: 'Selecciona un producto.' }); return;
      }
      if (form.nuevoPrecio && form.productoEspecifico.precioSugerido) {
        const np = parseFloat(form.nuevoPrecio);
        const ps = form.productoEspecifico.precioSugerido;
        descuento = ((ps - np) / ps) * 100;
        if (isNaN(descuento) || descuento <= 0 || descuento >= 100) {
          setFeedback({ ok: false, texto: 'El nuevo precio debe ser menor al precio sugerido.' }); return;
        }
      } else if (form.descuentoPct) {
        descuento = parseFloat(form.descuentoPct);
        if (isNaN(descuento) || descuento < 1 || descuento > 99) {
          setFeedback({ ok: false, texto: 'Descuento inválido.' }); return;
        }
      } else {
        setFeedback({ ok: false, texto: 'Ingresa el nuevo precio del producto.' }); return;
      }
    } else {
      descuento = parseFloat(form.descuentoPct);
      if (!form.descuentoPct || isNaN(descuento) || descuento < 1 || descuento > 99) {
        setFeedback({ ok: false, texto: 'El descuento debe estar entre 1 y 99.' });
        return;
      }
    }

    if (form.tipo === 'proveedor' && !form.proveedorId) {
      setFeedback({ ok: false, texto: 'Selecciona un proveedor.' });
      return;
    }
    if (form.tipo === 'marca' && !form.marca?.trim()) {
      setFeedback({ ok: false, texto: 'Ingresa una marca.' });
      return;
    }
    if (form.tipo === 'producto' && !form.productoIds?.length) {
      setFeedback({ ok: false, texto: 'Agrega al menos un producto.' });
      return;
    }
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      setFeedback({ ok: false, texto: 'La fecha de fin debe ser posterior a la de inicio.' });
      return;
    }
    const body = {
      nombre:       form.nombre,
      tipo:         form.tipo,
      descuentoPct: form.tipo === 'producto_precio' ? Math.round(descuento) : descuento,
      proveedorId:  form.tipo === 'proveedor'       ? form.proveedorId                      : undefined,
      marca:        form.tipo === 'marca'            ? form.marca                            : undefined,
      categoria:    form.tipo === 'categoria'        ? form.categoria                        : undefined,
      productoIds:  form.tipo === 'producto'         ? form.productoIds.map(p => p.id)
                  : form.tipo === 'producto_precio'  ? [form.productoEspecifico.id]          : undefined,
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
    const ok = await showConfirm(`¿Revertir la oferta "${o.nombre}" en JumpSeller? Se restaurarán los precios originales.`, null, { confirmLabel: 'Revertir' });
    if (!ok) return;
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
    const ok = await showConfirm(`¿Eliminar oferta "${o.nombre}"?`, null, { confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
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
      {confirmModal && <ConfirmModal {...confirmModal} />}
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

        {/* Fila 1: campos fijos siempre visibles */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', rowGap: 10 }}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Nombre</label>
            <input style={{ ...formStyles.input, width: 200 }} value={form.nombre} placeholder="Ej: Liquidación julio"
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Aplica a</label>
            <select style={{ ...formStyles.input, cursor: 'pointer', width: 170 }} value={form.tipo}
              onChange={e => { setSkuBusqueda(''); setSkuOpts([]); setMostrarSkus(false); setForm(f => ({ ...f, tipo: e.target.value, proveedorId: '', marca: '', categoria: 'libreria', productoIds: [], productoEspecifico: null, nuevoPrecio: '', descuentoPct: '' })); }}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {form.tipo !== 'producto_precio' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Descuento %</label>
              <input style={{ ...formStyles.input, width: 90 }} type="number" min="1" max="100"
                value={form.descuentoPct} placeholder="10"
                onChange={e => setForm(f => ({ ...f, descuentoPct: e.target.value }))} />
            </div>
          )}

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

        {/* Fila 2: target según tipo */}
        <div style={{ marginTop: 12 }}>
          {form.tipo === 'proveedor' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Proveedor</label>
              <select style={{ ...formStyles.input, cursor: 'pointer', width: 220 }} value={form.proveedorId}
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
                <select style={{ ...formStyles.input, cursor: 'pointer', width: 200 }} value={form.marca}
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {marcasDisp.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input style={{ ...formStyles.input, width: 180 }} value={form.marca} placeholder="Ej: Torre"
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
              )}
            </div>
          )}

          {form.tipo === 'categoria' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Categoría</label>
              <select style={{ ...formStyles.input, cursor: 'pointer', width: 160 }} value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {form.tipo === 'producto' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Productos (SKU o nombre)</label>
              {form.productoIds.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6,
                  maxHeight: 68, overflowY: 'auto',
                  padding: '4px 6px', borderRadius: 6,
                  background: '#f5f3ff', border: `1px solid #ddd6fe`,
                }}>
                  {form.productoIds.map(p => (
                    <span key={p.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 12, fontSize: 11,
                      background: '#ede9fe', color: '#7c3aed', fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}>
                      {p.sku}
                      <button
                        onMouseDown={e => { e.preventDefault(); quitarProducto(p.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, lineHeight: 1, fontSize: 13 }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  ref={skuInputRef}
                  style={{ ...formStyles.input, width: 260 }}
                  value={skuBusqueda}
                  placeholder="Buscar y agregar..."
                  autoComplete="off"
                  onChange={e => { setSkuBusqueda(e.target.value); buscarProductos(e.target.value); }}
                  onFocus={() => { if (skuOpts.length > 0) setMostrarSkus(true); }}
                  onBlur={() => setTimeout(() => setMostrarSkus(false), 150)}
                />
                {mostrarSkus && skuOpts.length > 0 && (
                  <div onMouseDown={e => e.preventDefault()} style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: 320,
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                    boxShadow: shadow.sm, maxHeight: 200, overflowY: 'auto',
                  }}>
                    {skuOpts.map(p => {
                      const yaAgregado = form.productoIds.some(x => x.id === p.id);
                      return (
                        <div key={p.sku} onMouseDown={() => { if (!yaAgregado) agregarProducto(p); }}
                          style={{ padding: '7px 12px', cursor: yaAgregado ? 'default' : 'pointer', fontSize: 12, borderBottom: `1px solid ${C.border}`, opacity: yaAgregado ? 0.45 : 1 }}>
                          <span style={{ fontWeight: 600 }}>{p.sku}</span>
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

          {form.tipo === 'producto_precio' && (
            <div style={formStyles.field}>
              <label style={formStyles.label}>Producto (SKU o nombre)</label>
              {form.productoEspecifico ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px',
                    borderRadius: 6, background: '#f5f3ff', border: '1px solid #ddd6fe',
                  }}>
                    <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>SKU</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{form.productoEspecifico.sku}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>Nombre</div>
                        <div style={{ fontSize: 13, color: C.text }}>{form.productoEspecifico.nombre}</div>
                      </div>
                      {form.productoEspecifico.ultimoCosto > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>Costo</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>${form.productoEspecifico.ultimoCosto.toLocaleString('es-CL')}</div>
                        </div>
                      )}
                      {form.productoEspecifico.precioSugerido > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>Precio sugerido</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>${form.productoEspecifico.precioSugerido.toLocaleString('es-CL')}</div>
                        </div>
                      )}
                    </div>
                    <button
                      onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, productoEspecifico: null, nuevoPrecio: '', descuentoPct: '' })); setSkuBusqueda(''); }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: 18, lineHeight: 1, padding: 0 }}
                    >×</button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 10 }}>
                    <div style={formStyles.field}>
                      <label style={formStyles.label}>Nuevo precio</label>
                      <input
                        style={{ ...formStyles.input, width: 130 }}
                        type="number" min="0"
                        value={form.nuevoPrecio}
                        placeholder="Ej: 4200"
                        onChange={e => {
                          const np = parseFloat(e.target.value);
                          const ps = form.productoEspecifico?.precioSugerido;
                          const pct = (ps && np > 0) ? Math.max(0, ((ps - np) / ps * 100)).toFixed(1) : '';
                          setForm(f => ({ ...f, nuevoPrecio: e.target.value, descuentoPct: pct }));
                        }}
                      />
                    </div>
                    <div style={formStyles.field}>
                      <label style={formStyles.label}>Descuento</label>
                      <div style={{
                        ...formStyles.input, width: 80,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#ede9fe', border: '1px solid #ddd6fe',
                        color: '#7c3aed', fontWeight: 700, fontSize: 14,
                      }}>
                        {form.descuentoPct ? `${form.descuentoPct}%` : '—'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    ref={skuInputRef}
                    style={{ ...formStyles.input, width: 260 }}
                    value={skuBusqueda}
                    placeholder="Buscar SKU o nombre..."
                    autoComplete="off"
                    onChange={e => { setSkuBusqueda(e.target.value); buscarProductosConPrecio(e.target.value); }}
                    onFocus={() => { if (skuOpts.length > 0) setMostrarSkus(true); }}
                    onBlur={() => setTimeout(() => setMostrarSkus(false), 150)}
                  />
                  {mostrarSkus && skuOpts.length > 0 && (
                    <div onMouseDown={e => e.preventDefault()} style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: 320,
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                      boxShadow: shadow.sm, maxHeight: 200, overflowY: 'auto',
                    }}>
                      {skuOpts.map(p => (
                        <div key={p.sku || p.id} onMouseDown={() => {
                          setForm(f => ({ ...f, productoEspecifico: p }));
                          setSkuBusqueda(''); setSkuOpts([]); setMostrarSkus(false);
                        }}
                          style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontWeight: 600 }}>{p.sku}</span>
                          <span style={{ color: C.textSec, marginLeft: 8 }}>{p.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
