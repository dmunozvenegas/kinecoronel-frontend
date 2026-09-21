import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 
import { 
    Edit2, Plus, X, FileText, Paperclip, Printer, 
    User, Phone, Mail, MapPin, Calendar, Activity, ArrowLeft, Clock, CheckCircle2 
} from 'lucide-react';

const TERAPIAS_OPCIONES = ["Crioterapia", "Masoterapia", "TENS", "US", "Hidroterapia"];

export default function PacienteDetalle() {
    const { id } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [ordenes, setOrdenes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizarDatos, setActualizarDatos] = useState(0);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [ordenActivaId, setOrdenActivaId] = useState(null);
    const [sesionEditandoId, setSesionEditandoId] = useState(null);
    const [evolucionTexto, setEvolucionTexto] = useState('');
    const [terapiasSeleccionadas, setTerapiasSeleccionadas] = useState([]);
    const [guardandoSesion, setGuardandoSesion] = useState(false); 
    const [fechaSesion, setFechaSesion] = useState('');

    const formatearFechaLocal = (fecha) => {
        const d = fecha ? new Date(fecha) : new Date();
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resPaciente = await axios.get(`/api/pacientes/${id}`);
                const resOrdenes = await axios.get(`/api/ordenes/paciente/${id}`);
                setPaciente(resPaciente.data);
                setOrdenes(resOrdenes.data);
            } catch (error) {
                console.error("Error cargando los datos:", error);
            } finally {
                setCargando(false);
            }
        };
        fetchData();
    }, [id, actualizarDatos]);

    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return 'N/A';
        const hoy = new Date();
        const fechaNac = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - fechaNac.getUTCFullYear();
        const mes = hoy.getMonth() - fechaNac.getUTCMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getUTCDate())) {
            edad--;
        }
        return `${edad} años`;
    };

    const getIniciales = (nombre) => {
        if (!nombre) return 'KC';
        const partes = nombre.split(' ');
        return partes.length >= 2 
            ? `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase() 
            : nombre.substring(0, 2).toUpperCase();
    };

    const toggleTerapia = (terapia) => {
        if (terapiasSeleccionadas.includes(terapia)) {
            setTerapiasSeleccionadas(terapiasSeleccionadas.filter(t => t !== terapia));
        } else {
            setTerapiasSeleccionadas([...terapiasSeleccionadas, terapia]);
        }
    };

    const abrirModalNuevaSesion = (ordenId) => {
        setOrdenActivaId(ordenId);
        setSesionEditandoId(null);
        setEvolucionTexto('');
        setTerapiasSeleccionadas([]);
        setFechaSesion(formatearFechaLocal());
        setModalAbierto(true);
    };

    const abrirModalEditarSesion = (sesion, ordenId) => {
        setOrdenActivaId(ordenId);
        setSesionEditandoId(sesion.id);
        setEvolucionTexto(sesion.evolucion);
        if (sesion.terapias) {
            try { setTerapiasSeleccionadas(JSON.parse(sesion.terapias)); } 
            catch (e) { setTerapiasSeleccionadas([]); }
        } else {
            setTerapiasSeleccionadas([]);
        }
        setFechaSesion(formatearFechaLocal(sesion.fecha));
        setModalAbierto(true);
    };

    const handleGuardarSesion = async () => {
        if (!evolucionTexto || evolucionTexto.replace(/<[^>]*>/g, '').trim() === '') {
            return alert("Por favor, escribe el detalle de la evolución.");
        }
        setGuardandoSesion(true);
        try {
            if (sesionEditandoId) {
                await axios.put(`/api/ordenes/sesion/${sesionEditandoId}`, {
                    evolucion: evolucionTexto, terapias: terapiasSeleccionadas, fecha: fechaSesion
                });
            } else {
                await axios.post('/api/ordenes/sesion', {
                    orden_id: ordenActivaId, evolucion: evolucionTexto, terapias: terapiasSeleccionadas, fecha: fechaSesion
                });
            }
            setModalAbierto(false);
            setGuardandoSesion(false);
            setActualizarDatos(prev => prev + 1);
        } catch (error) {
            console.error(error);
            alert("Error al guardar la sesión");
            setGuardandoSesion(false);
        }
    };

    const handleDescargarPDF = () => window.print();

    if (cargando) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!paciente) return <h2 className="text-xl text-center mt-10 text-red-600">Paciente no encontrado.</h2>;

    return (
        /* Agregado print:pb-40 para que el contenido no quede tapado por el pie de página legal */
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:space-y-4 print:max-w-full print:pb-40 relative">
            
            {/* ========================================================= */}
            {/* NUEVO MEMBRETE OFICIAL ELEGANTE (Solo visible al imprimir)*/}
            {/* ========================================================= */}
            <div className="hidden print:flex justify-between items-center border-b-[3px] border-blue-900 pb-4 mb-6">
                <div className="flex items-center gap-5">
                    <img src="/logo/logo-original.jpg" alt="Logo KineCoronel" className="h-16 w-auto object-contain" />
                     
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Historial Clínico Oficial</p>
                    <p className="text-[11px] text-gray-600 font-medium">Folio de Emisión: #{Math.floor(Math.random() * 100000)}</p>
                    <p className="text-[11px] text-gray-600 font-medium">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
                </div>
            </div>
            {/* ========================================================= */}

            {/* BOTÓN VOLVER Y ACCIONES */}
            <div className="flex justify-between items-center mb-2 print:hidden">
                <div className="flex items-center gap-3">
                    <Link to="/pacientes" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Ficha Clínica</h1>
                        <p className="text-sm text-gray-500">Expediente #{paciente.id}</p>
                    </div>
                </div>
                <button onClick={handleDescargarPDF} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2">
                    <Printer size={16} /> <span className="hidden sm:inline">Imprimir Ficha Oficial</span>
                </button>
            </div>

            {/* CABECERA DEL PACIENTE (Diseño de Tarjeta) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden print:shadow-none print:border-gray-300 print:p-4 print:border-2 print:rounded-xl print:bg-gray-50">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 print:hidden"></div>
                
                <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold border-2 border-blue-200 shrink-0 print:hidden">
                    {getIniciales(paciente.nombre)}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 print:text-xl print:uppercase">{paciente.nombre}</h2>
                    <p className="text-gray-500 font-medium print:text-black">RUT: {paciente.rut} • {calcularEdad(paciente.fecha_nacimiento)}</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mt-2 uppercase print:border print:border-green-800 print:bg-transparent">
                        <Activity size={14} /> {paciente.estado}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto print:hidden mt-4 md:mt-0">
                    <Link to={`/pacientes/editar/${paciente.id}`} className="flex-1 md:flex-none text-center px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        <Edit2 size={16} /> Editar Perfil
                    </Link>
                    <Link to={`/pacientes/${id}/nueva-orden`} className="flex-1 md:flex-none text-center px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                        <Plus size={16} /> Nueva Orden
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
                
                {/* COLUMNA 1: DATOS PERSONALES */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 h-fit print:shadow-none print:border-none print:p-0 print:mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2 print:border-gray-300">
                        <User size={18} className="text-blue-500 print:text-gray-800" /> Información de Contacto
                    </h3>
                    
                    <div className="space-y-4 text-sm print:grid print:grid-cols-2 print:gap-4 print:space-y-0">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">📞 Teléfono</span>
                            <p className="font-medium text-gray-800 mt-0.5">{paciente.telefono || 'No registrado'}</p>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">✉️ Correo</span>
                            <p className="font-medium text-gray-800 mt-0.5">{paciente.correo || 'No registrado'}</p>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">🏠 Dirección</span>
                            <p className="font-medium text-gray-800 mt-0.5">{paciente.direccion || 'No registrada'}</p>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">📅 Nacimiento</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                                {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'No registrada'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* COLUMNAS 2 Y 3: ÓRDENES Y TRATAMIENTOS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {ordenes.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300 print:hidden">
                            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">Este paciente no tiene órdenes registradas.</p>
                            <Link to={`/pacientes/${id}/nueva-orden`} className="mt-4 inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                                <Plus size={16} /> Crear la primera orden
                            </Link>
                        </div>
                    ) : (
                        ordenes.map(orden => {
                            const porcentaje = orden.sesiones_indicadas > 0 ? (orden.sesiones_realizadas / orden.sesiones_indicadas) * 100 : 0;
                            
                            return (
                                <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-t print:border-b-0 print:border-x-0 print:border-gray-400 print:rounded-none print:pt-4 print:mb-6">
                                    
                                    {/* Cabecera de la Orden */}
                                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 print:p-0 print:bg-transparent print:border-none">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-gray-900 text-lg uppercase flex items-center gap-2">
                                                    <Activity size={20} className="text-blue-600 print:hidden" /> 
                                                    {orden.diagnostico}
                                                </h3>
                                                <p className="text-sm text-gray-600 font-medium mt-1">Dr. Derivante: {orden.medico_derivante || 'No especificado'}</p>
                                            </div>
                                            <div className="flex items-center gap-2 print:hidden">
                                                <Link to={`/pacientes/${id}/editar-orden/${orden.id}`} className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors" title="Editar Orden">
                                                    <Edit2 size={16} />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Barra de Progreso y Archivos */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                            <div className="w-full">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 print:text-black">
                                                    <span>Progreso</span>
                                                    <span className="text-blue-700 print:text-black">{orden.sesiones_realizadas} de {orden.sesiones_indicadas} Sesiones</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden print:hidden">
                                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 md:justify-end print:hidden">
                                                {orden.archivo_orden && (
                                                    <a href={`${import.meta.env.VITE_API_URL}${orden.archivo_orden}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-bold shadow-sm">
                                                        <FileText size={14} className="text-blue-600" /> Ver Orden Médica
                                                    </a>
                                                )}
                                                {orden.archivos_examenes && JSON.parse(orden.archivos_examenes).map((ruta, i) => (
                                                    <a key={i} href={`${import.meta.env.VITE_API_URL}${ruta}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-bold shadow-sm">
                                                        <Paperclip size={14} className="text-green-600" /> Examen #{i+1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón de Nueva Sesión */}
                                    <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/30 print:hidden">
                                        <button 
                                            onClick={() => abrirModalNuevaSesion(orden.id)}
                                            className="w-full bg-white hover:bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Registrar Evolución (Sesión #{orden.sesiones_realizadas + 1})
                                        </button>
                                    </div>

                                    {/* Historial de Evoluciones */}
                                    <div className="p-6 print:p-0 print:mt-4">
                                        <h4 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2 print:border-b print:border-gray-300 print:pb-2">
                                            <Clock size={16} className="text-gray-400 print:hidden" /> Historial Clínico de Evoluciones
                                        </h4>
                                        <SesionesList 
                                            ordenId={orden.id} 
                                            pacienteId={id}
                                            actualizarDatos={actualizarDatos}
                                            onEditar={(sesion) => abrirModalEditarSesion(sesion, orden.id)} 
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* NUEVO PIE DE PÁGINA LEGAL FIJO (Solo visible al imprimir) */}
            {/* ========================================================= */}
            <div className="hidden print:flex fixed bottom-0 left-0 w-full pt-4 pb-4 border-t border-gray-400 flex-col items-center justify-center bg-white z-50">
                <div className="w-64 border-t-2 border-gray-800 mt-6 mb-2"></div>
                <p className="text-[12px] font-bold text-gray-800 uppercase">Firma y Timbre Profesional Tratante</p>
                <p className="text-[9px] text-gray-500 text-center mt-3 max-w-4xl px-8 leading-tight">
                    <strong>CONFIDENCIALIDAD MÉDICA:</strong> Este documento está amparado por la Ley N° 20.584 (Derechos y Deberes del Paciente). 
                    Contiene información clínica privilegiada y confidencial, de uso exclusivo para el equipo de salud tratante y el paciente. 
                    Queda estrictamente prohibida su reproducción, divulgación o alteración no autorizada. Documento generado a través de Plataforma KineCoronel.
                </p>
            </div>
            {/* ========================================================= */}

            {/* MODAL DE EVOLUCIÓN */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{sesionEditandoId ? `Editar Sesión #${sesionEditandoId}` : 'Registrar Evolución de Sesión'}</h3>
                            <button onClick={() => setModalAbierto(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50">
                            
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha y Hora de la Sesión</label>
                                <input 
                                    type="datetime-local" 
                                    value={fechaSesion}
                                    onChange={(e) => setFechaSesion(e.target.value)}
                                    className="w-full md:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Terapias Aplicadas Hoy</label>
                                <div className="flex flex-wrap gap-2">
                                    {TERAPIAS_OPCIONES.map((opcion) => {
                                        const activo = terapiasSeleccionadas.includes(opcion);
                                        return (
                                            <button key={opcion} type="button" onClick={() => toggleTerapia(opcion)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all shadow-sm ${activo ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                {activo ? '✓ ' : '+ '} {opcion}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Detalle de la Evolución Clínica</label>
                                <div className="h-64 mb-10">
                                    <ReactQuill theme="snow" value={evolucionTexto} onChange={setEvolucionTexto} placeholder="Describe la respuesta del paciente, signos vitales, ejercicios realizados..." style={{ height: '100%' }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 border-t flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-bold text-sm transition-colors">Cancelar</button>
                            <button type="button" onClick={handleGuardarSesion} disabled={guardandoSesion} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center disabled:opacity-50 min-w-[150px]">
                                {guardandoSesion ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Guardar Evolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SesionesList({ ordenId, pacienteId, actualizarDatos, onEditar }) {
    const [sesiones, setSesiones] = useState([]);

    useEffect(() => {
        axios.get(`/api/ordenes/sesiones/${ordenId}`)
            .then(res => setSesiones(res.data))
            .catch(err => console.error(err));
    }, [ordenId, actualizarDatos]);

    if (sesiones.length === 0) {
        return (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-white print:hidden">
                <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No hay evoluciones registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 print:space-y-3">
            {sesiones.map((s, index) => {
                const numeroSesion = sesiones.length - index; 
                let terapiasArray = [];
                if (s.terapias) {
                    try { terapiasArray = JSON.parse(s.terapias); } catch(e){}
                }

                return (
                    <div key={s.id} className="relative pl-6 border-l-2 border-blue-200 print:border-gray-400 print:pl-4">
                        <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1.5 print:bg-gray-600 print:-left-[7px]"></div>
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 pb-3 border-b border-gray-50 gap-2 print:border-b-gray-200 print:mb-2 print:pb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded uppercase tracking-wider print:bg-transparent print:px-0">
                                        Sesión #{numeroSesion}
                                    </span>
                                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                        <Calendar size={14} className="print:hidden" />
                                        {new Date(s.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 print:hidden">
                                    <Link 
                                        to={`/informe/paciente/${pacienteId}/orden/${ordenId}/sesion/${s.id}`}
                                        className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <FileText size={14} /> Informe
                                    </Link>
                                    <button 
                                        onClick={() => onEditar(s)} 
                                        className="text-gray-400 hover:text-blue-600 p-1.5 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg transition-colors" 
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {terapiasArray.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 print:mb-2">
                                    {terapiasArray.map((t, idx) => (
                                        <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded border border-indigo-100 print:bg-transparent print:border-none print:px-0 print:py-0 print:text-[10px] print:text-black">
                                            ⚡ {t} {idx < terapiasArray.length - 1 ? <span className="hidden print:inline text-gray-400 px-1">•</span> : ''}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div 
                                className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none print:text-xs print:text-black"
                                dangerouslySetInnerHTML={{ __html: s.evolucion }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}