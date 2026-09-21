import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

// 1. IMPORTANTE: Importaciones de Pacientes
import PacientesList from './components/PacientesList';
import PacienteForm from './components/PacienteForm';
import PacienteDetalle from './components/PacienteDetalle';
import PacienteEdit from './components/PacienteEdit';

// 2. IMPORTANTE: Importaciones de Órdenes y Sesiones
import OrdenForm from './components/OrdenForm';
import InformeSesion from './components/InformeSesion';

// 3. Importaciones de Bonos
import ListaBonos from './components/ListaBonos';
import BonoScanner from './components/BonoScanner';

export default function App() {
  return (
    <Routes>
      {/* ========================================== */}
      {/* RUTAS SIN MENÚ LATERAL (Públicas e Impresión)*/}
      {/* ========================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/informe/paciente/:pacienteId/orden/:ordenId/sesion/:sesionId" element={<InformeSesion />} />

      {/* ========================================== */}
      {/* RUTAS CON MENÚ LATERAL (Sistema Principal)   */}
      {/* ========================================== */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        
        {/* Flujo de Pacientes */}
        <Route path="/pacientes" element={<PacientesList />} />
        <Route path="/pacientes/nuevo" element={<PacienteForm />} />
        <Route path="/pacientes/:id" element={<PacienteDetalle />} />
        <Route path="/pacientes/editar/:id" element={<PacienteEdit />} />

        {/* Flujo de Órdenes (AQUÍ ESTÁN LAS RUTAS DE OrdenForm) */} 
        <Route path="/pacientes/:id/nueva-orden" element={<OrdenForm />} />
        <Route path="/pacientes/:id/editar-orden/:ordenId" element={<OrdenForm />} /> 

        {/* Flujo de Bonos */}
        <Route path="/bonos" element={<ListaBonos />} />
        <Route path="/bonos/escanear" element={<BonoScanner />} />

        {/* Módulos en construcción */}
        <Route path="/agenda" element={<div className="p-4 text-gray-500">Módulo de Agenda en construcción</div>} />
        <Route path="/reportes" element={<div className="p-4 text-gray-500">Módulo de Reportes en construcción</div>} />
      </Route>
    </Routes>
  );
}