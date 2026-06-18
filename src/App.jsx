import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './api';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cambios   from './pages/Cambios';
import Reglas    from './pages/Reglas';
import Historial from './pages/Historial';

export default function App() {
  const [autenticado, setAutenticado] = useState(!!getToken());

  if (!autenticado) {
    return <Login onLogin={() => setAutenticado(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={() => setAutenticado(false)} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cambios"   element={<Cambios />} />
          <Route path="reglas"    element={<Reglas />} />
          <Route path="historial" element={<Historial />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
