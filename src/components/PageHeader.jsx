import { C } from '../theme';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
