import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, UserPlus, ChevronRight, Activity, Users } from 'lucide-react';

export default function PacientesList() {
    const { usuario } = useContext(AuthContext);
    const [pacientes, setPacientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const navigate = useNavigate();

    const verDetalles = (id) => {
        navigate(`/pacientes/${id}`);
    };

    useEffect(() => {
        if (!usuario || !usuario.id) return;

        const cargarPacientes = async () => {
            try {
                const token = localStorage.getItem('token');
                const url = `/api/pacientes?kinesiologo_id=${usuario.id}&t=${Date.now()}`;
                
                const respuesta = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setPacientes(respuesta.data);
            } catch (error) {
                console.error("Hubo un error cargando los pacientes:", error);
                setPacientes([]); 
            } finally {
                setCargando(false);
            }
        };

        cargarPacientes();
    }, [usuario]); 

    const pacientesFiltrados = pacientes.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        p.rut.includes(busqueda)
    );

    if (cargando) return (
        <div className="flex flex-col items-center justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Cargando tus pacientes...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* ========================================================= */}
            {/* AQUÍ ESTÁ EL BOTÓN: SIEMPRE VISIBLE EN LA CABECERA        */}
            {/* ========================================================= */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-blue-600" /> Mis Pacientes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona los expedientes y tratamientos</p>
                </div>
                
                <Link 
                    to="/pacientes/nuevo" 
                    className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <UserPlus size={18} /> Nuevo Paciente
                </Link>
            </div>
            {/* ========================================================= */}

            {pacientes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Aún no tienes pacientes</h3>
                    <p className="text-gray-500 mt-2 mb-6">Comienza registrando tu primer expediente clínico.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    
                    {/* BARRA DE BÚSQUEDA */}
                    <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RUT..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-lg text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none sm:text-sm"
                        />
                    </div>

                    {pacientesFiltrados.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 font-medium">No se encontraron pacientes que coincidan con "{busqueda}"</p>
                        </div>
                    )}

                    {/* VISTA PC (Tabla) */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">RUT</th>
                                    <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="py-4 px-6 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pacientesFiltrados.map((paciente) => (
                                    <tr key={paciente.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => verDetalles(paciente.id)}>
                                        <td className="py-4 px-6 text-sm text-gray-400 font-medium">#{paciente.id}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-800">{paciente.nombre}</td>
                                        <td className="py-4 px-6 text-sm text-gray-500">{paciente.rut}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                                paciente.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                <Activity size={12} /> {paciente.estado}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="text-gray-400 group-hover:text-blue-600 transition-colors p-2 rounded-full group-hover:bg-blue-100">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* VISTA MÓVIL (Tarjetas) */}
                    <div className="md:hidden space-y-3">
                        {pacientesFiltrados.map((paciente) => (
                            <div 
                                key={paciente.id} 
                                onClick={() => verDetalles(paciente.id)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors relative overflow-hidden flex items-center justify-between"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                <div className="pl-2">
                                    <h3 className="font-bold text-gray-900 text-lg">{paciente.nombre}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-sm text-gray-500">{paciente.rut}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            paciente.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {paciente.estado}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}