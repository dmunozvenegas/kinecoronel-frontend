import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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
    const [cargando, setCargando] = useState(true);
    
    useEffect(() => {
        // 1. Usamos la ruta relativa (Axios ya sabe que va hacia https://kinecoronel-backend.onrender.com)
        axios.get(`/api/pacientes/${id}`)
            .then(res => {
                const p = res.data;
                setNombre(p.nombre);
                setRut(p.rut);
                setEstado(p.estado);
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
                navigate('/pacientes'); // Volver a la lista segura en plural
            });
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 2. Petición PUT limpia y segura
            await axios.put(`/api/pacientes/${id}`, { 
                nombre, rut, estado, direccion, 
                fecha_nacimiento: fechaNacimiento || null, 
                correo, telefono 
            });
            
            // 3. Volvemos a la ficha del paciente (Asegúrate de usar plural si tu App.jsx usa /pacientes/:id)
            navigate(`/pacientes/${id}`); 
        } catch (error) {
            console.error(error);
            alert("Hubo un error al actualizar.");
        }
    };

    if (cargando) return <div className="text-center mt-10">Cargando datos...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md border-t-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Editar Ficha de Paciente</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Nombre Completo</label>
                        <input type="text" required className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                            value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">RUT</label>
                        <input type="text" required className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                            value={rut} readOnly /> 
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Fecha de Nacimiento</label>
                        <input type="date" className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                            value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Teléfono</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                            value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Correo</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                            value={correo} onChange={(e) => setCorreo(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Estado</label>
                        <select className="w-full px-4 py-2 border rounded-lg bg-white"
                            value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Dirección</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                        value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                    {/* 4. Corregido a plural para que coincida con las rutas */}
                    <Link to={`/pacientes/${id}`} className="px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50">
                        Cancelar
                    </Link>
                    <button type="submit" className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-sm">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
}