import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ResumenFinanciero({ bonos }) {
    // Procesamos los datos matemáticamente para los KPIs y el gráfico
    const { totalDinero, totalBonos, datosGrafico } = useMemo(() => {
        if (!bonos || bonos.length === 0) return { totalDinero: 0, totalBonos: 0, datosGrafico: [] };

        let dinero = 0;
        const agrupadoPorMes = {};

        const nombresMeses = {
            '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
            '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
        };

        bonos.forEach(bono => {
            // Sumamos el total
            const monto = Number(bono.monto) || 0;
            dinero += monto;

            // Agrupamos por mes para el gráfico (Asumiendo formato DD-MM-YYYY)
            const partesFecha = bono.fecha_emision.split('-');
            if (partesFecha.length === 3) {
                const mes = partesFecha[1];
                const anio = partesFecha[2];
                const etiqueta = `${nombresMeses[mes]} ${anio}`;

                if (!agrupadoPorMes[etiqueta]) {
                    agrupadoPorMes[etiqueta] = 0;
                }
                agrupadoPorMes[etiqueta] += monto;
            }
        });

        // Convertimos el objeto a un array para Recharts
        const grafico = Object.keys(agrupadoPorMes).map(key => ({
            mes: key,
            Recaudacion: agrupadoPorMes[key]
        })).reverse(); // Invertimos para mostrar del más antiguo al más nuevo

        return {
            totalDinero: dinero,
            totalBonos: bonos.length,
            datosGrafico: grafico
        };
    }, [bonos]);

    // Formateador para mostrar dinero con puntos (ej: $12.500)
    const formatoDinero = (valor) => {
        return '$' + valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    if (!bonos || bonos.length === 0) return null;

    return (
        <div className="mb-8">
            {/* Tarjetas de KPI (Indicadores Clave) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-blue-600 mb-1">Total Recaudado</p>
                        <h3 className="text-3xl font-black text-gray-800">{formatoDinero(totalDinero)}</h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-100 p-6 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-green-600 mb-1">Bonos Procesados</p>
                        <h3 className="text-3xl font-black text-gray-800">{totalBonos}</h3>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Evolución de Ingresos</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosGrafico} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tickFormatter={(valor) => `$${valor/1000}k`} 
                                tick={{fill: '#6b7280', fontSize: 12}}
                            />
                            <Tooltip 
                                formatter={(value) => [formatoDinero(value), 'Recaudado']}
                                cursor={{fill: '#f3f4f6'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                            />
                            <Bar dataKey="Recaudacion" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}