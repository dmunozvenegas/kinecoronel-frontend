import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Plus, X, Pencil, Trash2, Mail, Phone, 
    Building2, Stethoscope, User 
} from "lucide-react";

export default function Medicos() {
    const [medicos, setMedicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        especialidad: '',
        lugar_trabajo: '',
        correo: '',
        telefono: ''
    });

    // Cargar médicos al iniciar
    useEffect(() => {
        cargarMedicos();
    }, []);

    const cargarMedicos = async () => {
        try {
            const res = await axios.get('/api/medicos');
            setMedicos(res.data);
        } catch (error) {
            console.error("Error cargando directorio médico:", error);
        } finally {
            setCargando(false);
        }
    };

    // Obtener iniciales para el Avatar (Corregido el error de ESLint)
    const getIniciales = (nombre) => {
        if (!nombre) return 'DR';
        const partes = nombre.split(' ');
        return partes.length >= 2 
            ? `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase() 
            : nombre.substring(0, 2).toUpperCase();
    };

    // Manejar formulario
    const abrirModalNuevo = () => {
        setFormData({ nombre: '', especialidad: '', lugar_trabajo: '', correo: '', telefono: '' });
        setEditandoId(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (medico) => {
        setFormData({
            nombre: medico.nombre || '',
            especialidad: medico.especialidad || '',
            lugar_trabajo: medico.lugar_trabajo || '',
            correo: medico.correo || '',
            telefono: medico.telefono || ''
        });
        setEditandoId(medico.id);
        setModalAbierto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            if (editandoId) {
                await axios.put(`/api/medicos/${editandoId}`, formData);
            } else {
                await axios.post('/api/medicos', formData);
            }
            setModalAbierto(false);
            cargarMedicos();
        } catch (error) {
            alert("Error al guardar los datos del médico.");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar al Dr/a. ${nombre} de tu red de contactos?`)) return;
        
        try {
            await axios.delete(`/api/medicos/${id}`);
            cargarMedicos();
        } catch (error) {
            alert("Error al eliminar el contacto.");
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* CABECERA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="max-w-3xl">
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Stethoscope size={24} />
                        </div>
                        Red Médica
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Directorio estratégico de médicos derivantes y profesionales de la salud. 
                        Utiliza este módulo como un CRM clínico para fortalecer tus redes de contacto, 
                        gestionar convenios interinstitucionales y agilizar la entrega de informes de evolución, 
                        fidelizando a los especialistas que confían a sus pacientes en KineCoronel.
                    </p>
                </div>
                
                <button 
                    onClick={abrirModalNuevo}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
                >
                    <Plus size={18} /> Nuevo Médico
                </button>
            </div>

            {/* GRILLA DE TARJETAS DE MÉDICOS */}
            {medicos.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                    <User size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Directorio Vacío</h3>
                    <p className="text-gray-500 mt-1 mb-4">Aún no has agregado a ningún médico derivante a tu red.</p>
                    <button onClick={abrirModalNuevo} className="text-indigo-600 font-bold hover:underline">
                        + Agregar el primer contacto
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medicos.map((medico) => (
                        <div key={medico.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                            
                            {/* Botones de acción (Editar/Eliminar) - Visibles en hover */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => abrirModalEditar(medico)} className="p-1.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleEliminar(medico.id, medico.nombre)} className="p-1.5 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Info del Médico */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 font-black text-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                    {getIniciales(medico.nombre)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight pr-12">{medico.nombre}</h3>
                                    <span className="inline-block mt-1 text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {medico.especialidad || 'Especialista'}
                                    </span>
                                </div>
                            </div>

                            {/* Datos de Contacto */}
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center gap-3">
                                    <Building2 size={16} className="text-gray-400 shrink-0" />
                                    <span className="truncate" title={medico.lugar_trabajo}>{medico.lugar_trabajo || 'Clínica no especificada'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-gray-400 shrink-0" />
                                    {medico.telefono ? (
                                        <a href={`tel:${medico.telefono}`} className="hover:text-indigo-600 transition-colors">{medico.telefono}</a>
                                    ) : <span className="text-gray-400 italic">Sin teléfono</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-gray-400 shrink-0" />
                                    {medico.correo ? (
                                        <a href={`mailto:${medico.correo}`} className="hover:text-indigo-600 transition-colors truncate" title={medico.correo}>{medico.correo}</a>
                                    ) : <span className="text-gray-400 italic">Sin correo</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE FORMULARIO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">{editandoId ? 'Editar Médico' : 'Nuevo Contacto Médico'}</h3>
                            <button onClick={() => setModalAbierto(false)} className="hover:text-gray-200"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                                <input type="text" required placeholder="Ej: Dr. Juan Pérez" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Especialidad</label>
                                    <input type="text" placeholder="Traumatología" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.especialidad} onChange={(e) => setFormData({...formData, especialidad: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Lugar de Trabajo</label>
                                    <input type="text" placeholder="Clínica Biobío" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.lugar_trabajo} onChange={(e) => setFormData({...formData, lugar_trabajo: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" placeholder="doctor@clinica.cl" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                                <input type="text" placeholder="+56 9 1234 5678" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={guardando} className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar Médico'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}