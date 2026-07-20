import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { C, F, shadow } from '../theme';
import { clearToken, clearUser, apiFetch } from '../api';
import { useIsMobile } from '../hooks/useIsMobile';

const NAV_TODOS = [
  { to: '/dashboard',  label: 'Dashboard',       roles: ['admin','operador'] },
  { to: '/cambios',    label: 'Cambios',          roles: ['admin','operador'] },
  { to: '/historial',  label: 'Historial',        roles: ['admin','operador'] },
  { to: '/proveedores',label: 'Proveedores',      roles: ['admin'] },
  { to: '/reglas',     label: 'Precio de venta',  roles: ['admin', 'operador'] },
  { to: '/ofertas',    label: 'Ofertas',           roles: ['admin', 'operador'] },
  { to: '/usuarios',   label: 'Usuarios',         roles: ['admin'] },
  { to: '/mapeo',      label: 'Validación de productos', roles: ['admin'] },
];

const ICONS = {
  '/dashboard': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  '/cambios': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2v20M2 12h20" strokeLinecap="round"/>
      <path d="M7 7l5-5 5 5M7 17l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  '/historial': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  '/proveedores': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="1" y="16" width="22" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 16v-5a2 2 0 012-2h10a2 2 0 012 2v5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 9V7a3 3 0 016 0v2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  '/reglas': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4" strokeLinecap="round"/>
    </svg>
  ),
  '/ofertas': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M7 7h.01M3 3h7l11 11a2 2 0 010 2.83l-4.17 4.17a2 2 0 01-2.83 0L3 10V3z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  '/usuarios': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
    </svg>
  ),
  '/mapeo': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 3h7v7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 3L10 14" strokeLinecap="round"/>
    </svg>
  ),
};

function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d > 1 ? 's' : ''}`;
}

function Notificaciones({ isMobile }) {
  const [items, setItems] = useState([]);
  const [open, setOpen]   = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 300 });
  const wrapRef = useRef(null);
  const btnRef  = useRef(null);

  const noLeidas = items.filter(n => !n.leida).length;

  async function cargar() {
    try {
      const res = await apiFetch('/notificaciones');
      if (res.ok) setItems(await res.json());
    } catch {}
  }

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect  = btnRef.current.getBoundingClientRect();
      const dropW = isMobile ? window.innerWidth - 16 : 300;
      const dropH = 420;
      const left  = isMobile ? 8 : 232; // desktop: a la derecha del sidebar (224px + 8px gap)
      const top   = isMobile ? rect.bottom + 6 : rect.top;
      const clampedTop = top + dropH > window.innerHeight
        ? Math.max(8, window.innerHeight - dropH - 8)
        : top;
      setDropPos({ top: clampedTop, left, width: dropW });
    }
    setOpen(v => !v);
  }

  async function marcarUna(id) {
    try {
      await apiFetch(`/notificaciones/${id}/leer`, { method: 'PATCH' });
      setItems(prev => prev.filter(n => n.id !== id));
    } catch {}
  }

  async function marcarTodas() {
    try {
      await apiFetch('/notificaciones/leer-todas', { method: 'PATCH' });
      setItems([]);
      setOpen(false);
    } catch {}
  }

  return (
    <div ref={wrapRef} style={{ flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        title="Notificaciones"
        style={{
          cursor: 'pointer', border: 'none', borderRadius: 6,
          width: 34, height: 34, padding: 0,
          background: open ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: 'rgba(255,255,255,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0,
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            background: C.red, color: '#fff', fontSize: 9, fontWeight: 700,
            borderRadius: 9, minWidth: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
          }}>
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          left: dropPos.left, top: dropPos.top,
          width: dropPos.width,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, boxShadow: shadow.md,
          zIndex: 400, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              Notificaciones{noLeidas > 0 ? ` (${noLeidas})` : ''}
            </span>
            {items.length > 0 && (
              <button onClick={marcarTodas} style={{
                border: 'none', background: 'none', color: C.accent,
                fontSize: 11, cursor: 'pointer', fontFamily: F.sans, padding: 0,
              }}>
                Marcar todas
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <p style={{ margin: 0, padding: '24px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
                Sin notificaciones pendientes
              </p>
            ) : (
              items.map(n => (
                <div key={n.id} onClick={() => marcarUna(n.id)} style={{
                  padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer', background: 'transparent', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.accentLight; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>{n.titulo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSec, lineHeight: 1.4 }}>{n.mensaje}</p>
                  <p style={{ margin: '5px 0 0', fontSize: 10, color: C.textMuted }}>{tiempoRelativo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ nav, user, rol, onLogout, isMobile, onClose }) {
  return (
    <aside style={{
      width: 224, background: C.sidebar,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, height: '100vh',
      zIndex: 300,
      transform: isMobile ? undefined : undefined,
      transition: 'transform 0.25s ease',
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{
          background: '#ffffff', borderRadius: 6, padding: '5px 8px',
          display: 'flex', alignItems: 'center', flexShrink: 0, overflow: 'hidden',
        }}>
          <img src="/logo.svg" height="50" alt="Chilena Mayorista" style={{ display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Notificaciones isMobile={isMobile} />
          {isMobile && (
            <button onClick={onClose} style={{
              cursor: 'pointer', border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.5)', padding: 4, display: 'flex', flexShrink: 0,
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {nav.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            onClick={isMobile ? onClose : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 6, marginBottom: 2,
              textDecoration: 'none', fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            })}
          >
            <span style={{ opacity: 0.85, flexShrink: 0 }}>{ICONS[n.to]}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {user?.nombre && (
          <div style={{ padding: '6px 12px', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {user.nombre}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {rol}
            </p>
          </div>
        )}
        <button onClick={onLogout} style={{
          width: '100%', cursor: 'pointer', border: 'none',
          padding: '8px 12px', borderRadius: 6, background: 'transparent',
          color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: F.sans,
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default function Layout({ onLogout, user }) {
  const rol      = user?.rol || 'operador';
  const nav      = NAV_TODOS.filter(n => n.roles.includes(rol));
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = (isMobile && drawerOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, drawerOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: F.sans }}>

      {/* Top navbar — solo mobile */}
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 56,
          background: C.sidebar, display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12, zIndex: 200,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              cursor: 'pointer', border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex', flexShrink: 0,
            }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{
              background: '#ffffff', borderRadius: 5, padding: '4px 7px',
              display: 'flex', alignItems: 'center', overflow: 'hidden',
            }}>
              <img src="/logo.svg" height="35" alt="Chilena Mayorista" style={{ display: 'block' }} />
            </div>
          </div>
          <Notificaciones isMobile={true} />
        </header>
      )}

      {/* Backdrop — mobile drawer */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 299,
          }}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || drawerOpen) && (
        <Sidebar
          nav={nav}
          user={user}
          rol={rol}
          onLogout={onLogout}
          isMobile={isMobile}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <main className="page-pad" style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 224,
        marginTop: isMobile ? 56 : 0,
        padding: isMobile ? '20px 16px' : '36px 40px',
        minWidth: 0,
      }}>
        <Outlet />
      </main>
    </div>
  );
}
