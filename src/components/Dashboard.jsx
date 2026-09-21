import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Activity, CalendarCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        // Hacemos la petición a nuestra nueva ruta del backend
        const respuesta = await axios.get(`${import.meta.env.VITE_API_URL || ''}/reportes/dashboard`);
        setDatosGrafico(respuesta.data.graficoSesiones);
        setTotalPacientes(respuesta.data.totalPacientes);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  if (cargando) {
    return <div className="p-8 text-gray-500">Cargando métricas de KineCoronel...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Título de Bienvenida */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Resumen de la Consulta</h2>
        <p className="text-gray-500 text-sm mt-1">Aquí tienes el rendimiento clínico de los últimos meses.</p>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tarjeta 1: Conectada a la Base de Datos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pacientes Totales</p>
            <h3 className="text-2xl font-black text-gray-800">{totalPacientes}</h3>
          </div>
        </div>

        {/* Las demás tarjetas por ahora tendrán datos estáticos hasta que las conectemos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Órdenes Vigentes</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sesiones este Mes</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alta Clínica</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

      </div>

      {/* ÁREA DE GRÁFICOS Y PENDIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* Gráfico Conectado a la BD */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Volumen de Sesiones (Últimos 6 Meses)</h3>
          
          {datosGrafico.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="sesiones" name="Sesiones Realizadas" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-gray-400">
              No hay sesiones registradas en este periodo.
            </div>
          )}
        </div>

        {/* Lista de Alertas (Aún estática) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Atención Requerida</h3>
          <div className="flex-1 space-y-3">
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm font-bold text-red-800">Módulo en construcción</p>
              <p className="text-xs text-red-600 mt-0.5">Pronto conectaremos las alertas aquí.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}