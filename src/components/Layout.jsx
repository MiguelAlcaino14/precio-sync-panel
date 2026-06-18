import { Outlet, NavLink } from 'react-router-dom';
import { C, F } from '../theme';
import { clearToken, clearUser } from '../api';

const NAV_TODOS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin','operador'] },
  { to: '/cambios',   label: 'Cambios',   roles: ['admin','operador'] },
  { to: '/historial', label: 'Historial', roles: ['admin','operador'] },
  { to: '/reglas',    label: 'Markup',    roles: ['admin'] },
  { to: '/usuarios',  label: 'Usuarios',  roles: ['admin'] },
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
  '/reglas': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4" strokeLinecap="round"/>
    </svg>
  ),
  '/usuarios': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Layout({ onLogout, user }) {
  const rol = user?.rol || 'operador';
  const nav = NAV_TODOS.filter(n => n.roles.includes(rol));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: F.sans }}>
      <aside style={{
        width: 224,
        background: C.sidebar,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Precio Sync
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.01em' }}>
            chilenamayorista.cl
          </p>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 13,
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
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              cursor: 'pointer',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              fontFamily: F.sans,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 224, padding: '36px 40px', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
