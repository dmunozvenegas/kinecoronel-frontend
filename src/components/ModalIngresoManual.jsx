// Formulario de "Ingreso Manual" de un bono Fonasa.
// Componente presentacional: recibe los datos, el handler de cada campo (con su
// máscara ya aplicada en el padre) y los callbacks de enviar/cerrar.
export default function ModalIngresoManual({ datos, guardando, onCambioCampo, onEnviar, onCerrar }) {
    const claseBaseInput =
        'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Ingreso Manual de Bono</h3>

                <form onSubmit={onEnviar} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">RUT Beneficiario</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: 12345678-9"
                            className={claseBaseInput}
                            value={datos.rut_beneficiario}
                            onChange={(e) => onCambioCampo('rut_beneficiario', e.target.value)}
                            maxLength={10}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Emisión</label>
                        <input
                            type="text"
                            required
                            placeholder="DD-MM-YYYY"
                            className={claseBaseInput}
                            value={datos.fecha_emision}
                            onChange={(e) => onCambioCampo('fecha_emision', e.target.value)}
                            maxLength={10}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">N° Bono</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: 4500123456"
                            className={claseBaseInput}
                            value={datos.numero_bono}
                            onChange={(e) => onCambioCampo('numero_bono', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Monto ($)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-2 text-gray-500 font-bold">$</span>
                            <input
                                type="text"
                                required
                                placeholder="12.500"
                                className={`${claseBaseInput} pl-8`}
                                value={datos.monto}
                                onChange={(e) => onCambioCampo('monto', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            className={`px-5 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors ${guardando ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {guardando ? 'Guardando...' : 'Guardar Bono'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}