import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Printer, ArrowLeft, FileText, User, Activity, Calendar } from 'lucide-react';

export default function InformeSesion() {
    const { pacienteId, ordenId, sesionId } = useParams();
    const { usuario } = useContext(AuthContext); 
    const [paciente, setPaciente] = useState(null);
    const [orden, setOrden] = useState(null);
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDatosInforme = async () => {
            try {
                const resPac = await axios.get(`/api/pacientes/${pacienteId}`);
                setPaciente(resPac.data);

                const resOrd = await axios.get(`/api/ordenes/paciente/${pacienteId}`);
                const ordCorrecta = resOrd.data.find(o => o.id === parseInt(ordenId));
                setOrden(ordCorrecta);

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

    if (cargando) return (
        <div className="flex flex-col items-center justify-center mt-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
            <p className="text-gray-500 font-bold tracking-wide uppercase">Generando Documento Oficial...</p>
        </div>
    );
    
    if (!sesion || !paciente) return <div className="text-center mt-20 text-red-600 font-bold">No se pudo cargar el informe.</div>;

    let terapiasArray = [];
    if (sesion.terapias) {
        try { terapiasArray = JSON.parse(sesion.terapias); } catch(e){}
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 print:py-0 print:px-0 print:bg-white text-gray-800 flex flex-col items-center">
            
            {/* ========================================================= */}
            {/* BARRA DE CONTROLES FLOTANTE (Oculta al imprimir)          */}
            {/* ========================================================= */}
            <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                <Link 
                    to={`/pacientes/${pacienteId}`} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
                >
                    <ArrowLeft size={16} /> Volver al Expediente
                </Link>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md transition-colors w-full sm:w-auto"
                >
                    <Printer size={18} /> Imprimir Documento Oficial
                </button>
            </div>

            {/* ========================================================= */}
            {/* HOJA DEL DOCUMENTO A4                                     */}
            {/* ========================================================= */}
            <div className="w-full max-w-[210mm] bg-white p-10 sm:p-16 shadow-2xl border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 relative flex flex-col min-h-[297mm]">
                
                {/* MEMBRETE OFICIAL */}
                <div className="flex justify-between items-end border-b-[3px] border-blue-900 pb-5 mb-8">
                    <div className="flex items-center gap-5">
                        <img 
                            src="/logo/logo-original.jpg" 
                            alt="Logo KineCoronel" 
                            className="h-16 w-auto object-contain"
                            onError={(e) => e.target.style.display = 'none'} 
                        />
                        <div>
                            <h1 className="text-2xl font-black text-blue-900 uppercase tracking-widest leading-none">Centro Clínico</h1>
                            <h2 className="text-xl font-bold text-gray-700 tracking-wide mt-1">KineCoronel</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded inline-block">
                            Informe de Sesión Clínica
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium mt-1">Folio: #{ordenId}-{sesionId}</p>
                        <p className="text-[11px] text-gray-600 font-medium">Emisión: {new Date().toLocaleDateString('es-CL')}</p>
                    </div>
                </div>

                {/* CUERPO DEL INFORME */}
                <div className="flex-1">
                    
                    {/* Sección 1: Antecedentes del Paciente */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User size={14} /> I. Antecedentes del Paciente
                        </h3>
                        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-y-3 text-sm">
                            <p><span className="font-bold text-gray-500 uppercase text-[10px] block">Nombre Completo</span> <span className="font-semibold text-gray-900">{paciente.nombre}</span></p>
                            <p><span className="font-bold text-gray-500 uppercase text-[10px] block">RUT</span> <span className="font-semibold text-gray-900">{paciente.rut}</span></p>
                            <p><span className="font-bold text-gray-500 uppercase text-[10px] block">Edad</span> <span className="font-semibold text-gray-900">{calcularEdad(paciente.fecha_nacimiento)}</span></p>
                            <p><span className="font-bold text-gray-500 uppercase text-[10px] block">Teléfono de Contacto</span> <span className="font-semibold text-gray-900">{paciente.telefono || 'Sin registro'}</span></p>
                        </div>
                    </div>

                    {/* Sección 2: Motivo de Atención */}
                    {orden && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity size={14} /> II. Detalle de la Orden Médica
                            </h3>
                            <div className="border-l-4 border-blue-800 bg-blue-50/30 py-3 px-5 text-sm">
                                <p className="mb-1"><span className="font-bold text-gray-600">Diagnóstico Tratado:</span> <span className="font-bold text-blue-900 uppercase">{orden.diagnostico}</span></p>
                                <p><span className="font-bold text-gray-600">Médico Derivante:</span> {orden.medico_derivante || 'No especificado'}</p>
                            </div>
                        </div>
                    )}

                    {/* Sección 3: Evolución Clínica */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16} /> III. Registro de Sesión
                            </h3>
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(sesion.fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        {terapiasArray.length > 0 && (
                            <div className="mb-5">
                                <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Procedimientos y Agentes Físicos Aplicados:</p>
                                <div className="flex flex-wrap gap-2">
                                    {terapiasArray.map((t, index) => (
                                        <span key={index} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase shadow-sm">
                                            ✓ {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Detalle de la Evolución y Trabajo Realizado:</p>
                            <div 
                                className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none text-justify print:text-black"
                                dangerouslySetInnerHTML={{ __html: sesion.evolucion }}
                            />
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* FIRMAS Y PIE DE PÁGINA LEGAL                              */}
                {/* ========================================================= */}
                <div className="mt-auto pt-16">
                    <div className="flex justify-between items-end border-b border-gray-300 pb-8">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lugar de Atención</p>
                            <p className="text-sm font-bold text-gray-800">Centro KineCoronel</p>
                            <p className="text-xs text-gray-500">Coronel, Región del Biobío</p>
                        </div>
                        
                        <div className="text-center w-64">
                            <div className="h-16 border-b-2 border-gray-800 mb-2 flex items-end justify-center pb-1">
                                <span className="text-[10px] text-gray-400 italic">Firma y timbre profesional</span>
                            </div>
                            <p className="text-sm font-black text-gray-900 uppercase tracking-wide">{usuario?.nombre || 'Profesional Tratante'}</p>
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mt-0.5">
                                {usuario?.rol || 'Kinesiólogo'}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">{usuario?.email}</p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-[9px] text-gray-500 leading-tight">
                            <strong>CONFIDENCIALIDAD MÉDICA:</strong> Este documento está amparado por la Ley N° 20.584 (Derechos y Deberes del Paciente). 
                            Contiene información clínica privilegiada y confidencial, de uso exclusivo para el equipo de salud tratante y el paciente. 
                            Queda estrictamente prohibida su reproducción, divulgación o alteración no autorizada.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}