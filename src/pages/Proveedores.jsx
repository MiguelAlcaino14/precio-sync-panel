import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';
import { apiFetch } from '../api';
import PageHeader from '../components/PageHeader';

const OPCIONES_PAGINA = [10, 25, 50, 100];

const TEMAS = ['libreria', 'alimentos', 'aseo'];

const TEMA_BADGE = {
  libreria:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Librería' },
  alimentos: { bg: '#d1fae5', color: '#059669', label: 'Alimentos' },
  aseo:      { bg: '#ffedd5', color: '#c2410c', label: 'Aseo' },
};

const CAMPOS_VACIO = {
  colSku: '', colNombre: '', colPrecio: '',
  colMarca: '', colBarras: '', hoja: '',
  colUnidadesCaja: '', colUnidadesPallet: '',
  precioIncluyeIVA: false, factorIVA: '1.19',
  patronCodigo: '', separadorMiles: '.',
};

const FORM_VACIO = {
  nombre: '',
  slug: '',
  tema: '',
  descuento: '0',
  driveFolderId: '',
  activo: true,
  configTipo: 'ia',
  configCampos: { ...CAMPOS_VACIO },
};

function inferirTipo(cfg) {
  if (!cfg || typeof cfg !== 'object') return 'ia';
  const t = cfg.tipo;
  if (['acco-brand', 'carlos-gardy', 'engatel', 'scai', 'demarka', 'cambiaso', 'winnex', 'rommel', 'chipro', 'libesa', 'pronobel'].includes(t)) return t;
  if (t === 'pdf') return 'pdf';
  if (t === 'ia')  return 'ia';
  if (cfg.colSku || t === 'xlsx') return 'xlsx';
  return 'ia';
}

function parseCampos(cfg) {
  return {
    colSku:            cfg.colSku            || '',
    colNombre:         cfg.colNombre         || '',
    colPrecio:         cfg.colPrecio         || '',
    colMarca:          cfg.colMarca          || '',
    colBarras:         cfg.colBarras         || '',
    hoja:              cfg.hoja != null      ? String(cfg.hoja) : '',
    colUnidadesCaja:   cfg.colUnidadesCaja   || '',
    colUnidadesPallet: cfg.colUnidadesPallet || '',
    precioIncluyeIVA:  cfg.precioIncluyeIVA  ?? false,
    factorIVA:         cfg.factorIVA != null  ? String(cfg.factorIVA) : '1.19',
    patronCodigo:      cfg.patronCodigo      || '',
    separadorMiles:    cfg.separadorMiles    || '.',
  };
}

function buildConfig(tipo, c) {
  if (tipo === 'ia') return { tipo: 'ia' };
  if (['acco-brand', 'carlos-gardy', 'engatel', 'scai', 'demarka', 'cambiaso', 'winnex', 'rommel', 'chipro', 'libesa', 'pronobel'].includes(tipo)) return { tipo };
  if (tipo === 'pdf') {
    const r = { tipo: 'pdf', precioIncluyeIVA: c.precioIncluyeIVA };
    if (c.patronCodigo)  r.patronCodigo  = c.patronCodigo;
    if (c.separadorMiles) r.separadorMiles = c.separadorMiles;
    if (!c.precioIncluyeIVA) r.factorIVA = parseFloat(c.factorIVA) || 1.19;
    return r;
  }
  const r = { colSku: c.colSku, colNombre: c.colNombre, colPrecio: c.colPrecio };
  if (c.colMarca)          r.colMarca          = c.colMarca;
  if (c.colBarras)         r.colBarras         = c.colBarras;
  if (c.hoja)              r.hoja              = isNaN(c.hoja) ? c.hoja : Number(c.hoja);
  if (c.colUnidadesCaja)   r.colUnidadesCaja   = c.colUnidadesCaja;
  if (c.colUnidadesPallet) r.colUnidadesPallet = c.colUnidadesPallet;
  r.precioIncluyeIVA = c.precioIncluyeIVA;
  if (!c.precioIncluyeIVA) r.factorIVA = parseFloat(c.factorIVA) || 1.19;
  return r;
}

