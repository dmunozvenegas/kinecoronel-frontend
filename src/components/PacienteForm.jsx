import { useState, useContext } from 'react';
import axios from 'axios';
// 1. IMPORTANTE: Agregamos useLocation aquí
import { useNavigate, useLocation } from 'react-router-dom'; 
import { AuthContext } from '../context/AuthContext';

export default function PacienteForm() {
    const { usuario } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // 2. Inicializamos el hook para "escuchar" si traemos datos

    // 3. Atrapamos el paquete que nos mandó la IA desde el escáner de la agenda
    const datosIA = location.state?.pacientePrellenado || null;
    
    // 4. Prellenamos el Nombre si la IA lo detectó
    const [nombre, setNombre] = useState(datosIA?.nombre || ''); 
    const [rut, setRut] = useState('');
    const [estado, setEstado] = useState('Activo');
    
    // NUEVOS ESTADOS DE CONTACTO
    const [direccion, setDireccion] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [correo, setCorreo] = useState('');
    // 5. Prellenamos el Teléfono si la IA lo detectó
    const [telefono, setTelefono] = useState(datosIA?.telefono || ''); 

    // Estados de UI
    const [cargando, setCargando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    // ==========================================
    // 🛠️ MEJORA 1: Formateador de RUT Chileno en vivo
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

    // ==========================================
    // 🛠️ MEJORA 2: Mayúsculas automáticas (Nombres y Apellidos)
    // ==========================================
    const handleNombreChange = (e) => {
        const valor = e.target.value;
        const nombreFormateado = valor.replace(/\b\w/g, char => char.toUpperCase());
        setNombre(nombreFormateado);
    };

    // ==========================================
    // 🛠️ MEJORA 3: Autocompletar código de país
    // ==========================================
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
            // USAMOS RUTA RELATIVA para que funcione el proxy en local y en producción
            const respuesta = await axios.post('/api/pacientes', { 
                nombre, 
                rut, 
                estado,
                kinesiologo_id: usuario.id,
                direccion,
                fecha_nacimiento: fechaNacimiento || null,
                correo,
                telefono
            });
            
            // Si el backend devuelve el ID nuevo, lo mandamos a su ficha. Si no, a la lista.
            const nuevoId = respuesta.data.id || respuesta.data.paciente?.id;
            if (nuevoId) {
                navigate(`/pacientes/${nuevoId}`);
            } else {
                navigate('/pacientes');
            }
            
        } catch (error) {
            console.error("Error al registrar paciente", error);
            if (error.response && error.response.status === 400) {
                setMensajeError("Parece que ya existe un paciente registrado con este RUT.");
            } else {
                setMensajeError("Hubo un error al guardar los datos. Verifica tu conexión.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md border-t-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Registrar Nuevo Paciente</h2>
            
            {/* Mensaje de Error Amigable */}
            {mensajeError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm mb-6 border border-red-100">
                    ⚠️ {mensajeError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* GRILLA DE 2 COLUMNAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* RUT */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">RUT del Paciente *</label>
                        <input 
                            type="text" 
                            required 
                            maxLength="12"
                            placeholder="Ej: 12.345.678-9"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 uppercase"
                            value={rut}
                            onChange={handleRutChange}
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Nombre Completo *</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={nombre}
                            onChange={handleNombreChange}
                        />
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Fecha de Nacimiento</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={fechaNacimiento}
                            onChange={(e) => setFechaNacimiento(e.target.value)}
                        />
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Teléfono de Contacto</label>
                        <input 
                            type="tel" 
                            placeholder="Ej: +56 9 1234 5678"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={telefono}
                            onChange={handleTelefonoChange}
                        />
                    </div>

                    {/* Correo */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Correo Electrónico</label>
                        <input 
                            type="email" 
                            placeholder="ejemplo@correo.com"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                        />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Estado Inicial</label>
                        <select 
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                </div>

                {/* Dirección (Ocupa ancho completo abajo) */}
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Dirección Particular</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Los Aromos 123, Coronel"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                    />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                    <button 
                        type="button" 
                        onClick={() => navigate('/pacientes')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={cargando}
                        className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {cargando ? 'Guardando...' : 'Guardar Paciente'}
                    </button>
                </div>
            </form>
        </div>
    );
}