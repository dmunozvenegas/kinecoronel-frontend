import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, SaveAll } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function BonoScanner() {
    const navigate = useNavigate(); 
    const { usuario } = useContext(AuthContext); 

    // Estados actualizados para manejar múltiples archivos
    const [archivos, setArchivos] = useState([]);
    const [vistasPrevias, setVistasPrevias] = useState([]);
    
    // Estados de procesamiento
    const [procesando, setProcesando] = useState(false);
    const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
    const [datosExtraidos, setDatosExtraidos] = useState([]);
    const [errores, setErrores] = useState([]);
    
    const [guardando, setGuardando] = useState(false);
    const fileInputRef = useRef(null);

    // 1. Manejo de selección múltiple
    const handleCaptura = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setArchivos(files);
            
            // Crear URLs para previsualizar todas las imágenes
            const urls = files.map(file => URL.createObjectURL(file));
            setVistasPrevias(urls);
            
            // Reiniciar tablas y errores
            setDatosExtraidos([]);
            setErrores([]);
            setProgreso({ actual: 0, total: 0 });
        }
    };

    // 2. Procesamiento en Lote (Una por una para no saturar el servidor)
    const procesarImagenes = async () => {
        if (archivos.length === 0) return;
        
        setProcesando(true);
        setErrores([]);
        setDatosExtraidos([]);
        
        const resultadosAgrupados = [];
        const nuevosErrores = [];

        for (let i = 0; i < archivos.length; i++) {
            setProgreso({ actual: i + 1, total: archivos.length });
            
            const formData = new FormData();
            formData.append('imagen', archivos[i]);

            try {
                const response = await axios.post('/agenda/scan', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data.success && response.data.data) {
                    resultadosAgrupados.push(...response.data.data);
                }
            } catch (err) {
                // 👇 EL TRUCO: Extraemos el error profundo del backend
                const errorBackend = err.response?.data?.message || err.response?.data?.error || err.message || "Error desconocido";
                console.error(`Error crudo en imagen ${i + 1}:`, err);
                nuevosErrores.push(`Fallo en imagen ${i + 1}: ${errorBackend}`);
            }
        }

        setDatosExtraidos(resultadosAgrupados);
        setErrores(nuevosErrores);
        setProcesando(false);
    };

    // 3. Guardar un solo bono
    const handleGuardarBono = async (bono, index) => {
        if (!usuario || !usuario.id) {
            alert("Error: No se pudo identificar tu sesión.");
            return;
        }

        try {
            await axios.post('/bonos', {
                rut_beneficiario: bono.rut_beneficiario,
                fecha_emision: bono.fecha_emision,
                numero_bono: bono.numero_bono,
                kinesiologo_id: usuario.id,
                monto: Number(bono.monto) || 0
            });
            
            // Quitar el bono de la lista visual si se guardó con éxito
            setDatosExtraidos(prev => prev.filter((_, i) => i !== index));
            alert("¡Bono guardado!");
        } catch (error) {
            console.error("Error al guardar el bono:", error);
            alert("Hubo un error al guardar el bono.");
        }
    };

    // 4. NUEVO: Guardar Todos los bonos extraídos de una vez
    const handleGuardarTodos = async () => {
        if (!usuario || !usuario.id) return alert("Error de sesión.");
        
        setGuardando(true);
        let guardadosCorrectamente = 0;

        for (const bono of datosExtraidos) {
            try {
                await axios.post('/bonos', {
                    rut_beneficiario: bono.rut_beneficiario,
                    fecha_emision: bono.fecha_emision,
                    numero_bono: bono.numero_bono,
                    kinesiologo_id: usuario.id,
                    monto: Number(bono.monto) || 0
                });
                guardadosCorrectamente++;
            } catch (error) {
                console.error("Error guardando un bono:", error);
            }
        }

        setGuardando(false);
        if (guardadosCorrectamente === datosExtraidos.length) {
            alert(`¡Se guardaron ${guardadosCorrectamente} bonos exitosamente!`);
            navigate('/bonos');
        } else {
            alert(`Se guardaron ${guardadosCorrectamente} de ${datosExtraidos.length}. Revisa tu lista de bonos.`);
            setDatosExtraidos([]); // Limpiamos para evitar duplicados accidentales
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Escanear Múltiples Bonos</h2>
            <p className="text-sm text-gray-500 mb-6">Selecciona una o varias fotos desde tu galería para extraer sus datos automáticamente.</p>

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl mb-6">
                {/* 👇 ATENCIÓN AQUÍ: Agregamos el atributo "multiple" */}
                <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleCaptura}/>
                
                {vistasPrevias.length === 0 ? (
                    <div className="text-center">
                        <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm inline-flex items-center gap-2 transition-colors cursor-pointer">
                            <Camera size={20} /> Seleccionar Fotos
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">
                        {/* Grilla de vistas previas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {vistasPrevias.map((url, idx) => (
                                <img key={idx} src={url} alt={`Preview ${idx+1}`} className="h-32 w-full object-cover rounded-lg border border-gray-300 shadow-sm" />
                            ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button onClick={() => fileInputRef.current.click()} disabled={procesando} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50">
                                Volver a Seleccionar
                            </button>
                            
                            <button onClick={procesarImagenes} disabled={procesando} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-sm inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
                                {procesando ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                {procesando ? `Procesando ${progreso.actual} de ${progreso.total}...` : 'Procesar con IA'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel de Errores Múltiples */}
            {errores.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex flex-col gap-2">
                    {errores.map((err, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <AlertCircle className="text-red-500 mt-0.5 min-w-max" size={18} />
                            <p className="text-sm text-red-700 font-medium">{err}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabla de Resultados Múltiples */}
            {datosExtraidos.length > 0 && (
                <div className="border border-green-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={18} />
                            <h3 className="font-bold text-green-800 text-sm">
                                {datosExtraidos.length} {datosExtraidos.length === 1 ? 'Bono Procesado' : 'Bonos Procesados'}
                            </h3>
                        </div>
                        
                        {/* NUEVO BOTÓN: Guardar Todos */}
                        <button 
                            onClick={handleGuardarTodos}
                            disabled={guardando}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                        >
                            {guardando ? <Loader2 className="animate-spin" size={16} /> : <SaveAll size={16} />}
                            {guardando ? 'Guardando...' : 'Guardar Todos en Base de Datos'}
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">RUT Beneficiario</th>
                                    <th className="px-4 py-3">Fecha Emisión</th>
                                    <th className="px-4 py-3">N° Bono</th>
                                    <th className="px-4 py-3">Monto</th>
                                    <th className="px-4 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosExtraidos.map((bono, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900">{bono.rut_beneficiario || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">{bono.fecha_emision || '-'}</td>
                                        <td className="px-4 py-3 text-blue-600 font-mono font-medium">{bono.numero_bono || '-'}</td>
                                        <td className="px-4 py-3 font-bold text-emerald-600">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(bono.monto || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => handleGuardarBono(bono, index)}
                                                disabled={guardando}
                                                className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Guardar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}