const thStyle = {
  padding: '10px 14px', fontSize: 11, fontWeight: 600, color: C.textSec,
  textAlign: 'left', background: '#f8fafc', borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap', fontFamily: F.sans,
};

const tdStyle = {
  padding: '11px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`,
  color: C.text, verticalAlign: 'middle',
};

const inputStyle = {
  padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: 13, color: C.text, background: C.surface, fontFamily: F.sans,
  width: '100%', boxSizing: 'border-box',
};

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 600, color: C.textSec };

const btnPrimary = {
  cursor: 'pointer', border: 'none', padding: '8px 20px', fontSize: 13,
  fontWeight: 600, borderRadius: 6, background: C.accent, color: '#ffffff', fontFamily: F.sans,
};

const btnSecondary = {
  cursor: 'pointer', border: `1px solid ${C.border}`, padding: '7px 16px', fontSize: 13,
  fontWeight: 500, borderRadius: 6, background: 'transparent', color: C.textSec, fontFamily: F.sans,
};

function truncar(str, n = 30) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function Proveedores() {
  const [proveedores, setProveedores]   = useState([]);
  const [loadingTabla, setLoadingTabla] = useState(true);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [editId, setEditId]             = useState(null);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [error, setError]               = useState('');
  const [saving, setSaving]             = useState(false);
  const [pagina, setPagina]             = useState(1);
  const [porPagina, setPorPagina]       = useState(10);
  const [reseteando, setReseteando]     = useState(null); // id o 'todos'
  const [mensajeReset, setMensajeReset] = useState('');

  const totalPaginas   = Math.ceil(proveedores.length / porPagina) || 1;
  const paginaActual   = Math.min(pagina, totalPaginas);
  const inicio         = (paginaActual - 1) * porPagina;
  const proveedoresPag = proveedores.slice(inicio, inicio + porPagina);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoadingTabla(true);
    try {
      const res  = await apiFetch('/proveedores?todos=1');
      const data = await res.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoadingTabla(false); }
  }

  function abrirCrear() {
    setForm(FORM_VACIO);
    setEditId(null);
    setError('');
    setMostrarForm(true);
  }

  function abrirEditar(p) {
    const cfg = p.config ?? {};
    setForm({
      nombre:        p.nombre,
      slug:          p.slug,
      tema:          p.tema || '',
      descuento:     String(p.descuento ?? 0),
      driveFolderId: p.driveFolderId || '',
      activo:        p.activo,
      configTipo:    inferirTipo(cfg),
      configCampos:  parseCampos(cfg),
    });
    setEditId(p.id);
    setError('');
    setMostrarForm(true);
  }

  function cancelar() {
    setMostrarForm(false);
    setEditId(null);
    setError('');
  }

  async function guardar() {
    setError('');
    if (form.configTipo === 'xlsx') {
      const { colSku, colNombre, colPrecio } = form.configCampos;
      if (!colSku || !colNombre || !colPrecio) {
        setError('Para Excel: SKU, Nombre y Precio son obligatorios.');
        return;
      }
    }
    const configObj = buildConfig(form.configTipo, form.configCampos);

    const body = {
      nombre:        form.nombre.trim(),
      tema:          form.tema || null,
      descuento:     parseFloat(form.descuento) || 0,
      driveFolderId: form.driveFolderId.trim() || null,
      config:        configObj,
      activo:        form.activo,
    };
    if (!editId) body.slug = form.slug.trim();

    setSaving(true);
    try {
      const res = editId
        ? await apiFetch(`/proveedores/${editId}`, { method: 'PUT',  body: JSON.stringify(body) })
        : await apiFetch('/proveedores',            { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }

      if (editId) {
        setProveedores(ps => ps.map(p => p.id === editId ? { ...p, ...data } : p));
      } else {
        setProveedores(ps => {
          const nuevos = [...ps, data];
          setPagina(Math.ceil(nuevos.length / porPagina));
          return nuevos;
        });
      }
      cancelar();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(p) {
    try {
      const res  = await apiFetch(`/proveedores/${p.id}`, { method: 'PUT', body: JSON.stringify({ activo: !p.activo }) });
      const data = await res.json();
      if (res.ok) setProveedores(ps => ps.map(x => x.id === p.id ? { ...x, activo: data.activo } : x));
    } catch {}
  }

  async function resetearDrive(idOTodos) {
    const advertencia = idOTodos === 'todos'
      ? 'Esto reiniciará el procesamiento total de los archivos de TODOS los proveedores.\n\n¿Confirmas?'
      : 'Esto reiniciará el procesamiento total de los archivos de este proveedor.\n\n¿Confirmas?';
    if (!window.confirm(advertencia)) return;

    setReseteando(idOTodos);
    setMensajeReset('');
    try {
      const url = idOTodos === 'todos'
        ? '/proveedores/reset-drive-todos'
        : `/proveedores/${idOTodos}/reset-drive`;
      const res  = await apiFetch(url, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMensajeReset(`✓ ${data.reseteados} archivo(s) reiniciados. El próximo sync de Drive los reimportará.`);
      } else {
        setMensajeReset(`Error: ${data.error || 'No se pudo reiniciar'}`);
      }
    } catch {
      setMensajeReset('Error de conexión al reiniciar.');
    } finally {
      setReseteando(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Gestiona los proveedores de precios y su configuración de importación."
        action={!mostrarForm && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => resetearDrive('todos')}
              disabled={reseteando !== null}
              style={{ ...btnSecondary, fontSize: 12, padding: '6px 12px', color: C.red, borderColor: C.red }}
              title="Reinicia el seguimiento de Drive para que el próximo sync reimporte todos los archivos"
            >
              {reseteando === 'todos' ? 'Reiniciando…' : '↺ Reiniciar Drive (todos)'}
            </button>
            <button onClick={abrirCrear} style={btnPrimary}>+ Nuevo proveedor</button>
          </div>
        )}
      />
      {mensajeReset && (
        <div style={{
          margin: '0 0 14px', padding: '10px 14px', borderRadius: 6, fontSize: 13, fontFamily: F.sans,
          background: mensajeReset.startsWith('✓') ? C.greenBg : C.redBg,
          color:      mensajeReset.startsWith('✓') ? C.green   : C.red,
          border: `1px solid ${mensajeReset.startsWith('✓') ? C.green : C.red}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{mensajeReset}</span>
          <button onClick={() => setMensajeReset('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', lineHeight: 1 }}>×</button>
        </div>
      )}

      {mostrarForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 16, boxShadow: shadow.sm }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: C.text }}>
            {editId ? 'Editar proveedor' : 'Nuevo proveedor'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={form.nombre} placeholder="Ej: ACCO Brand" maxLength={100}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>

            {!editId && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Apodo *</label>
                <input style={{ ...inputStyle, fontFamily: F.mono }} value={form.slug} placeholder="Ej: acco-brand" maxLength={60}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              </div>
            )}

            <div style={fieldStyle}>
              <label style={labelStyle}>Tema</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.tema}
                onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}>
                <option value="">— Sin tema —</option>
                {TEMAS.map(t => (
                  <option key={t} value={t}>{TEMA_BADGE[t]?.label || t}</option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Descuento %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={form.descuento} placeholder="0"
                onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Drive Folder ID</label>
              <input style={inputStyle} value={form.driveFolderId} placeholder="(opcional)" maxLength={200}
                onChange={e => setForm(f => ({ ...f, driveFolderId: e.target.value }))} />
            </div>

            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tipo de importación *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.configTipo}
                onChange={e => setForm(f => ({ ...f, configTipo: e.target.value, configCampos: { ...CAMPOS_VACIO } }))}>
                <option value="ia">IA (automático — Excel y PDF)</option>
                <option value="xlsx">Excel (columnas manuales)</option>
                <option value="pdf">PDF (patrón manual)</option>
                <option value="demarka">Demarka (parser especial)</option>
                <option value="cambiaso">Cambiaso (parser especial)</option>
                <option value="winnex">Winnex (parser especial)</option>
                <option value="rommel">Rommel (parser especial)</option>
                <option value="chipro">Chipro (parser especial)</option>
                <option value="libesa">Libesa (parser especial)</option>
                <option value="pronobel">Pronobel (parser especial)</option>
                <option value="acco-brand">Parser especial: ACCO Brand</option>
                <option value="carlos-gardy">Parser especial: Carlos Gardy</option>
                <option value="engatel">Parser especial: ENGATEL</option>
                <option value="scai">Parser especial: SCAI</option>
              </select>
            </div>

            {form.configTipo === 'ia' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textSec, fontFamily: F.sans, background: '#f0fdf4', padding: '8px 12px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                  El parser IA detecta las columnas automáticamente. No requiere configuración adicional.
                </p>
              </div>
            )}

            {['acco-brand','carlos-gardy','engatel','scai','demarka','cambiaso','winnex','rommel','chipro'].includes(form.configTipo) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textSec, fontFamily: F.sans, background: '#eff6ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  Parser especial sin configuración adicional requerida.
                </p>
              </div>
            )}

            {form.configTipo === 'xlsx' && (<>
              {[
                { key: 'colSku',    label: 'Columna SKU *',    ph: 'Ej: CODIGO' },
                { key: 'colNombre', label: 'Columna nombre *', ph: 'Ej: DESCRIPCION' },
                { key: 'colPrecio', label: 'Columna precio *', ph: 'Ej: PRECIO NETO' },
                { key: 'colMarca',           label: 'Columna marca',              ph: '(opcional)' },
                { key: 'colBarras',          label: 'Columna código de barras',   ph: '(opcional)' },
                { key: 'colUnidadesCaja',    label: 'Columna unidades x caja',    ph: 'Ej: UPC ó CONTENIDO CAJA' },
                { key: 'colUnidadesPallet',  label: 'Columna unidades x pallet',  ph: 'Ej: CAJAS X PALLET' },
                { key: 'hoja',               label: 'Hoja (nombre o número)',      ph: 'Ej: Hoja1 ó 0' },
              ].map(({ key, label, ph }) => (
                <div key={key} style={fieldStyle}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={form.configCampos[key]} placeholder={ph}
                    onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, [key]: e.target.value } }))} />
                </div>
              ))}
              <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="checkbox" checked={form.configCampos.precioIncluyeIVA}
                    onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, precioIncluyeIVA: e.target.checked } }))} />
                  El precio en el Excel ya incluye IVA
                </label>
              </div>
              {!form.configCampos.precioIncluyeIVA && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Factor IVA</label>
                  <input style={inputStyle} type="number" step="0.01" value={form.configCampos.factorIVA} placeholder="1.19"
                    onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, factorIVA: e.target.value } }))} />
                </div>
              )}
            </>)}

            {form.configTipo === 'pdf' && (<>
              <div style={fieldStyle}>
                <label style={labelStyle}>Patrón código (regex)</label>
                <input style={{ ...inputStyle, fontFamily: F.mono }} value={form.configCampos.patronCodigo} placeholder="Ej: ^\d{6,7}"
                  onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, patronCodigo: e.target.value } }))} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Separador de miles</label>
                <input style={inputStyle} value={form.configCampos.separadorMiles} placeholder="."
                  onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, separadorMiles: e.target.value } }))} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="checkbox" checked={form.configCampos.precioIncluyeIVA}
                    onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, precioIncluyeIVA: e.target.checked } }))} />
                  El precio en el PDF ya incluye IVA
                </label>
              </div>
              {!form.configCampos.precioIncluyeIVA && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Factor IVA</label>
                  <input style={inputStyle} type="number" step="0.01" value={form.configCampos.factorIVA} placeholder="1.19"
                    onChange={e => setForm(f => ({ ...f, configCampos: { ...f.configCampos, factorIVA: e.target.value } }))} />
                </div>
              )}
            </>)}
          </div>

          {error && <p style={{ margin: '0 0 12px', fontSize: 12, color: C.red, fontWeight: 500 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={guardar} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={cancelar} style={btnSecondary}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="scroll-x" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Apodo</th>
              <th style={thStyle}>Tema</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Descuento %</th>
              <th style={thStyle}>Drive Folder</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {loadingTabla && (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{ height: 13, background: C.border, borderRadius: 4, animation: 'shimmer 1.4s ease-in-out infinite', width: j === 0 ? '70%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loadingTabla && proveedores.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textMuted, padding: 36 }}>
                  No hay proveedores. Crea uno para comenzar.
                </td>
              </tr>
            )}
            {!loadingTabla && proveedoresPag.map(p => {
              const temaBadge = TEMA_BADGE[p.tema];
              return (
                <tr key={p.id} style={{ background: p.activo ? C.surface : '#fafafa' }}>
                  <td style={{ ...tdStyle, fontWeight: 500, opacity: p.activo ? 1 : 0.6 }}>{p.nombre}</td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: C.textSec }}>{p.slug}</span>
                  </td>
                  <td style={tdStyle}>
                    {temaBadge ? (
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: temaBadge.bg, color: temaBadge.color, fontSize: 12, fontWeight: 600 }}>
                        {temaBadge.label}
                      </span>
                    ) : (
                      <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{ fontFamily: F.mono, fontSize: 13 }}>
                      {p.descuento ? `${p.descuento}%` : '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {p.driveFolderId ? (
                      <a
                        href={`https://drive.google.com/drive/folders/${p.driveFolderId}`}
                        target="_blank"
                        rel="noreferrer"
                        title={p.driveFolderId}
                        style={{ color: C.accent, fontFamily: F.mono, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {truncar(p.driveFolderId, 20)}
                        <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                      background: p.activo ? C.greenBg : C.redBg,
                      color:      p.activo ? C.green   : C.red,
                    }}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => abrirEditar(p)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12, marginRight: 6 }}>
                      Editar
                    </button>
                    {p.driveFolderId && (
                      <button
                        onClick={() => resetearDrive(p.id)}
                        disabled={reseteando !== null}
                        title="Reinicia el procesamiento de Drive para este proveedor"
                        style={{ cursor: 'pointer', border: `1px solid ${C.red}`, padding: '4px 10px', fontSize: 12, fontWeight: 500, borderRadius: 5, background: 'transparent', color: C.red, fontFamily: F.sans, marginRight: 6 }}
                      >
                        {reseteando === p.id ? '…' : '↺'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleActivo(p)}
                      style={{ cursor: 'pointer', border: `1px solid ${C.border}`, padding: '4px 10px', fontSize: 12, fontWeight: 500, borderRadius: 5, background: 'transparent', color: p.activo ? C.red : C.green, fontFamily: F.sans }}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onChange={setPagina}
        porPagina={porPagina}
        onCambiarPorPagina={n => { setPorPagina(n); setPagina(1); }}
      />
    </div>
  );
}

function Paginacion({ paginaActual, totalPaginas, onChange, porPagina, onCambiarPorPagina }) {
  const pagesArr = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 2)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);
  const navBtn = (disabled) => ({
    ...btnSecondary, padding: '6px 11px',
    opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer',
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
                ...navBtn(false), padding: '6px 11px',
                fontWeight: n === paginaActual ? 700 : 500,
                background: n === paginaActual ? C.accent : C.surface,
                color:      n === paginaActual ? '#fff'   : C.text,
                border:     n === paginaActual ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
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

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
    </svg>
  );
}
