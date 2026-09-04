import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'

import Login from './components/Login'
import PacientesList from './components/PacientesList'
import PacienteDetalle from './components/PacienteDetalle'
import PacienteEdit from './components/PacienteEdit'
import OrdenForm from './components/OrdenForm'
import InformeSesion from './components/InformeSesion'
import PacienteForm from './components/PacienteForm' 
import BonoScanner from './components/BonoScanner';
import ListaBonos from './components/ListaBonos';

function App() {
  const { usuario, cargando, logout } = useContext(AuthContext)

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600 font-semibold">Cargando sistema KineCoronel...</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      
      {/* ================= TU BANNER ORIGINAL RESTAURADO ================= */}
      <header className="max-w-6xl mx-auto mb-8 bg-white px-6 py-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <Link to="/pacientes" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
                src="/logo/logo-original.jpg" 
                alt="Logo KineCoronel" 
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => e.target.style.display = 'none'} 
            />
          </Link>
          
          <span className="text-xs font-semibold text-gray-500 sm:border-l sm:pl-4 mt-2 sm:mt-0">
            Kinesióloga: {usuario.nombre}
          </span>
        </div>
        
        <nav className="flex flex-wrap items-center justify-center gap-3">
          
          {/* 🟢 NUEVO BOTÓN: Acceso rápido a Bonos */}
          <Link 
            to="/bonos" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm text-sm flex items-center gap-2"
          >
            📋 Ver Bonos Fonasa
          </Link>

          {/* 🔵 BOTÓN EXISTENTE: Nuevo Paciente */}
          <Link 
            to="/nuevo-paciente" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm text-sm"
          >
            + Nuevo Paciente
          </Link>

          {/* 🔴 BOTÓN EXISTENTE: Cerrar Sesión */}
          <button 
            onClick={logout}
            className="text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors ml-2"
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>
      {/* ================================================================= */}
      
      <main className="max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/pacientes" />} />
          
          <Route path="/pacientes" element={<PacientesList />} />
          <Route path="/nuevo-paciente" element={<PacienteForm />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/pacientes/editar/:id" element={<PacienteEdit />} />
          <Route path="/pacientes/:id/nueva-orden" element={<OrdenForm />} />
          <Route path="/pacientes/:id/editar-orden/:ordenId" element={<OrdenForm />} />
          <Route path="/informes/nuevo" element={<InformeSesion />} />         
          <Route path="/informe/paciente/:pacienteId/orden/:ordenId/sesion/:sesionId" element={<InformeSesion />} />
          
          {/* Rutas de Inteligencia Artificial y Bonos */}
          <Route path="/escanear-bono" element={<BonoScanner />} />
          <Route path="/bonos" element={<ListaBonos />} />

          <Route path="*" element={<Navigate to="/pacientes" />} />
        </Routes>
      </main>

    </div>
  )
}

export default App