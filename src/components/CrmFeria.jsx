import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, MessageSquare, CheckCircle, UserPlus, Sparkles, Search } from 'lucide-react';

// Reemplaza const API_BASE = ... por esto al inicio de RuletaFeria.jsx y CrmFeria.jsx:
const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE = RAW_URL.replace(/\/api\/?$/, ''); // Quita /api si ya venía en el .env

export default function CrmFeria() {
  const [leads, setLeads] = useState([]);
  const [premios, setPremios] = useState([]);
  const [filtroDolencia, setFiltroDolencia] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargandoIA, setCargandoIA] = useState(null);
  const navigate = useNavigate();

  const cargarDatos = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/feria/leads`);
      setLeads(data.leads);
      setPremios(data.premios);
    } catch (err) {
      console.error('Error cargando CRM:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const leadsFiltrados = leads.filter(l => {
    const coincideDolencia = filtroDolencia === 'Todas' || l.dolencia === filtroDolencia;
    const coincideTexto =
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.codigo_cupon.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.telefono.includes(busqueda);
    return coincideDolencia && coincideTexto;
  });

  // Datos para gráfico de dolencias en Recharts
  const conteoDolencias = Object.entries(
    leads.reduce((acc, l) => {
      acc[l.dolencia] = (acc[l.dolencia] || 0) + 1;
      return acc;
    }, {})
  ).map(([nombre, total]) => ({ nombre, total }));

  const exportarExcel = () => {
    const hoja = XLSX.utils.json_to_sheet(
      leadsFiltrados.map(l => ({
        Fecha: new Date(l.creado_en).toLocaleString('es-CL'),
        Nombre: l.nombre,
        WhatsApp: l.telefono,
        Dolencia: l.dolencia,
        Prevision: l.prevision,
        Premio: l.premio_titulo,
        Cupon: l.codigo_cupon,
        Estado: l.estado_cupon
      }))
    );
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Leads_Feria_KineCoronel');
    XLSX.writeFile(libro, `Leads_KineCoronel_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    await axios.put(`${API_BASE}/api/feria/leads/${id}/estado`, { estado_cupon: nuevoEstado });
    cargarDatos();
  };

  const contactarConIA = async (lead) => {
    setCargandoIA(lead.id);
    try {
      const { data } = await axios.post(`${API_BASE}/api/feria/generar-mensaje`, lead);
      window.open(`https://wa.me/${lead.telefono}?text=${encodeURIComponent(data.mensaje)}`, '_blank');
    } finally {
      setCargandoIA(null);
    }
  };

  const pasarAPaciente = (lead) => {
    // Envía los datos pre-cargados en router state hacia tu formulario actual de pacientes
    navigate('/pacientes/nuevo', {
      state: {
        nombre: lead.nombre,
        telefono: `+${lead.telefono}`,
        correo: lead.correo || ''
      }
    });
  };

  const dolenciasUnicas = ['Todas', ...new Set(leads.map(l => l.dolencia))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mini-CRM Feria & Ruleta</h1>
          <p className="text-sm text-slate-500">Prospectos captados, control de stock de premios y campañas por WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/feria"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl border border-sky-200 text-sky-700 bg-sky-50 text-sm font-semibold hover:bg-sky-100"
          >
            Abrir Vista Ruleta (/feria)
          </a>
          <button
            onClick={exportarExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* KPIs + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-xs uppercase font-bold text-slate-400">Resumen Captación</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-sky-50 rounded-xl">
              <p className="text-2xl font-black text-sky-700">{leads.length}</p>
              <p className="text-xs text-slate-600">Leads Totales</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-black text-emerald-700">
                {leads.filter(l => l.estado_cupon !== 'emitido').length}
              </p>
              <p className="text-xs text-slate-600">Cupones Canjeados</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-500 mb-1.5">Stock restante en Ruleta:</p>
            <div className="space-y-1 max-h-28 overflow-y-auto text-xs">
              {premios.map(p => (
                <div key={p.id} className="flex justify-between text-slate-600">
                  <span className="truncate pr-2">{p.titulo}</span>
                  <span className="font-bold">{p.stock_disponible} disp.</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-400 mb-2">Motivos de Consulta más frecuentes en la Feria</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conteoDolencias}>
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filtros de Campaña */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {dolenciasUnicas.map(dol => (
            <button
              key={dol}
              onClick={() => setFiltroDolencia(dol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filtroDolencia === dol ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dol}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar nombre, cupón o fono..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Tabla de Prospectos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="p-3.5">Participante</th>
              <th className="p-3.5">Dolencia / Previsión</th>
              <th className="p-3.5">Cupón & Premio</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5 text-right">Acciones CRM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leadsFiltrados.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50/80">
                <td className="p-3.5">
                  <p className="font-bold text-slate-800">{lead.nombre}</p>
                  <p className="text-xs text-slate-500">+{lead.telefono}</p>
                </td>
                <td className="p-3.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold mr-1">
                    {lead.dolencia}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                    {lead.prevision}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="font-mono font-bold text-slate-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                    {lead.codigo_cupon}
                  </span>
                  <p className="text-xs text-slate-600 mt-1">{lead.premio_titulo}</p>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      lead.estado_cupon === 'canjeado'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {lead.estado_cupon}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => contactarConIA(lead)}
                    disabled={cargandoIA === lead.id}
                    title="Redactar WhatsApp personalizado con IA"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {cargandoIA === lead.id ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    WhatsApp IA
                  </button>

                  {lead.estado_cupon === 'emitido' && (
                    <button
                      onClick={() => cambiarEstado(lead.id, 'canjeado')}
                      title="Validar cupón en stand o recepción"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Canjear
                    </button>
                  )}

                  <button
                    onClick={() => pasarAPaciente(lead)}
                    title="Crear ficha formal de paciente"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> A Ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}