import { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ResumenFinanciero from './ResumenFinanciero';
import ModalIngresoManual from './ModalIngresoManual';

// -----------------------------------------------------------------------------
// Utilidades de formato: funciones puras definidas fuera del componente para
// que no se vuelvan a crear en cada render.
// -----------------------------------------------------------------------------

// Elimina todo lo que no sea un dígito
const soloNumeros = (valor) => (valor || '').replace(/\D/g, '');

// Máscara de RUT: 12345678K -> 12345678-K
const formatearRUT = (valor) => {
    const soloRut = (valor || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (soloRut.length <= 1) return soloRut;
    return `${soloRut.slice(0, -1)}-${soloRut.slice(-1)}`;
};

// Máscara de fecha: DDMMYYYY -> DD-MM-YYYY
const formatearFecha = (valor) => {
    const soloDigitos = soloNumeros(valor);
    if (soloDigitos.length <= 2) return soloDigitos;
    if (soloDigitos.length <= 4) return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2)}`;
    // Limita a 8 dígitos (DD-MM-YYYY)
    return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2, 4)}-${soloDigitos.slice(4, 8)}`;
};

// Máscara de monto con separador de miles: 12500 -> 12.500
const formatearMontoInput = (valor) =>
    soloNumeros(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Cada campo del formulario sabe cómo "limpiar" lo que escribe el usuario
const formateadoresCampos = {
    rut_beneficiario: formatearRUT,
    fecha_emision: formatearFecha,
    numero_bono: soloNumeros,
    monto: formatearMontoInput,
};

// Formatea un valor numérico como moneda CLP: 12500 -> $12.500
const formatoMoneda = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});
const formatearMonto = (valor) => formatoMoneda.format(Number(valor) || 0);

const formatearFechaRegistro = (fecha) => new Date(fecha).toLocaleString('es-CL');

const DATOS_MANUAL_INICIALES = {
    rut_beneficiario: '',
    fecha_emision: '',
    numero_bono: '',
    monto: '',
};

export default function ListaBonos() {
    const { usuario } = useContext(AuthContext);
    const kinesiologoId = usuario?.id;

    const [bonos, setBonos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [guardandoManual, setGuardandoManual] = useState(false);
    const [datosManual, setDatosManual] = useState(DATOS_MANUAL_INICIALES);

    // useCallback: la función es estable mientras no cambie el kinesiólogo,
    // así el useEffect de abajo no se vuelve a ejecutar en cada render.
    const fetchBonos = useCallback(async (signal) => {
        try {
            const respuesta = await axios.get('/bonos', {
                params: { kinesiologo_id: kinesiologoId },
                signal,
            });

            if (respuesta.data.success) {
                setBonos(respuesta.data.data);
            }
        } catch (error) {
            // Ignoramos una cancelación (por ejemplo al desmontar el componente)
            if (axios.isCancel(error)) return;
            console.error('Error cargando los bonos:', error);
            alert('No se pudieron cargar los bonos.');
        } finally {
            if (!signal?.aborted) {
                setCargando(false);
            }
        }
    }, [kinesiologoId]);

    useEffect(() => {
        // Sin sesión activa no hay nada que cargar (la UI lo maneja en el render)
        if (!kinesiologoId) return undefined;

        const controlador = new AbortController();
        fetchBonos(controlador.signal);

        // Cancelamos la petición si el componente se desmonta o cambia de sesión
        return () => controlador.abort();
    }, [fetchBonos, kinesiologoId]);

    const exportarExcel = () => {
        if (bonos.length === 0) {
            alert('No hay bonos para exportar.');
            return;
        }

        const datosExcel = bonos.map((bono) => ({
            'RUT Beneficiario': bono.rut_beneficiario,
            'Fecha Emisión Bono': bono.fecha_emision,
            'N° Bono': bono.numero_bono,
            'Monto': formatearMonto(bono.monto),
            'Fecha de Registro en Sistema': formatearFechaRegistro(bono.fecha_registro)
        }));

        const hoja = XLSX.utils.json_to_sheet(datosExcel);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Bonos Fonasa');

        // Nombre de archivo con fecha en formato ISO (YYYY-MM-DD), sin depender del locale
        const nombreArchivo = `Listado_Bonos_Fonasa_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(libro, nombreArchivo);
    };

    // Envía el formulario manual al backend
    const manejarEnvioManual = async (evento) => {
        evento.preventDefault();

        if (!kinesiologoId) {
            alert('Error: No se pudo identificar tu sesión.');
            return;
        }

        setGuardandoManual(true);

        try {
            const respuesta = await axios.post('/bonos', {
                ...datosManual,
                // Le quitamos los puntos al monto antes de enviarlo a la BD
                monto: soloNumeros(datosManual.monto),
                kinesiologo_id: kinesiologoId,
            });

            if (respuesta.data.success) {
                setMostrarModal(false);
                setDatosManual(DATOS_MANUAL_INICIALES);
                fetchBonos();
            }
        } catch (error) {
            console.error('Error guardando el bono manual:', error);
            const mensajeError = error.response?.data?.message || 'Hubo un error al guardar el bono. Intenta nuevamente.';
            alert(mensajeError);
        } finally {
            setGuardandoManual(false);
        }
    };

    // Handler único para todos los campos del modal: cada campo usa su propia
    // "máscara" (formateadoresCampos) definida arriba.
    const manejarCambioCampo = (campo, valor) => {
        const formateador = formateadoresCampos[campo];
        setDatosManual((prev) => ({ ...prev, [campo]: formateador(valor) }));
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Registro de Bonos Fonasa</h2>
                    <p className="text-sm text-gray-500">Historial de todos los bonos escaneados e ingresados al sistema.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* 👇 NUEVO BOTÓN DE INGRESO MANUAL */}
                    <button 
                        onClick={() => setMostrarModal(true)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Ingreso Manual
                    </button>

                    <Link 
                        to="/escanear-bono"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Escanear Bono
                    </Link>

                    <button 
                        onClick={exportarExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Descargar Excel
                    </button>
                </div>
            </div>
            {/* 👇 INYECTAMOS EL DASHBOARD AQUÍ */}
            {!cargando && bonos.length > 0 && (
                <ResumenFinanciero bonos={bonos} />
            )}

            {cargando && kinesiologoId ? (
                <div className="text-center py-10 text-gray-500">Cargando bonos...</div>
            ) : bonos.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No hay bonos registrados aún.
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">RUT Beneficiario</th>
                                <th className="px-6 py-4">Fecha Emisión</th>
                                <th className="px-6 py-4">N° Bono</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-6 py-4">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bonos.map((bono) => (
                                <tr key={bono.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{bono.rut_beneficiario}</td>
                                    <td className="px-6 py-4 text-gray-700">{bono.fecha_emision}</td>
                                    <td className="px-6 py-4 text-blue-600 font-mono font-medium">{bono.numero_bono}</td>
                                    <td className="px-4 py-3 text-green-600 font-bold">{formatearMonto(bono.monto)}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {formatearFechaRegistro(bono.fecha_registro)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 👇 MODAL FLOTANTE PARA INGRESO MANUAL */}
            {mostrarModal && (
                <ModalIngresoManual
                    datos={datosManual}
                    guardando={guardandoManual}
                    onCambioCampo={manejarCambioCampo}
                    onEnviar={manejarEnvioManual}
                    onCerrar={() => setMostrarModal(false)}
                />
            )}
        </div>
    );
}