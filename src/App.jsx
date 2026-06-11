import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout    from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cambios   from './pages/Cambios';
import Reglas    from './pages/Reglas';
import Historial from './pages/Historial';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cambios"   element={<Cambios />} />
          <Route path="reglas"    element={<Reglas />} />
          <Route path="historial" element={<Historial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
