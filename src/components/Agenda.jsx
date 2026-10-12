import { useState, useEffect } from "react";
import axios from "axios";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { 
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
    Plus, Clock, User, Activity, X, Trash2 
} from "lucide-react";

// Configuración de idioma y fechas en Español
const locales = { "es": es };
const localizer = dateFnsLocalizer({
    format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales,
});

// ==========================================
// COMPONENTE VISUAL: TARJETA DE CITA (CLON DE LA IMAGEN)
// ==========================================
const CustomEvent = ({ event }) => (
    <div className="flex flex-col justify-start h-full px-2 py-1.5 overflow-hidden leading-tight">
        {/* Línea 1: Rango de horas (ej. 13:00 - 14:00) */}
        <div className="text-[10px] font-semibold text-blue-800 mb-0.5 tracking-wide">
            {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
        </div>
        
        {/* Línea 2: Icono + Hora inicio */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900 mb-0.5">
            <Clock size={11} className="text-blue-700" />
            <span>{format(event.start, 'HH:mm')}</span>
        </div>
        
        {/* Línea 3: Nombre del paciente */}
        <div className="font-semibold text-[11.5px] text-blue-900 truncate mt-0.5">
            {event.title.split(' - ')[0]}
        </div>
    </div>
);

export default function Agenda() {
    const [eventos, setEventos] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [vistaActual, setVistaActual] = useState(Views.WEEK);
    const [fechaActual, setFechaActual] = useState(new Date());

    // Estados para Modales
    const [modalNueva, setModalNueva] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        paciente_id: '',
        fecha_hora: '',
        duracion_minutos: 60, // Cambiado a 60 por defecto según la imagen
        motivo: ''
    });

    const cargarAgenda = async () => {
        try {
            const res = await axios.get('/api/agenda');
            const eventosMapeados = res.data.map(cita => ({
                id: cita.id,
                title: `${cita.paciente_nombre} - ${cita.motivo || 'Sesión'}`,
                start: new Date(cita.fecha_hora),
                end: new Date(new Date(cita.fecha_hora).getTime() + (cita.duracion_minutos * 60000)),
                resource: cita
            }));
            setEventos(eventosMapeados);
        } catch (error) {
            console.error("Error cargando agenda", error);
        }
    };

    const cargarPacientes = async () => {
        try {
            const res = await axios.get('/api/pacientes');
            setPacientes(res.data);
        } catch (error) {
            console.error("Error cargando pacientes", error);
        }
    };

    // Cargar datos al iniciar
    useEffect(() => {
        // La carga es async (axios + await); no hay setState síncrono.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarAgenda();
        cargarPacientes();
    }, []);

    // ==========================================
    // CONTROLADORES DE EVENTOS
    // ==========================================
    const handleSeleccionarEvento = (evento) => {
        setCitaSeleccionada(evento.resource);
        setModalDetalle(true);
    };

    const handleSeleccionarSlot = (slotInfo) => {
        setFormData({
            ...formData,
            fecha_hora: format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"),
            paciente_id: '',
            motivo: ''
        });
        setModalNueva(true);
    };

    const handleGuardarCita = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/agenda', formData);
            setModalNueva(false);
            cargarAgenda();
        } catch {
            alert("Error al guardar la cita.");
        }
    };

    const handleEliminarCita = async () => {
        if (!window.confirm("¿Seguro que deseas cancelar y eliminar esta cita?")) return;
        try {
            await axios.delete(`/api/agenda/${citaSeleccionada.id}`);
            setModalDetalle(false);
            cargarAgenda();
        } catch {
            alert("Error al eliminar la cita.");
        }
    };

    // Navegación
    const handleAnterior = () => {
        const nueva = new Date(fechaActual);
        if (vistaActual === Views.MONTH) nueva.setMonth(nueva.getMonth() - 1);
        if (vistaActual === Views.WEEK) nueva.setDate(nueva.getDate() - 7);
        if (vistaActual === Views.DAY) nueva.setDate(nueva.getDate() - 1);
        setFechaActual(nueva);
    };

    const handleSiguiente = () => {
        const nueva = new Date(fechaActual);
        if (vistaActual === Views.MONTH) nueva.setMonth(nueva.getMonth() + 1);
        if (vistaActual === Views.WEEK) nueva.setDate(nueva.getDate() + 7);
        if (vistaActual === Views.DAY) nueva.setDate(nueva.getDate() + 1);
        setFechaActual(nueva);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#FAFAFA] min-h-screen">
            
            {/* CABECERA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CalendarIcon size={24} /></div>
                        Agenda Clínica
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona las citas y horarios de tus pacientes</p>
                </div>
                
                <button 
                    onClick={() => {
                        setFormData({ ...formData, fecha_hora: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
                        setModalNueva(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} /> Nueva Cita
                </button>
            </div>

            {/* BOTONERA DE NAVEGACIÓN Y VISTAS */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-transparent gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setFechaActual(new Date())} className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                        Hoy
                    </button>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <button onClick={handleAnterior} className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-r border-gray-200 transition-colors"><ChevronLeft size={18} /></button>
                        <button onClick={handleSiguiente} className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><ChevronRight size={18} /></button>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 ml-2 capitalize">
                        {format(fechaActual, vistaActual === Views.DAY ? 'EEEE, d MMMM yyyy' : 'MMMM yyyy', { locale: es })}
                    </h2>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
                    {[ { id: Views.MONTH, label: 'Mes' }, { id: Views.WEEK, label: 'Semana' }, { id: Views.DAY, label: 'Día' } ].map(vista => (
                        <button 
                            key={vista.id} 
                            onClick={() => setVistaActual(vista.id)} 
                            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-all ${vistaActual === vista.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {vista.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENEDOR DEL CALENDARIO */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[75vh] overflow-hidden">
                <div className="flex-1 p-0 agenda-personalizada overflow-hidden">
                    <Calendar
                        localizer={localizer}
                        events={eventos}
                        date={fechaActual}
                        view={vistaActual}
                        onNavigate={setFechaActual}
                        onView={setVistaActual}
                        selectable={true}
                        onSelectSlot={handleSeleccionarSlot}
                        onSelectEvent={handleSeleccionarEvento}
                        toolbar={false}
                        culture="es"
                        messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", noEventsInRange: "No hay citas." }}
                        components={{ event: CustomEvent }}
                        eventPropGetter={() => ({
                            className: 'cita-estilo-moderno',
                            style: { 
                                backgroundColor: '#E0E7FF', // Fondo celeste pastel idéntico a la imagen
                                color: '#1E3A8A', 
                                borderLeft: '4px solid #2563EB', // Borde azul vibrante
                                borderTop: 'none', borderRight: 'none', borderBottom: 'none', 
                                borderRadius: '6px' 
                            }
                        })}
                        formats={{
                            dayFormat: (date, culture, localizer) => localizer.format(date, 'EEEE dd', culture),
                            timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'HH:mm', culture),
                        }}
                        min={new Date(2024, 1, 1, 9, 0)} // Empieza a las 9:00 AM
                        max={new Date(2024, 1, 1, 22, 0)} // Termina a las 10:00 PM
                    />
                </div>
            </div>

            {/* MODAL: NUEVA CITA */}
            {modalNueva && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={18}/> Agendar Cita</h3>
                            <button onClick={() => setModalNueva(false)} className="hover:text-gray-200"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleGuardarCita} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Paciente</label>
                                <select required className="w-full p-2.5 border border-gray-300 rounded-lg"
                                    value={formData.paciente_id} onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}>
                                    <option value="">Seleccione un paciente...</option>
                                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha y Hora</label>
                                    <input type="datetime-local" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                        value={formData.fecha_hora} onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Duración (min)</label>
                                    <input type="number" required min="15" step="15" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                        value={formData.duracion_minutos} onChange={(e) => setFormData({...formData, duracion_minutos: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Motivo / Tratamiento</label>
                                <input type="text" placeholder="Ej: Sesión 3 Manguito Rotador" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                    value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalNueva(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar Cita</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DETALLE DE CITA */}
            {modalDetalle && citaSeleccionada && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-black text-xl text-gray-800">Detalle de Cita</h3>
                                <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Paciente</p>
                                        <p className="font-bold text-gray-900">{citaSeleccionada.paciente_nombre}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Clock size={18}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Horario</p>
                                        <p className="font-medium text-gray-800">
                                            {format(new Date(citaSeleccionada.fecha_hora), "EEEE d MMMM, HH:mm", { locale: es })}
                                        </p>
                                        <p className="text-xs text-gray-500">Duración: {citaSeleccionada.duracion_minutos} min</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={18}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Motivo</p>
                                        <p className="font-medium text-gray-800">{citaSeleccionada.motivo || 'No especificado'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex gap-3">
                            <button onClick={handleEliminarCita} className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                                <Trash2 size={16}/> Cancelar Cita
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ESTILOS CSS INYECTADOS - MAGIA VISUAL PARA IGUALAR LA IMAGEN */}
            <style dangerouslySetInnerHTML={{__html: `
                /* Eliminar el molesto cuadro de "todo el día" bajo los días */
                .rbc-allday-cell { display: none !important; }
                
                /* Estilos base de la cuadrícula para igualar la imagen */
                .agenda-personalizada .rbc-time-view { border: none; background: white; }
                .agenda-personalizada .rbc-header { 
                    padding: 16px 0; 
                    font-weight: 700; 
                    color: #374151; 
                    border-bottom: 1px solid #E5E7EB; 
                    border-left: none;
                    text-transform: capitalize; 
                }
                
                /* Líneas divisorias de los días (verticales) */
                .agenda-personalizada .rbc-day-bg { border-left: 1px solid #F3F4F6; }
                .agenda-personalizada .rbc-time-header-content { border-left: 1px solid #F3F4F6; }
                
                /* Contenedor del scroll vertical */
                .agenda-personalizada .rbc-time-content {
                    border-top: none;
                    scrollbar-width: thin;
                    scrollbar-color: #CBD5E1 transparent;
                }
                .agenda-personalizada .rbc-time-gutter { background: #F9FAFB; }
                .agenda-personalizada .rbc-timeslot-group { border-bottom: 1px solid #F3F4F6; }
                .agenda-personalizada .rbc-time-content .rbc-day-slot .rbc-time-slot { border-top: 1px solid #F3F4F6; }

                /* Tarjetas de cita modernas */
                .cita-estilo-moderno { font-weight: 600; font-size: 12px; }

                /* Scrollbar fino del calendario */
                .agenda-personalizada .rbc-time-content::-webkit-scrollbar { width: 8px; }
                .agenda-personalizada .rbc-time-content::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 9999px; }
                .agenda-personalizada .rbc-time-content::-webkit-scrollbar-track { background: transparent; }

                /* Indicador de la hora actual */
                .agenda-personalizada .rbc-current-time-indicator { background-color: #2563EB; height: 2px; }

                /* Alinear el encabezado y quitar bordes sobrantes */
                .agenda-personalizada .rbc-time-header { border-bottom: 1px solid #E5E7EB; }
                .agenda-personalizada .rbc-time-view { border-radius: 12px; overflow: hidden; }
                
                /* Ocultar la etiqueta de tiempo por defecto de react-big-calendar */
                .agenda-personalizada .rbc-event-label { display: none !important; }

                /* Quitar el padding nativo para que nuestro diseño use todo el espacio */
                .agenda-personalizada .rbc-event-content { padding: 0 !important; height: 100%; }
            `}} />
        </div>
    );
}