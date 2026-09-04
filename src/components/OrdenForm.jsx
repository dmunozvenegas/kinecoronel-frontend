import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

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

    // ================================================================
    // 1. CARGA DE DATOS (Solo si estamos en Modo Edición)
    // ================================================================
    useEffect(() => {
        if (ordenId && id) {
            const cargarDatosPrevios = async () => {
                try {
                    const token = localStorage.getItem('token');
                    // Usamos la ruta de órdenes por paciente que ya sabemos que funciona
                    const res = await axios.get(`/api/ordenes/paciente/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    // Buscamos la orden específica dentro de la lista
                    const orden = res.data.find(o => o.id === parseInt(ordenId));
                    
                    if (orden) {
                        setDiagnostico(orden.diagnostico || '');
                        setMedico(orden.medico_derivante || '');
                        setSesiones(orden.sesiones_indicadas || 10);
                        if (orden.fecha_emision) {
                            setFecha(orden.fecha_emision.split('T')[0]);
                        }
                    }
                } catch (error) {
                    console.error("Error al precargar la orden:", error);
                }
            };
            cargarDatosPrevios();
        }
    }, [ordenId, id]);

    // ================================================================
    // 2. ENVÍO DE DATOS (Crear o Actualizar)
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
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            };

            if (ordenId) {
                // === MODO EDICIÓN: Usamos PUT nativo ===
                // Nota: Si tu backend tiene problemas con PUT y FormData, 
                // avísame para usar una técnica alternativa.
                await axios.put(`/api/ordenes/${ordenId}`, formData, config);
            } else {
                // === MODO CREACIÓN: Usamos POST nativo ===
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
        <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md border-t-4 border-green-500">
            {/* Título que cambia según la acción */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                {ordenId ? 'Editar Orden Médica' : 'Registrar Nueva Orden Médica'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Diagnóstico Médico</label>
                    <input 
                        type="text" 
                        required 
                        placeholder="Ej: Esguince de tobillo grado 2"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white border-gray-300"
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Médico Derivante</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Dr. Roberto Gómez"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white border-gray-300"
                        value={medico}
                        onChange={(e) => setMedico(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Nº de Sesiones</label>
                        <input 
                            type="number" 
                            required 
                            min="1"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white border-gray-300"
                            value={sesiones}
                            onChange={(e) => setSesiones(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Fecha de Emisión</label>
                        <input 
                            type="date" 
                            required 
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white border-gray-300"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-sm">
                            📄 {ordenId ? 'Reemplazar Orden Médica (Opcional)' : 'Cargar Orden Médica'}
                        </label>
                        <input 
                            type="file" 
                            accept=".pdf,image/*"
                            onChange={(e) => setArchivoOrden(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <span className="text-xs text-gray-400 block mt-1">Formatos: PDF, JPG, PNG</span>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-sm">
                            🔬 {ordenId ? 'Agregar Nuevos Exámenes (Opcional)' : 'Cargar Exámenes (Opcional)'}
                        </label>
                        <input 
                            type="file" 
                            multiple 
                            accept=".pdf,image/*"
                            onChange={(e) => setArchivosExamenes(e.target.files)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <span className="text-xs text-gray-400 block mt-1">Puedes seleccionar varios</span>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link 
                        to={`/pacientes/${id}`}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button 
                        type="submit" 
                        disabled={cargando}
                        className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {cargando ? 'Guardando...' : (ordenId ? 'Actualizar Orden' : 'Guardar Orden')}
                    </button>
                </div>
            </form>
        </div>
    );
}