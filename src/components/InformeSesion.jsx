import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Printer, ArrowLeft } from 'lucide-react';

export default function InformeSesion() {
    const { pacienteId, ordenId, sesionId } = useParams();
    const { usuario } = useContext(AuthContext); // Datos de la kinesióloga conectada
    const [paciente, setPaciente] = useState(null);
    const [orden, setOrden] = useState(null);
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDatosInforme = async () => {
            try {
                // 1. Cargamos al paciente con ruta relativa segura (HTTPS nativo)
                const resPac = await axios.get(`/api/pacientes/${pacienteId}`);
                setPaciente(resPac.data);

                // 2. Cargamos las órdenes y filtramos la que corresponde
                const resOrd = await axios.get(`/api/ordenes/paciente/${pacienteId}`);
                const ordCorrecta = resOrd.data.find(o => o.id === parseInt(ordenId));
                setOrden(ordCorrecta);

                // 3. Cargamos el historial de sesiones y sacamos la específica
                const resSes = await axios.get(`/api/ordenes/sesiones/${ordenId}`);
                const sesCorrecta = resSes.data.find(s => s.id === parseInt(sesionId));
                setSesion(sesCorrecta);

            } catch (error) {
                console.error("Error al cargar datos para el informe:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatosInforme();
    }, [pacienteId, ordenId, sesionId]);

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

    if (cargando) return <div className="text-center mt-20 text-lg font-bold text-gray-500">Generando informe oficial...</div>;
    if (!sesion || !paciente) return <div className="text-center mt-20 text-red-600 font-bold">No se pudo cargar el informe.</div>;

    // Procesamos las terapias aplicadas
    let terapiasArray = [];
    if (sesion.terapias) {
        try { terapiasArray = JSON.parse(sesion.terapias); } catch(e){}
    }

    return (
        <div className="max-w-3xl mx-auto my-6 bg-white p-10 border border-gray-300 shadow-lg print:shadow-none print:border-none print:m-0 print:p-0 text-gray-800">
            
            {/* Barra de controles (Oculta al imprimir) */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 print:hidden bg-gray-50 p-3 rounded-lg">
                <Link 
                    to={`/pacientes/${pacienteId}`} 
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft size={16} /> Volver a la Ficha
                </Link>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                    <Printer size={16} /> Imprimir / Guardar Informe PDF
                </button>
            </div>

            {/* ENCABEZADO MEMBRETE CON LOGO */}
            <div className="border-b-2 border-blue-800 pb-6 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img 
                        src="/logo/logo-original.jpg" 
                        alt="Logo KineCoronel" 
                        className="h-20 w-auto object-contain"
                        onError={(e) => e.target.style.display = 'none'} 
                    />
                </div>

                <div className="text-right">
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded font-bold text-xs uppercase block mb-1 text-center">
                        Informe de Atención
                    </span>
                    <p className="text-xs text-gray-500 font-medium">
                        Fecha Emisión: {new Date().toLocaleDateString('es-CL')}
                    </p>
                </div>
            </div>

            {/* DATOS DEL PACIENTE */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm">
                <h2 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 border-b pb-1 border-gray-200">
                    Antecedentes del Paciente
                </h2>
                <div className="grid grid-cols-2 gap-y-2">
                    <p><span className="font-semibold text-gray-500">Nombre:</span> {paciente.nombre}</p>
                    <p><span className="font-semibold text-gray-500">RUT:</span> {paciente.rut}</p>
                    <p><span className="font-semibold text-gray-500">Edad:</span> {calcularEdad(paciente.fecha_nacimiento)}</p>
                    <p><span className="font-semibold text-gray-500">Teléfono:</span> {paciente.telefono || 'Sin registro'}</p>
                </div>
                {orden && (
                    <div className="mt-3 pt-3 border-t border-gray-200 bg-white p-2 rounded border">
                        <p className="text-xs"><span className="font-bold text-blue-700">Diagnóstico Tratado:</span> {orden.diagnostico}</p>
                        <p className="text-xs mt-1"><span className="font-bold text-gray-500">Médico Derivante:</span> {orden.medico_derivante || 'No especificado'}</p>
                    </div>
                )}
            </div>

            {/* DETALLE DE LA SESIÓN */}
            <div className="mb-8">
                <div className="flex justify-between items-center bg-blue-800 text-white px-4 py-2 rounded-t-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                        Sesión Registrada #{sesion.id}
                    </h3>
                    <span className="text-xs font-semibold bg-blue-700 px-2 py-0.5 rounded">
                        {new Date(sesion.fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                <div className="border-x border-b border-gray-200 p-6 rounded-b-lg bg-white space-y-4">
                    {terapiasArray.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Procedimientos / Agentes Físicos:</h4>
                            <div className="flex flex-wrap gap-2">
                                {terapiasArray.map((t, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-800 border border-gray-300 px-2.5 py-1 rounded text-xs font-bold uppercase">
                                        ✓ {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evolución y Trabajo Realizado:</h4>
                        <div 
                            className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 prose prose-sm max-w-none print:bg-white print:border-gray-300"
                            dangerouslySetInnerHTML={{ __html: sesion.evolucion }}
                        />
                    </div>
                </div>
            </div>

            {/* FIRMA Y TIMBRE */}
            <div className="mt-24 pt-8 border-t border-gray-300 flex justify-between items-end">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Lugar de Atención</p>
                    <p className="text-sm font-bold text-gray-700">KineCoronel</p>
                    <p className="text-xs text-gray-500">Coronel, Región del Biobío</p>
                </div>
                
                <div className="text-center w-64">
                    <div className="h-16 border-b border-gray-600 mb-2 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-gray-300 italic">Firma y timbre profesional</span>
                    </div>
                    <p className="text-sm font-black text-gray-800">{usuario?.nombre}</p>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mt-0.5">
                        {usuario?.rol || 'Kinesióloga'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{usuario?.email}</p>
                </div>
            </div>

            <div className="mt-12 text-center print:block">
                <p className="text-[10px] text-gray-400 italic">
                    Este documento certifica exclusivamente la atención kinesiológica realizada en la fecha y hora señaladas en el registro.
                </p>
            </div>

        </div>
    );
}