import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserCog, Hash, Calendar, Phone, Mail, MapPin, Activity, ArrowLeft, Save } from 'lucide-react';

export default function PacienteEdit() {
    const { id } = useParams();
    const { usuario } = useContext(AuthContext);
    const navigate = useNavigate();

    // Estados para los campos
    const [nombre, setNombre] = useState('');
    const [rut, setRut] = useState('');
    const [estado, setEstado] = useState('Activo');
    const [direccion, setDireccion] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    
    // Estados de UI
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');
    
    useEffect(() => {
        axios.get(`/api/pacientes/${id}`)
            .then(res => {
                const p = res.data;
                setNombre(p.nombre || '');
                setRut(p.rut || '');
                setEstado(p.estado || 'Activo');
                setDireccion(p.direccion || '');
                if (p.fecha_nacimiento) {
                    setFechaNacimiento(p.fecha_nacimiento.split('T')[0]);
                }
                setCorreo(p.correo || '');
                setTelefono(p.telefono || '');
                setCargando(false);
            })
            .catch(err => {
                console.error(err);
                alert("Error al cargar datos del paciente");
                navigate('/pacientes'); 
            });
    }, [id, navigate]);

    // ==========================================
    // 🛠️ FORMATEADORES AUTOMÁTICOS
    // ==========================================
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

    const handleNombreChange = (e) => {
        const valor = e.target.value;
        const nombreFormateado = valor.replace(/\b\w/g, char => char.toUpperCase());
        setNombre(nombreFormateado);
    };

    const handleTelefonoChange = (e) => {
        let valor = e.target.value;
        if (valor && !valor.startsWith('+56 ')) {
            valor = valor.startsWith('9') ? `+56 ${valor}` : valor;
        }
        setTelefono(valor);
    };

    // ==========================================
    // 💾 GUARDAR CAMBIOS
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensajeError('');
        setGuardando(true);

        try {
            await axios.put(`/api/pacientes/${id}`, { 
                nombre, rut, estado, direccion, 
                fecha_nacimiento: fechaNacimiento || null, 
                correo, telefono 
            });
            
            navigate(`/pacientes/${id}`); 
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 400) {
                setMensajeError("El RUT ingresado ya pertenece a otro paciente.");
            } else {
                setMensajeError("Hubo un error al actualizar los datos. Verifica tu conexión.");
            }
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return (
        <div className="flex flex-col items-center justify-center mt-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-gray-500 font-medium tracking-wide">Cargando perfil del paciente...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            
            {/* CABECERA */}
            <div className="flex items-center gap-4 mb-2">
                <Link to={`/pacientes/${id}`} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <UserCog className="text-yellow-600" /> Editar Ficha de Paciente
                    </h1>
                    <p className="text-sm text-gray-500">Actualiza los datos personales o de contacto del expediente #{id}.</p>
                </div>
            </div>

            {/* Mensaje de Error */}
            {mensajeError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl font-bold text-sm border border-red-200 flex items-center gap-2">
                    ⚠️ {mensajeError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* TARJETA 1: IDENTIFICACIÓN PRINCIPAL */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-yellow-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <UserCog size={18} className="text-yellow-600" />
                        <h3 className="font-bold text-gray-800">1. Identificación Principal</h3>
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors uppercase font-medium text-gray-800"
                                    value={rut} onChange={handleRutChange}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Si modificas el RUT, asegúrate de que sea correcto.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Completo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCog size={16} className="text-gray-400" />
                                </div>
                                <input 
                                    type="text" required
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors font-medium text-gray-800"
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado Clínico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Activity size={16} className="text-gray-400" />
                                </div>
                                <select 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-medium text-gray-700"
                                    value={estado} onChange={(e) => setEstado(e.target.value)}
                                >
                                    <option value="Activo">Activo (En Tratamiento)</option>
                                    <option value="Inactivo">Inactivo (Alta / Retirado)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TARJETA 2: DATOS DE CONTACTO */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Phone size={18} className="text-gray-500" />
                        <h3 className="font-bold text-gray-800">2. Datos de Contacto</h3>
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 hover:bg-white transition-colors text-gray-700"
                                    value={direccion} onChange={(e) => setDireccion(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* BARRA DE BOTONES INFERIOR */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <Link 
                        to={`/pacientes/${id}`}
                        className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors bg-white shadow-sm w-full sm:w-auto text-center"
                    >
                        Cancelar
                    </Link>
                    <button 
                        type="submit" 
                        disabled={guardando}
                        className={`px-8 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 ${guardando ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {guardando ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}