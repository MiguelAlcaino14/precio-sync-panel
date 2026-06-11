import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';

export default function Dashboard() {
  const [proveedores, setProveedores] = useState([]);
  const [uploading, setUploading]     = useState({});
  const [mensaje, setMensaje]         = useState({});

  useEffect(() => {
    fetch('/api/proveedores').then(r => r.json()).then(setProveedores);
  }, []);

  async function handleUpload(proveedorId, file) {
    if (!file) return;
    setUploading(u => ({ ...u, [proveedorId]: true }));
    setMensaje(m => ({ ...m, [proveedorId]: '' }));
    const form = new FormData();
    form.append('archivo', file);
    try {
      const res  = await fetch(`/api/proveedores/${proveedorId}/importar`, { method: 'POST', body: form });
      const data = await res.json();
      setMensaje(m => ({ ...m, [proveedorId]: data.mensaje || 'Importación en proceso' }));
      setTimeout(() => fetch('/api/proveedores').then(r => r.json()).then(setProveedores), 3000);
    } catch {
      setMensaje(m => ({ ...m, [proveedorId]: 'Error al subir archivo' }));
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {proveedores.map(p => (
          <ProveedorCard
            key={p.id}
            proveedor={p}
            uploading={uploading[p.id]}
            mensaje={mensaje[p.id]}
            onUpload={file => handleUpload(p.id, file)}
          />
        ))}
      </div>
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
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 4,
          background: C.accentLight,
          color: C.accent,
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
          accept=".xlsx,.xls,.csv,.pdf"
          disabled={uploading}
          onChange={e => onUpload(e.target.files[0])}
        />
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: uploading ? 'default' : 'pointer',
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 6,
          border: 'none',
          background: uploading ? C.border : C.accent,
          color: uploading ? C.textMuted : '#ffffff',
          transition: 'background 0.15s',
        }}>
          {uploading ? (
            <>
              <SpinIcon /> Procesando...
            </>
          ) : (
            <>
              <UploadIcon /> Subir archivo
            </>
          )}
        </span>
      </label>

      {mensaje && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckIcon /> {mensaje}
        </p>
      )}
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{subtitle}</p>
      )}
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
