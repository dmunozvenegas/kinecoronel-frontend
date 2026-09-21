import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Hash, Calendar, Phone, Mail, MapPin, Activity, ArrowLeft, Save } from 'lucide-react';

export default function PacienteForm() {
    const { usuario } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Atrapamos el paquete que nos mandó la IA
    const datosIA = location.state?.pacientePrellenado || null;
    
    // Estados
    const [nombre, setNombre] = useState(datosIA?.nombre || ''); 
    const [rut, setRut] = useState('');
    const [estado, setEstado] = useState('Activo');
    const [direccion, setDireccion] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState(datosIA?.telefono || ''); 

    // Estados de UI
    const [cargando, setCargando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    // Formateador de RUT Chileno
    const handleRutChange = (e) => {
        let valor = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (valor.length > 1) {
            const cuerpo = valor.slice(0, -1);
            const dv = valor.slice(-1);
            const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            valor = `${cuerpoConPuntos}-${dv}`;
        }
        setRut(valor);
    };

    // Mayúsculas automáticas
    const handleNombreChange = (e) => {
        const valor = e.target.value;
        const nombreFormateado = valor.replace(/\b\w/g, char => char.toUpperCase());
        setNombre(nombreFormateado);
    };

    // Autocompletar código de país
    const handleTelefonoChange = (e) => {
        let valor = e.target.value;
        if (valor && !valor.startsWith('+56 ')) {
            valor = valor.startsWith('9') ? `+56 ${valor}` : valor;
        }
        setTelefono(valor);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensajeError('');
        setCargando(true);

        try {
            const respuesta = await axios.post('/api/pacientes', { 
                nombre, rut, estado,
                kinesiologo_id: usuario.id,
                direccion,
                fecha_nacimiento: fechaNacimiento || null,
                correo, telefono
            });
            
            const nuevoId = respuesta.data.id || respuesta.data.paciente?.id;
            
            // CORRECCIÓN DE RUTA: Ajustado a singular según App.jsx
            if (nuevoId) {
                navigate(`/pacientes/${nuevoId}`);
            } else {
                navigate('/pacientes');
            }
            
        } catch (error) {
            console.error("Error al registrar paciente", error);
            if (error.response && error.response.status === 400) {
                setMensajeError("Ya existe un paciente registrado con este RUT.");
            } else {
                setMensajeError("Hubo un error al guardar los datos. Verifica tu conexión.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            
            {/* CABECERA */}
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <UserPlus className="text-blue-600" /> Registrar Nuevo Paciente
                    </h1>
                    <p className="text-sm text-gray-500">Completa la información para abrir su expediente clínico.</p>
                </div>
            </div>

            {/* Mensaje de Error */}
            {mensajeError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl font-bold text-sm border border-red-200 flex items-center gap-2">
                    ⚠️ {mensajeError}
                </div>
            )}

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* TARJETA 1: IDENTIFICACIÓN PRINCIPAL */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            1. Identificación Principal
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">RUT del Paciente <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" required maxLength="12"
                                    placeholder="Ej: 12.345.678-9"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors uppercase font-medium text-gray-800"
                                    value={rut} onChange={handleRutChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Completo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserPlus size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" required
                                    placeholder="Ej: Juan Pérez Soto"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors font-medium text-gray-800"
                                    value={nombre} onChange={handleNombreChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Nacimiento</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado Inicial</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Activity size={16} className="text-gray-400" />
                                </div>
                                <select 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700"
                                    value={estado} onChange={(e) => setEstado(e.target.value)}
                                >
                                    <option value="Activo">Activo (En Tratamiento)</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TARJETA 2: DATOS DE CONTACTO */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            2. Datos de Contacto (Opcional)
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono / WhatsApp</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="tel" 
                                    placeholder="+56 9 1234 5678"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={telefono} onChange={handleTelefonoChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="email" 
                                    placeholder="ejemplo@correo.com"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={correo} onChange={(e) => setCorreo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección Particular</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Los Aromos 123, Coronel"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={direccion} onChange={(e) => setDireccion(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* BARRA DE BOTONES INFERIOR */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/pacientes')}
                        className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors bg-white shadow-sm w-full sm:w-auto"
                    >
                        Cancelar
                    </button>
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
                                Guardar Expediente
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}