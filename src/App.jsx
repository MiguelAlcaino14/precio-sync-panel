import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getUser, clearToken, clearUser } from './api';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cambios   from './pages/Cambios';
import Reglas    from './pages/Reglas';
import Historial from './pages/Historial';
import Usuarios    from './pages/Usuarios';
import Proveedores from './pages/Proveedores';
import Ofertas    from './pages/Ofertas';

export default function App() {
  const [autenticado, setAutenticado] = useState(!!getToken());
  const [user, setUserState]          = useState(() => getUser());

  function handleLogin() {
    setAutenticado(true);
    setUserState(getUser());
  }

  function handleLogout() {
    clearToken();
    clearUser();
    setAutenticado(false);
    setUserState(null);
  }

  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  const esAdmin = user?.rol === 'admin';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cambios"   element={<Cambios />} />
          <Route path="historial" element={<Historial />} />
          {esAdmin && <Route path="proveedores" element={<Proveedores />} />}
          <Route path="reglas"   element={<Reglas />} />
          <Route path="ofertas"  element={<Ofertas />} />
          {esAdmin && <Route path="usuarios" element={<Usuarios />} />}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
