import { Outlet, NavLink } from 'react-router-dom';
import { C, F } from '../theme';

const nav = [
  { to: '/dashboard', label: 'Dashboard'   },
  { to: '/cambios',   label: 'Cambios'     },
  { to: '/reglas',    label: 'Markup'      },
  { to: '/historial', label: 'Historial'   },
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
  '/reglas': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4" strokeLinecap="round"/>
    </svg>
  ),
  '/historial': (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function Layout() {
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
          <p style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}>
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

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>
            Sistema 1 · v1.0.0
          </p>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 224, padding: '36px 40px', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
