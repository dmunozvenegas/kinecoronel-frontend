import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 
import { Edit2, Plus, X, FileText, Paperclip, Printer } from 'lucide-react';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. CORRECCIÓN: Usamos rutas relativas limpias para aprovechar el HTTPS global
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
    }, [id ,actualizarDatos]);

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
        setModalAbierto(true);
    };

    const handleGuardarSesion = async () => {
        if (!evolucionTexto || evolucionTexto.replace(/<[^>]*>/g, '').trim() === '') {
            return alert("Por favor, escribe el detalle de la evolución.");
        }
        setGuardandoSesion(true);
        try {
            // 2. CORRECCIÓN: Peticiones seguras relativas para guardar/editar
            if (sesionEditandoId) {
                await axios.put(`/api/ordenes/sesion/${sesionEditandoId}`, {
                    evolucion: evolucionTexto,
                    terapias: terapiasSeleccionadas
                });
            } else {
                await axios.post('/api/ordenes/sesion', {
                    orden_id: ordenActivaId,
                    evolucion: evolucionTexto,
                    terapias: terapiasSeleccionadas
                });
            }
            // === SECUENCIA REACTIVA LIMPIA (Sin recargar el navegador) ===
            setModalAbierto(false); // 1. Cerramos el modal suavemente
            setGuardandoSesion(false); // 2. Liberamos el botón
            setActualizarDatos(prev => prev + 1); // 3. Disparamos la consulta en segundo plano

        } catch (error) {
            console.error(error);
            alert("Error al guardar la sesión");
            setGuardandoSesion(false);
        }
    };

    const handleDescargarPDF = () => {
        window.print();
    };

    if (cargando) return <h2 className="text-xl text-center mt-10 text-gray-600 font-semibold">Cargando ficha...</h2>;
    if (!paciente) return <h2 className="text-xl text-center mt-10 text-red-600">Paciente no encontrado.</h2>;

    return (
        <div className="max-w-5xl mx-auto mt-8 space-y-6 px-4 print:mt-0 print:space-y-4">
            
            {/* Barra superior de acciones */}
            <div className="flex justify-between items-center print:hidden">
                {/* Ajustado a la ruta plural oficial */}
                <Link to="/pacientes" className="text-blue-600 hover:underline font-medium">&larr; Volver al Listado</Link>
                
                <button 
                    onClick={handleDescargarPDF}
                    className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                    <Printer size={16} /> Descargar / Imprimir PDF
                </button>
            </div>

            {/* MEMBRETE OFICIAL EN PDF */}
            <div className="hidden print:block border-b-2 border-blue-700 pb-4 mb-4 text-center">
                <h1 className="text-2xl font-black text-blue-800 uppercase tracking-widest">Centro Kinesiológico KineCoronel</h1>
                <p className="text-xs text-gray-500 mt-1">
                    Historial Clínico Oficial • Emitido el {new Date().toLocaleDateString('es-CL')}
                </p>
            </div>

            {/* Cabecera de Paciente */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-blue-600 print:shadow-none print:border-gray-300 print:p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 print:text-xl">{paciente.nombre}</h2>
                        <p className="text-blue-600 font-bold text-lg mt-1 print:text-sm">RUT: {paciente.rut}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-2 print:hidden">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase block">
                                {paciente.estado}
                            </span>
                            {/* 3. CORRECCIÓN: Ruta en plural alineada con App.jsx */}
                            <Link 
                                to={`/pacientes/editar/${paciente.id}`}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                            >
                                ✏️ Editar
                            </Link>
                        </div>
                        <span className="hidden print:inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1">
                            Estado: {paciente.estado}
                        </span>
                        <p className="text-2xl font-black text-gray-700 print:text-base">{calcularEdad(paciente.fecha_nacimiento)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600 print:mt-3 print:pt-2 print:text-xs">
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase print:text-[10px]">📅 Nacimiento</span>
                        <p className="mt-1 font-medium text-gray-800 print:mt-0">
                            {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'No registrada'}
                        </p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase print:text-[10px]">📞 Teléfono</span>
                        <p className="mt-1 font-medium text-gray-800 print:mt-0">{paciente.telefono || 'No registrado'}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase print:text-[10px]">✉️ Correo</span>
                        <p className="mt-1 font-medium text-gray-800 print:mt-0">{paciente.correo || 'No registrado'}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase print:text-[10px]">🏠 Dirección</span>
                        <p className="mt-1 font-medium text-gray-800 print:mt-0">{paciente.direccion || 'No registrada'}</p>
                    </div>
                </div>
            </div>

            {/* Listado de Órdenes Médicas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center mb-6 border-b pb-4 print:mb-3 print:pb-2">
                    <h3 className="text-xl font-bold text-gray-800 italic print:text-base">Órdenes Médicas y Tratamientos</h3>
                    
                    {/* 4. CORRECCIÓN: Ruta de creación de orden alineada con App.jsx */}
                    <Link 
                        to={`/pacientes/${id}/nueva-orden`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm inline-flex items-center gap-1 print:hidden"
                    >
                        <Plus size={16} /> Nueva Orden
                    </Link>
                </div>

                {ordenes.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 print:border-none print:py-2">
                        <p className="text-gray-400 print:text-xs">Este paciente no tiene órdenes registradas.</p>
                    </div>
                ) : (
                    <div className="space-y-8 print:space-y-6">
                        {ordenes.map(orden => (
                            <div key={orden.id} className="border rounded-xl p-5 bg-white border-gray-200 shadow-sm print:border-b print:border-gray-300 print:rounded-none print:p-0 print:shadow-none">
                                <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 print:bg-transparent print:border-none print:p-0 print:mb-2">
                                    <div>
                                        {/* === INICIO CAMBIO: Contenedor flex con el botón Editar === */}
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-blue-800 text-lg uppercase print:text-sm">{orden.diagnostico}</h4>
                                            <Link 
                                                to={`/pacientes/${id}/editar-orden/${orden.id}`}
                                                className="text-gray-400 hover:text-yellow-600 p-1 rounded-md hover:bg-yellow-50 transition-colors print:hidden"
                                                title="Editar Orden Médica"
                                            >
                                                <Edit2 size={16} /> {/* Usamos el icono que ya tienes importado arriba */}
                                            </Link>
                                        </div>
                                        {/* === FIN CAMBIO === */} 
                                        <p className="text-sm text-gray-600 font-medium mt-1 print:text-xs">🩺 Médico: {orden.medico_derivante || 'No especificado'}</p>
                                        
                                        {/* 5. CORRECCIÓN: Enlaces a archivos fijos con protocolo HTTPS */}
                                        <div className="mt-3 flex flex-wrap gap-3 print:hidden">
                                            {orden.archivo_orden && (
                                                <a href={import.meta.env.DEV ? `http://localhost:3000${orden.archivo_orden}` : `https://'https://kinecoronel-backend.onrender.com'${orden.archivo_orden}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md hover:bg-green-100 font-semibold">
                                                    <FileText size={13} /> Ver Orden Médica
                                                </a>
                                            )}
                                            {orden.archivos_examenes && JSON.parse(orden.archivos_examenes).map((ruta, i) => (
                                                <a href={import.meta.env.DEV ? `http://localhost:3000${ruta}` : `https://'https://kinecoronel-backend.onrender.com'${ruta}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-100 font-semibold">
                                                    <Paperclip size={13} /> Examen #{i+1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider print:text-[9px]">Progreso</p>
                                        <p className="text-2xl font-black text-blue-600 print:text-sm">{orden.sesiones_realizadas} / {orden.sesiones_indicadas}</p>
                                    </div>
                                </div>

                                <div className="mb-6 print:hidden">
                                    <button 
                                        onClick={() => abrirModalNuevaSesion(orden.id)}
                                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={18} /> Registrar Nueva Sesión (Evolución)
                                    </button>
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-1 print:text-[10px] print:mb-1">
                                        📄 Historial de Evolución
                                    </h5>
                                    <SesionesList 
                                        ordenId={orden.id} 
                                        pacienteId={id}
                                        actualizarDatos={actualizarDatos}
                                        onEditar={(sesion) => abrirModalEditarSesion(sesion, orden.id)} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE EVOLUCIÓN */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{sesionEditandoId ? `Editar Sesión #${sesionEditandoId}` : 'Registrar Evolución de Sesión'}</h3>
                            <button onClick={() => setModalAbierto(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terapias Aplicadas hoy (Selección Múltiple):</label>
                                <div className="flex flex-wrap gap-2">
                                    {TERAPIAS_OPCIONES.map((opcion) => {
                                        const activo = terapiasSeleccionadas.includes(opcion);
                                        return (
                                            <button key={opcion} type="button" onClick={() => toggleTerapia(opcion)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activo ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                                                {activo ? '✓ ' : '+ '} {opcion}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Detalle de la Evolución Clínica:</label>
                                <div className="h-48 mb-12">
                                    <ReactQuill theme="snow" value={evolucionTexto} onChange={setEvolucionTexto} placeholder="Describe la respuesta del paciente, signos vitales, ejercicios realizados..." style={{ height: '100%' }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex justify-end gap-3 mt-auto">
                            <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm">Cancelar</button>
                            <button type="button" onClick={handleGuardarSesion} disabled={guardandoSesion} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50">
                                {guardandoSesion ? 'Guardando...' : 'Guardar Evolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Asegúrate de estar recibiendo pacienteId en los parámetros del componente
function SesionesList({ ordenId, pacienteId, actualizarDatos, onEditar }) {
    const [sesiones, setSesiones] = useState([]);

    useEffect(() => {
        // Petición al backend usando ruta relativa limpia
        axios.get(`/api/ordenes/sesiones/${ordenId}`)
            .then(res => setSesiones(res.data))
            .catch(err => console.error(err));
    }, [ordenId, actualizarDatos]);

    if (sesiones.length === 0) {
        return <p className="text-xs text-gray-400 italic print:text-[10px]">No hay registros de sesiones aún.</p>;
    }

    return (
        <div className="space-y-3 print:space-y-2">
            {sesiones.map(s => {
                let terapiasArray = [];
                if (s.terapias) {
                    try { terapiasArray = JSON.parse(s.terapias); } catch(e){}
                }

                return (
                    <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs hover:border-blue-200 transition-colors print:border-none print:border-l-2 print:border-blue-600 print:p-2 print:rounded-none print:shadow-none">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50 print:mb-1 print:pb-1">
                            
                            {/* Insignia de Sesión y Fecha */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded print:bg-transparent print:text-blue-800 print:px-0 print:text-[10px]">
                                    Sesión #{s.id}
                                </span>
                                <span className="text-xs text-gray-400 font-medium print:text-[10px]">
                                    {new Date(s.fecha).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* ========================================================= */}
                            {/* BOTONES DE ACCIÓN VISUALES (Ocultos al imprimir en PDF) */}
                            {/* ========================================================= */}
                            <div className="flex items-center gap-2 print:hidden">
                                
                                {/* 1. BOTÓN INFORME: Enruta exactamente a la vista de impresión dinámica */}
                                <Link 
                                    to={`/informe/paciente/${pacienteId}/orden/${ordenId}/sesion/${s.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                                    title="Visualizar documento imprimible de esta sesión"
                                >
                                    📄 <span className="hidden sm:inline">Informe</span>
                                </Link>

                                {/* 2. BOTÓN EDITAR: Dispara la apertura del modal con la data actual */}
                                <button 
                                    onClick={() => onEditar(s)} 
                                    className="text-gray-400 hover:text-yellow-600 p-1.5 rounded-md hover:bg-yellow-50 transition-colors border border-transparent hover:border-yellow-200" 
                                    title="Editar esta evolución"
                                >
                                    ✏️
                                </button>
                            </div>
                            {/* ========================================================= */}

                        </div>

                        {/* Etiquetas de Terapias Aplicadas */}
                        {terapiasArray.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5 print:mb-1">
                                {terapiasArray.map((t, idx) => (
                                    <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase print:border-none print:bg-transparent print:px-0 print:text-[9px] print:font-semibold">
                                        ⚡ {t} {idx < terapiasArray.length - 1 ? '•' : ''}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Texto de la Evolución */}
                        <div 
                            className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none print:text-xs print:leading-normal"
                            dangerouslySetInnerHTML={{ __html: s.evolucion }}
                        />
                    </div>
                );
            })}
        </div>
    );
}