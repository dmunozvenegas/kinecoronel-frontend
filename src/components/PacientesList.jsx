import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function PacientesList() {
    const { usuario } = useContext(AuthContext); // Extraemos al usuario conectado
    const [pacientes, setPacientes] = useState([]);
    const [cargando, setCargando] = useState(true);

    const navigate = useNavigate();

    // Función extra de seguridad (por si la usas en algún botón en el futuro)
    const verDetalles = (id) => {
        navigate(`/pacientes/${id}`);
    };

    useEffect(() => {
        // 1. BLINDAJE: Evitamos disparar si el usuario aún no carga en memoria
        if (!usuario || !usuario.id) return;

        const cargarPacientes = async () => {
            try {
                // 2. Extraemos el token directo para forzarlo en la cabecera de iOS
                const token = localStorage.getItem('token');
                
                // 3. RUTA RELATIVA LIMPIA CON CACHE-BUSTING PARA SAFARI MÓVIL
                const url = `/api/pacientes?kinesiologo_id=${usuario.id}&t=${Date.now()}`;
                
                // 4. Disparamos garantizando el envío de la autorización
                const respuesta = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setPacientes(respuesta.data);
            } catch (error) {
                console.error("Hubo un error cargando los pacientes:", error);
                setPacientes([]); // Mantenemos la lista limpia si falla
            } finally {
                setCargando(false);
            }
        };

        cargarPacientes();
        
    // Dependencia segura: reacciona en cuanto el objeto usuario esté completamente listo
    }, [usuario]); 

    if (cargando) return <h2 className="text-xl text-center mt-10 text-gray-600 font-semibold">Cargando pacientes...</h2>;

    return (
        <div className="max-w-6xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Mis Pacientes</h2>
            
            {pacientes.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">No tienes pacientes registrados aún.</p>
                    <Link to="/nuevo-paciente" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                        + Registrar tu primer paciente
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="py-3 px-4 rounded-tl-lg font-semibold text-sm">ID</th>
                                <th className="py-3 px-4 font-semibold text-sm">RUT</th>
                                <th className="py-3 px-4 font-semibold text-sm">Nombre</th>
                                <th className="py-3 px-4 font-semibold text-sm">Estado</th>
                                <th className="py-3 px-4 font-semibold text-center rounded-tr-lg text-sm">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {pacientes.map((paciente, index) => (
                                <tr key={paciente.id} className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                    <td className="py-3 px-4 text-sm">{paciente.id}</td>
                                    <td className="py-3 px-4 font-medium text-sm">{paciente.rut}</td>
                                    <td className="py-3 px-4 text-sm font-semibold">{paciente.nombre}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            paciente.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {paciente.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Link 
                                            to={`/pacientes/${paciente.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-bold text-xs sm:text-sm bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                                        >
                                            Ver Ficha
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}