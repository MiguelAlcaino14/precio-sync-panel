import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';
import { apiFetch } from '../api';
import PageHeader from '../components/PageHeader';

const POR_PAGINA = 6;

export default function Dashboard() {
  const [proveedores, setProveedores] = useState([]);
  const [uploading, setUploading]     = useState({});
  const [mensaje, setMensaje]         = useState({});
  const [loading, setLoading]         = useState(true);
  const [visibles, setVisibles]       = useState(POR_PAGINA);
  const [stats, setStats]             = useState({ pendientes: null, ultimaSync: null, loadingStats: true });

  useEffect(() => {
    apiFetch('/proveedores')
      .then(r => r.json())
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      apiFetch('/cambios?estado=pendiente').then(r => r.json()).catch(() => []),
      apiFetch('/exportar/historial').then(r => r.json()).catch(() => []),
    ]).then(([cambios, hist]) => {
      setStats({
        pendientes:  Array.isArray(cambios) ? cambios.length : 0,
        ultimaSync:  Array.isArray(hist) && hist.length > 0 ? hist[0].createdAt : null,
        loadingStats: false,
      });
    });
  }, []);

  async function handleUpload(proveedorId, file) {
    if (!file) return;
    setUploading(u => ({ ...u, [proveedorId]: true }));
    setMensaje(m => ({ ...m, [proveedorId]: null }));
    const formData = new FormData();
    formData.append('archivo', file);
    try {
      const res  = await apiFetch(`/proveedores/${proveedorId}/importar`, { method: 'POST', body: formData });
      const data = await res.json();
      setMensaje(m => ({ ...m, [proveedorId]: { text: data.mensaje || 'Importación en proceso', ok: true } }));
      setTimeout(() => {
        apiFetch('/proveedores').then(r => r.json()).then(d => setProveedores(Array.isArray(d) ? d : [])).catch(() => {});
      }, 3000);
    } catch {
      setMensaje(m => ({ ...m, [proveedorId]: { text: 'Error al subir archivo', ok: false } }));
    } finally {
      setUploading(u => ({ ...u, [proveedorId]: false }));
    }
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Selecciona un proveedor y sube su lista de precios para iniciar el proceso de sincronización."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatsCard label="Proveedores activos" value={loading ? null : proveedores.length} loading={loading} />
        <StatsCard label="Cambios pendientes"  value={stats.pendientes}                   loading={stats.loadingStats} />
        <StatsCard
          label="Última importación"
          value={stats.ultimaSync ? new Date(stats.ultimaSync).toLocaleDateString('es-CL') : '—'}
          loading={stats.loadingStats}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : proveedores.length === 0 ? (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '40px 24px', textAlign: 'center', boxShadow: shadow.sm,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: C.textSec }}>
            No hay proveedores activos. Crea uno en la sección Proveedores.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {proveedores.slice(0, visibles).map(p => (
              <ProveedorCard
                key={p.id}
                proveedor={p}
                uploading={uploading[p.id]}
                mensaje={mensaje[p.id]}
                onUpload={file => handleUpload(p.id, file)}
              />
            ))}
          </div>
          {visibles < proveedores.length && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => setVisibles(v => v + POR_PAGINA)}
                style={{
                  cursor: 'pointer',
                  border: `1px solid ${C.border}`,
                  padding: '8px 24px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  background: C.surface,
                  color: C.textSec,
                  fontFamily: F.sans,
                }}
              >
                Ver más ({proveedores.length - visibles} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatsCard({ label, value, loading }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', boxShadow: shadow.sm }}>
      {loading ? (
        <div style={{ width: 48, height: 24, background: C.border, borderRadius: 4, marginBottom: 6, animation: 'shimmer 1.4s ease-in-out infinite' }} />
      ) : (
        <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: C.text, fontFamily: F.mono, lineHeight: 1 }}>
          {value ?? '—'}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
    </div>
  );
}

function ProveedorCard({ proveedor: p, uploading, mensaje, onUpload }) {
  const tipo = p.config?.tipo === 'pdf' ? 'PDF' : 'Excel';

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '20px 22px',
      boxShadow: shadow.sm,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{p.nombre}</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textMuted }}>Formato: {tipo}</p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
          background: C.accentLight, color: C.accent,
        }}>
          Activo
        </span>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, fontFamily: F.mono }}>
            {p._count.productos}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted }}>Productos</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, fontFamily: F.mono }}>
            {p._count.archivos}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted }}>Importaciones</p>
        </div>
      </div>

      <label style={{ display: 'block' }}>
        <input
          type="file"
          style={{ display: 'none' }}
          accept=".xlsx,.xls,.csv,.pdf,.docx,.doc"
          disabled={uploading}
          onChange={e => onUpload(e.target.files[0])}
        />
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          cursor: uploading ? 'default' : 'pointer',
          padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6,
          border: 'none',
          background: uploading ? C.border : C.accent,
          color: uploading ? C.textMuted : '#ffffff',
          transition: 'background 0.15s',
        }}>
          {uploading ? <><SpinIcon /> Procesando...</> : <><UploadIcon /> Subir archivo</>}
        </span>
      </label>

      {mensaje && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: mensaje.ok ? C.green : C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
          {mensaje.ok ? <CheckIcon /> : '⚠'} {mensaje.text}
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', boxShadow: shadow.sm }}>
      <div style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ width: 140, height: 14, background: C.border, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 80, height: 11, background: C.border, borderRadius: 4 }} />
          </div>
          <div style={{ width: 44, height: 20, background: C.border, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 24, paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ width: 36, height: 22, background: C.border, borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 60, height: 10, background: C.border, borderRadius: 4 }} />
          </div>
          <div>
            <div style={{ width: 36, height: 22, background: C.border, borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 72, height: 10, background: C.border, borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ width: 110, height: 34, background: C.border, borderRadius: 6 }} />
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
         style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 11-9-9"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}
