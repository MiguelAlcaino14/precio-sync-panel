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

const FORM_VACIO = {
  nombre: '',
  slug: '',
  tema: '',
  descuento: '0',
  driveFolderId: '',
  config: '{}',
  activo: true,
};

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
    setForm({
      nombre:        p.nombre,
      slug:          p.slug,
      tema:          p.tema || '',
      descuento:     String(p.descuento ?? 0),
      driveFolderId: p.driveFolderId || '',
      config:        JSON.stringify(p.config ?? {}, null, 2),
      activo:        p.activo,
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
    let configObj;
    try {
      configObj = JSON.parse(form.config || '{}');
      if (typeof configObj !== 'object' || Array.isArray(configObj) || configObj === null) throw new Error();
    } catch {
      setError('Config debe ser un objeto JSON válido. Revisa la sintaxis.');
      return;
    }

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

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Gestiona los proveedores de precios y su configuración de importación."
        action={!mostrarForm && (
          <button onClick={abrirCrear} style={btnPrimary}>+ Nuevo proveedor</button>
        )}
      />

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
                <label style={labelStyle}>Slug *</label>
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
              <label style={labelStyle}>Config (JSON)</label>
              <textarea style={{ ...inputStyle, fontFamily: F.mono, fontSize: 12, minHeight: 80, resize: 'vertical' }}
                value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} spellCheck={false} />
            </div>
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
              <th style={thStyle}>Slug</th>
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
