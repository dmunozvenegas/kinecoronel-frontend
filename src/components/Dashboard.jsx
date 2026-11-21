import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Activity, CalendarCheck, TrendingUp, Clock, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        // 1. Cargamos las métricas (Nota: Si el backend de reportes no existe aún, esto fallará silenciosamente y dejará los valores en 0)
        const resDashboard = await axios.get('/api/reportes/dashboard').catch(() => ({ data: {} }));
        setDatosGrafico(resDashboard.data.graficoSesiones || []);
        
        // Si no hay endpoint de reportes, intentamos sacar el total haciendo un GET a pacientes
        if (!resDashboard.data.totalPacientes) {
             const resPacientes = await axios.get('/api/pacientes');
             setTotalPacientes(resPacientes.data.length || 0);
        } else {
             setTotalPacientes(resDashboard.data.totalPacientes);
        }
      } catch (error) {
        console.error("Error cargando métricas:", error);
      }

      try {
        // 2. Cargamos la agenda usando la misma ruta directa que en Agenda.jsx
        const resAgenda = await axios.get('/api/agenda');
        
        // Obtenemos el inicio del día (00:00:00) para no ocultar las citas que ya pasaron hoy
        const inicioDeHoy = startOfDay(new Date());
        
        const citasFuturas = resAgenda.data
          .map(cita => ({ ...cita, fechaObj: new Date(cita.fecha_hora) }))
          .filter(cita => cita.fechaObj >= inicioDeHoy) // Ahora usamos el inicio del día
          .sort((a, b) => a.fechaObj - b.fechaObj)
          .slice(0, 5); 

        setProximasCitas(citasFuturas);
      } catch (error) {
        console.error("Error cargando agenda para el dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  if (cargando) {
    return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Título de Bienvenida */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Resumen de la Consulta</h2>
        <p className="text-gray-500 text-sm mt-1">Aquí tienes el rendimiento clínico y tus próximas atenciones.</p>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Pacientes Totales</p>
            <h3 className="text-2xl font-black text-gray-800">{totalPacientes}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Órdenes Vigentes</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Sesiones este Mes</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Alta Clínica</p>
            <h3 className="text-2xl font-black text-gray-800">--</h3>
          </div>
        </div>

      </div>

      {/* ÁREA DE GRÁFICOS Y PRÓXIMAS CITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-gray-400" />
            Volumen de Sesiones (Últimos 6 Meses)
          </h3>
          
          {datosGrafico.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  />
                  <Bar dataKey="sesiones" name="Sesiones Realizadas" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <BarChart size={32} className="mb-2 opacity-50" />
              <p className="font-medium">Aún no hay suficientes datos para el gráfico.</p>
            </div>
          )}
        </div>

        {/* WIDGET: PRÓXIMAS CITAS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Próximas Citas
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              {proximasCitas.length}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            {proximasCitas.length > 0 ? (
                proximasCitas.map(cita => {
                    const esHoy = isToday(cita.fechaObj);
                    return (
                        <div key={cita.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                            {/* Bloque de Hora */}
                            <div className="bg-blue-50 group-hover:bg-blue-100 text-blue-700 rounded-xl p-2.5 text-center min-w-[70px] shrink-0 border border-blue-100 transition-colors">
                                <p className="text-sm font-black">{format(cita.fechaObj, 'HH:mm')}</p>
                                <p className="text-[10px] font-bold uppercase mt-0.5">
                                    {esHoy ? 'Hoy' : format(cita.fechaObj, 'dd MMM', { locale: es })}
                                </p>
                            </div>
                            
                            {/* Info del Paciente */}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">{cita.paciente_nombre}</p>
                                <p className="text-xs font-medium text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                    <Clock size={12} /> {cita.duracion_minutos} min • {cita.motivo || 'Sesión normal'}
                                </p>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <CalendarCheck size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Agenda Libre</p>
                    <p className="text-xs text-gray-500 mt-1">No tienes citas agendadas próximamente.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}