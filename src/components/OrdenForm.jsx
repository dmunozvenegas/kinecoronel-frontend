import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ClipboardList, Stethoscope, Hash, Calendar, FileText, Paperclip, ArrowLeft, Save, User } from 'lucide-react';
export default function OrdenForm() {
    // Recibimos "id" (del paciente) y opcionalmente "ordenId" (si venimos de presionar el lápiz)
    const { id, ordenId } = useParams(); 
    const navigate = useNavigate();

    const [diagnostico, setDiagnostico] = useState('');
    const [medico, setMedico] = useState('');
    const [sesiones, setSesiones] = useState(10);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    
    // Estados para los archivos
    const [archivoOrden, setArchivoOrden] = useState(null);
    const [archivosExamenes, setArchivosExamenes] = useState([]);
    const [cargando, setCargando] = useState(false);
    
    // Para mostrar el nombre del paciente en la cabecera (Opcional, pero da buen UX)
    const [nombrePaciente, setNombrePaciente] = useState('');

    // ================================================================
    // 1. CARGA DE DATOS PREVIOS
    // ================================================================
    useEffect(() => {
        const cargarDatosPrevios = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Cargar nombre del paciente (para la interfaz)
                if (id) {
                    const resPac = await axios.get(`/api/pacientes/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setNombrePaciente(resPac.data.nombre);
                }

                // Cargar datos de la orden si es Edición
                if (ordenId && id) {
                    const res = await axios.get(`/api/ordenes/paciente/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const orden = res.data.find(o => o.id === parseInt(ordenId));
                    
                    if (orden) {
                        setDiagnostico(orden.diagnostico || '');
                        setMedico(orden.medico_derivante || '');
                        setSesiones(orden.sesiones_indicadas || 10);
                        if (orden.fecha_emision) {
                            setFecha(orden.fecha_emision.split('T')[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error al precargar los datos:", error);
            }
        };
        cargarDatosPrevios();
    }, [ordenId, id]);

    // ================================================================
    // 2. ENVÍO DE DATOS
    // ================================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!id) {
            alert("Error: No se detecta el ID del paciente.");
            return;
        }

        setCargando(true);

        const formData = new FormData();
        formData.append('paciente_id', id);
        formData.append('diagnostico', diagnostico);
        formData.append('medico_derivante', medico);
        formData.append('sesiones_indicadas', sesiones);
        formData.append('fecha_emision', fecha);

        if (archivoOrden) {
            formData.append('archivo_orden', archivoOrden);
        }

        if (archivosExamenes && archivosExamenes.length > 0) {
            for (let i = 0; i < archivosExamenes.length; i++) {
                formData.append('archivos_examenes', archivosExamenes[i]);
            }
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            };

            if (ordenId) {
                await axios.put(`/api/ordenes/${ordenId}`, formData, config);
            } else {
                await axios.post('/api/ordenes', formData, config);
            }
            
            navigate(`/pacientes/${id}`); 
        } catch (error) {
            console.error("Error al guardar la orden:", error);
            alert("Hubo un error al procesar la solicitud. Revisa la consola.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            
            {/* CABECERA */}
            <div className="flex items-center gap-4 mb-2">
                <Link to={`/pacientes/${id}`} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" /> 
                        {ordenId ? 'Editar Orden Médica' : 'Registrar Nueva Orden Médica'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {nombrePaciente ? `Paciente: ${nombrePaciente}` : `Expediente #${id}`}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* TARJETA 1: INFORMACIÓN CLÍNICA */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Stethoscope size={18} className="text-blue-600" />
                        <h3 className="font-bold text-gray-800">Detalles de la Prescripción</h3>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Diagnóstico Médico <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej: Esguince de tobillo grado 2, en tratamiento kinesiológico"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-800 font-medium"
                                value={diagnostico}
                                onChange={(e) => setDiagnostico(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Médico Derivante</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Dr. Roberto Gómez"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-800"
                                    value={medico}
                                    onChange={(e) => setMedico(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Sesiones <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="number" 
                                    required 
                                    min="1"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-800 font-bold"
                                    value={sesiones}
                                    onChange={(e) => setSesiones(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Emisión <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-800"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TARJETA 2: RESPALDOS Y DOCUMENTOS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Paperclip size={18} className="text-gray-600" />
                        <h3 className="font-bold text-gray-800">Documentos de Respaldo</h3>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                <FileText size={16} className="text-blue-500" />
                                {ordenId ? 'Reemplazar Orden Médica (Opcional)' : 'Fotografía/PDF de la Orden Médica'}
                            </label>
                            <input 
                                type="file" 
                                accept=".pdf,image/*"
                                onChange={(e) => setArchivoOrden(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                            />
                            <p className="text-xs text-gray-400 mt-2">Formatos aceptados: PDF, JPG, PNG</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                <Paperclip size={16} className="text-gray-500" />
                                {ordenId ? 'Agregar Nuevos Exámenes (Opcional)' : 'Fotografías/PDF de Exámenes (Opcional)'}
                            </label>
                            <input 
                                type="file" 
                                multiple 
                                accept=".pdf,image/*"
                                onChange={(e) => setArchivosExamenes(e.target.files)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors cursor-pointer"
                            />
                            <p className="text-xs text-gray-400 mt-2">Puedes seleccionar varios archivos a la vez</p>
                        </div>

                    </div>
                </div>

                {/* BARRA DE ACCIONES */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <Link 
                        to={`/pacientes/${id}`}
                        className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors bg-white shadow-sm w-full sm:w-auto text-center"
                    >
                        Cancelar
                    </Link>
                    <button 
                        type="submit" 
                        disabled={cargando}
                        className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 ${cargando ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {cargando ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                {ordenId ? 'Actualizar Orden' : 'Guardar Orden'}
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}