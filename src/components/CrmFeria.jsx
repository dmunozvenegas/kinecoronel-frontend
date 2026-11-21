import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Gift,
  Sparkles,
  Download,
  RefreshCw,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

const RAW_API = import.meta.env.VITE_API_URL || 'https://kinecoronel-backend.onrender.com';
const API_BASE = RAW_API.replace(/\/api\/?$/, '');

const PALETA_SUGERIDA = [
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6'  // Violet
];

const FORM_PREMIO_INICIAL = {
  orden: 1,
  titulo: '',
  etiqueta_ruleta: '',
  descripcion: '',
  color_hex: '#0284c7',
  stock_disponible: 15,
  probabilidad_peso: 20,
  activo: true
};

export default function CrmFeria() {
  const [tabActiva, setTabActiva] = useState('leads'); // 'leads' | 'premios'
  const [leads, setLeads] = useState([]);
  const [metricasDolencias, setMetricasDolencias] = useState([]);
  const [premiosAdmin, setPremiosAdmin] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [generandoIA, setGenerandoIA] = useState(null);

  // Estado del formulario Crear / Editar Premio
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormPremio, setMostrarFormPremio] = useState(false);
  const [guardandoPremio, setGuardandoPremio] = useState(false);
  const [formPremio, setFormPremio] = useState(FORM_PREMIO_INICIAL);
  const [aviso, setAviso] = useState('');

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [resCrm, resPremios] = await Promise.all([
        axios.get(`${API_BASE}/api/feria/leads`),
        axios.get(`${API_BASE}/api/feria/premios/admin`)
      ]);

      const listaLeads = resCrm.data.leads || [];
      setLeads(listaLeads);
      setPremiosAdmin(resPremios.data || []);

      // Calcular distribución de dolencias desde los leads reales
      const conteo = {};
      listaLeads.forEach((l) => {
        const d = l.dolencia || 'Sin especificar';
        conteo[d] = (conteo[d] || 0) + 1;
      });
      const ordenado = Object.entries(conteo)
        .map(([dolencia, total]) => ({ dolencia, total }))
        .sort((a, b) => b.total - a.total);
      setMetricasDolencias(ordenado);
    } catch (error) {
      console.error('Error cargando CRM Feria:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const mostrarNotificacion = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3200);
  };

  // --- GESTIÓN DE LEADS ---
  const cambiarEstadoLead = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API_BASE}/api/feria/leads/${id}/estado`, { estado: nuevoEstado });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado: nuevoEstado } : l)));
    } catch {
      alert('No se pudo actualizar el estado del lead.');
    }
  };

  const enviarWhatsAppIA = async (lead) => {
    setGenerandoIA(lead.id);
    try {
      const res = await axios.post(`${API_BASE}/api/feria/leads/${lead.id}/mensaje-ia`);
      const mensaje = res.data.mensaje;
      const fonoLimpio = (lead.telefono || '').replace(/\D/g, '');
      window.open(`https://wa.me/${fonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
      if (lead.estado === 'Nuevo') {
        cambiarEstadoLead(lead.id, 'Contactado');
      }
    } catch {
      const fonoLimpio = (lead.telefono || '').replace(/\D/g, '');
      const fallback = `¡Hola ${lead.nombre}! Te escribimos de KineCoronel por el premio que ganaste en la feria (${lead.premio_titulo || 'Beneficio Kinésico'} - Código ${lead.codigo_canje}). ¿Te gustaría agendar tu hora esta semana?`;
      window.open(`https://wa.me/${fonoLimpio}?text=${encodeURIComponent(fallback)}`, '_blank');
    } finally {
      setGenerandoIA(null);
    }
  };

  const exportarCSV = () => {
    if (leads.length === 0) return;
    const encabezados = ['Fecha', 'Nombre', 'Telefono', 'Dolencia', 'Prevision', 'Premio', 'Codigo', 'Estado'];
    const filas = leads.map((l) => [
      new Date(l.creado_en || l.fecha_registro || Date.now()).toLocaleString('es-CL'),
      `"${(l.nombre || '').replace(/"/g, '""')}"`,
      `"${l.telefono || ''}"`,
      `"${l.dolencia || ''}"`,
      `"${l.prevision || ''}"`,
      `"${l.premio_titulo || l.titulo || ''}"`,
      l.codigo_canje || '',
      l.estado || 'Nuevo'
    ]);
    const contenido = '\uFEFF' + [encabezados.join(';'), ...filas.map((f) => f.join(';'))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leads_Feria_KineCoronel_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // --- GESTIÓN DE PREMIOS (CRUD) ---
  const abrirNuevoPremio = () => {
    setEditandoId(null);
    const siguienteOrden = premiosAdmin.length + 1;
    const colorSugerido = PALETA_SUGERIDA[(siguienteOrden - 1) % PALETA_SUGERIDA.length];
    setFormPremio({
      ...FORM_PREMIO_INICIAL,
      orden: siguienteOrden,
      color_hex: colorSugerido
    });
    setMostrarFormPremio(true);
  };

  const abrirEditarPremio = (premio) => {
    setEditandoId(premio.id);
    setFormPremio({
      orden: premio.orden || 1,
      titulo: premio.titulo || '',
      etiqueta_ruleta: premio.etiqueta_ruleta || '',
      descripcion: premio.descripcion || '',
      color_hex: premio.color_hex || '#0284c7',
      stock_disponible: premio.stock_disponible ?? 0,
      probabilidad_peso: premio.probabilidad_peso ?? 10,
      activo: Boolean(premio.activo)
    });
    setMostrarFormPremio(true);
  };

  const guardarPremio = async (e) => {
    e.preventDefault();
    setGuardandoPremio(true);
    try {
      if (editandoId) {
        const res = await axios.put(`${API_BASE}/api/feria/premios/${editandoId}`, formPremio);
        setPremiosAdmin((prev) => prev.map((p) => (p.id === editandoId ? res.data : p)));
        mostrarNotificacion('✅ Premio actualizado en la ruleta');
      } else {
        const res = await axios.post(`${API_BASE}/api/feria/premios`, formPremio);
        setPremiosAdmin((prev) => [...prev, res.data].sort((a, b) => a.orden - b.orden));
        mostrarNotificacion('✅ Nuevo premio agregado a la ruleta');
      }
      setMostrarFormPremio(false);
      setEditandoId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error guardando el premio');
    } finally {
      setGuardandoPremio(false);
    }
  };

  const alternarActivoRapido = async (premio) => {
    try {
      const actualizado = { ...premio, activo: !premio.activo };
      const res = await axios.put(`${API_BASE}/api/feria/premios/${premio.id}`, actualizado);
      setPremiosAdmin((prev) => prev.map((p) => (p.id === premio.id ? res.data : p)));
      mostrarNotificacion(res.data.activo ? '🟢 Premio visible en la ruleta' : '⏸️ Premio ocultado de la ruleta');
    } catch {
      alert('No se pudo cambiar la visibilidad del premio');
    }
  };

  const eliminarPremio = async (premio) => {
    if (!window.confirm(`¿Eliminar el premio "${premio.titulo}"?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/feria/premios/${premio.id}`);
      if (res.data.modo === 'desactivado') {
        setPremiosAdmin((prev) => prev.map((p) => (p.id === premio.id ? res.data.premio : p)));
        mostrarNotificacion('ℹ️ Tiene ganadores previos: se desactivó para cuidar el historial');
      } else {
        setPremiosAdmin((prev) => prev.filter((p) => p.id !== premio.id));
        mostrarNotificacion('🗑️ Premio eliminado');
      }
    } catch {
      alert('No se pudo eliminar el premio');
    }
  };

  const pesoTotalActivo = premiosAdmin
    .filter((p) => p.activo && p.stock_disponible > 0)
    .reduce((acc, p) => acc + Number(p.probabilidad_peso || 0), 0);

  const leadsFiltrados =
    filtroEstado === 'Todos' ? leads : leads.filter((l) => (l.estado || 'Nuevo') === filtroEstado);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Gift className="w-7 h-7 text-sky-600" />
            CRM Feria & Control de Ruleta
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestiona concursantes en vivo, seguimiento por WhatsApp IA y configuración de premios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTabActiva('leads')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                tabActiva === 'leads' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setTabActiva('premios')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                tabActiva === 'premios' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Gift className="w-4 h-4" />
              Premios Ruleta ({premiosAdmin.filter((p) => p.activo).length})
            </button>
          </div>

          <button
            onClick={cargarTodo}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {aviso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {aviso}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 1: LEADS Y SEGUIMIENTO COMERCIAL                  */}
      {/* ========================================================= */}
      {tabActiva === 'leads' && (
        <>
          {/* KPIs Rápidos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Total Participantes</span>
              <p className="text-3xl font-black text-slate-800 mt-1">{leads.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-amber-500">Por Contactar</span>
              <p className="text-3xl font-black text-amber-600 mt-1">
                {leads.filter((l) => !l.estado || l.estado === 'Nuevo').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-sky-600">Agendados</span>
              <p className="text-3xl font-black text-sky-600 mt-1">
                {leads.filter((l) => l.estado === 'Agendado').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-emerald-600">Canjeados / Asistieron</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">
                {leads.filter((l) => l.estado === 'Canjeado').length}
              </p>
            </div>
          </div>

          {/* Gráfico de barras de Dolencias */}
          {metricasDolencias.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">
                Motivos de Consulta Más Frecuentes en la Feria
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metricasDolencias.map((m) => {
                  const pct = Math.round((m.total / Math.max(leads.length, 1)) * 100);
                  return (
                    <div key={m.dolencia} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{m.dolencia}</span>
                        <span>
                          {m.total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla de Concursantes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {['Todos', 'Nuevo', 'Contactado', 'Agendado', 'Canjeado'].map((est) => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstado(est)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filtroEstado === est
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>

              <button
                onClick={exportarCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
              >
                <Download className="w-4 h-4" />
                Exportar Excel (CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Paciente / Contacto</th>
                    <th className="px-4 py-3">Dolencia / Previsión</th>
                    <th className="px-4 py-3">Premio & Código</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Seguimiento IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsFiltrados.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{lead.nombre}</div>
                        <div className="text-xs text-slate-500">{lead.telefono}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{lead.dolencia}</div>
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                          {lead.prevision}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-sky-700">{lead.premio_titulo || lead.titulo}</div>
                        <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          {lead.codigo_canje}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.estado || 'Nuevo'}
                          onChange={(e) => cambiarEstadoLead(lead.id, e.target.value)}
                          className="text-xs font-bold rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700"
                        >
                          <option value="Nuevo">🟡 Nuevo</option>
                          <option value="Contactado">🔵 Contactado</option>
                          <option value="Agendado">🟣 Agendado</option>
                          <option value="Canjeado">🟢 Canjeado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => enviarWhatsAppIA(lead)}
                          disabled={generandoIA === lead.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-60"
                        >
                          {generandoIA === lead.id ? (
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                          WhatsApp IA
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leadsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400">
                        No hay registros en este filtro todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: ADMINISTRADOR DE PREMIOS DE LA RULETA          */}
      {/* ========================================================= */}
      {tabActiva === 'premios' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50 border border-sky-200 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-black text-sky-900">Configuración en Vivo de Casillas y Stock</h2>
              <p className="text-xs text-sky-700 mt-0.5">
                Cualquier cambio aquí actualiza inmediatamente la ruleta del código QR. Para mejor lectura en celulares, usa etiquetas cortas (ej: <strong>MASAJE EXPRESS</strong> o <strong>50% DCTO</strong>).
              </p>
            </div>
            <button
              onClick={abrirNuevoPremio}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Premio
            </button>
          </div>

          {/* Formulario Crear / Editar Premio */}
          {mostrarFormPremio && (
            <form
              onSubmit={guardarPremio}
              className="bg-white p-5 rounded-2xl border-2 border-sky-500 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800">
                  {editandoId ? 'Editar Premio de la Ruleta' : 'Crear Nuevo Premio para la Ruleta'}
                </h3>
                <button
                  type="button"
                  onClick={() => setMostrarFormPremio(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Título completo (aparece al ganar y en WhatsApp)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sesión de Masaje Descontracturante Express"
                    value={formPremio.titulo}
                    onChange={(e) => setFormPremio({ ...formPremio, titulo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Texto corto en Ruleta (máx 22 letras)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={22}
                    placeholder="Ej: MASAJE EXPRESS"
                    value={formPremio.etiqueta_ruleta}
                    onChange={(e) => setFormPremio({ ...formPremio, etiqueta_ruleta: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Orden en la rueda
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPremio.orden}
                    onChange={(e) => setFormPremio({ ...formPremio, orden: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Descripción / Condiciones del Voucher
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Válido agendando evaluación durante este mes en KineCoronel"
                    value={formPremio.descripcion}
                    onChange={(e) => setFormPremio({ ...formPremio, descripcion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPremio.stock_disponible}
                    onChange={(e) =>
                      setFormPremio({ ...formPremio, stock_disponible: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Peso de Probabilidad (1 a 100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formPremio.probabilidad_peso}
                    onChange={(e) =>
                      setFormPremio({ ...formPremio, probabilidad_peso: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Selector de Color + Vista Previa de Casilla */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase text-slate-500 mr-1">Color Casilla:</span>
                  {PALETA_SUGERIDA.map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setFormPremio({ ...formPremio, color_hex: hex })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        formPremio.color_hex === hex ? 'scale-110 border-slate-900 ring-2 ring-slate-300' : 'border-white'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formPremio.color_hex}
                    onChange={(e) => setFormPremio({ ...formPremio, color_hex: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                    title="Color personalizado"
                  />

                  <span
                    className="ml-2 px-3 py-1.5 rounded-xl text-white text-xs font-black tracking-wide shadow-sm"
                    style={{ backgroundColor: formPremio.color_hex }}
                  >
                    {(formPremio.etiqueta_ruleta || 'VISTA PREVIA').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPremio.activo}
                      onChange={(e) => setFormPremio({ ...formPremio, activo: e.target.checked })}
                      className="w-4 h-4 accent-sky-600"
                    />
                    Visible en la Ruleta
                  </label>

                  <button
                    type="submit"
                    disabled={guardandoPremio}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {guardandoPremio ? 'Guardando...' : 'Guardar Premio'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tabla de Premios Configurados */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Casilla en Ruleta</th>
                    <th className="px-4 py-3">Título y Descripción</th>
                    <th className="px-4 py-3">Stock Restante</th>
                    <th className="px-4 py-3">Probabilidad Real</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {premiosAdmin.map((p) => {
                    const sorteable = p.activo && p.stock_disponible > 0;
                    const probReal =
                      sorteable && pesoTotalActivo > 0
                        ? Math.round((Number(p.probabilidad_peso) / pesoTotalActivo) * 100)
                        : 0;

                    return (
                      <tr key={p.id} className={!p.activo ? 'bg-slate-50/70 opacity-65' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3 font-bold text-slate-500">{p.orden}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-3 py-1.5 rounded-lg text-white text-xs font-black tracking-wide shadow-sm"
                            style={{ backgroundColor: p.color_hex || '#0284c7' }}
                          >
                            {(p.etiqueta_ruleta || p.titulo).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{p.titulo}</div>
                          <div className="text-xs text-slate-500">{p.descripcion || 'Sin descripción adicional'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                              p.stock_disponible > 5
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.stock_disponible > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {p.stock_disponible} uds.
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{probReal}%</div>
                          <div className="text-[11px] text-slate-400">Peso: {p.probabilidad_peso}</div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => alternarActivoRapido(p)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              p.activo
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {p.activo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {p.activo ? 'Activo' : 'Oculto'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => abrirEditarPremio(p)}
                            className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition"
                            title="Editar premio"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarPremio(p)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                            title="Eliminar o desactivar premio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}