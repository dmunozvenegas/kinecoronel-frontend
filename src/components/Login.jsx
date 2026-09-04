import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // Estado para controlar el giro 3D
    const [isFlipped, setIsFlipped] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        
        try {
            const respuesta = await axios.post('/api/auth/login', { email, password });
            const { usuario, token } = respuesta.data;
            
            login(usuario, token);
            navigate('/pacientes'); 
            
        } catch (err) {
            console.error("Error en login:", err);
            setError('Credenciales incorrectas. Por favor, intenta nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const handleRecoverySubmit = (e) => {
        e.preventDefault();
        // Aquí irá tu lógica futura de recuperación de contraseña
        alert(`Se enviaría un enlace a: ${email}`);
    };

    return (
        // Contenedor principal con la perspectiva 3D activada
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 [perspective:1000px]">
            
            {/* Contenedor que rota (Maneja la física del giro) */}
            <div 
                className={`relative max-w-md w-full transition-all duration-700 [transform-style:preserve-3d] ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
            >
                
                {/* ========================================== */}
                {/* CARA FRONTAL: LOGIN (Tu código original)   */}
                {/* ========================================== */}
<div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 [-webkit-backface-visibility:hidden] [backface-visibility:hidden] relative">                    
                    <div className="text-center mb-8">
                        <img 
                            src="/logo/logo-original.jpg" 
                            alt="Logo KineCoronel" 
                            className="h-24 w-auto mx-auto mb-4 object-contain"
                            onError={(e) => e.target.style.display = 'none'}
                        /> 
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all bg-yellow-50/50"
                                placeholder="ejemplo@kinecoronel.cl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Contraseña
                            </label>
                            <input 
                                type="password" 
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all bg-yellow-50/50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={cargando}
                            className={`w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md ${cargando ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                    
                    {/* Botón para activar el giro */}
                    <div className="mt-6 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsFlipped(true)}
                            className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* CARA TRASERA: RECUPERAR CONTRASEÑA         */}
                {/* ========================================== */}
<div className="absolute top-0 left-0 w-full h-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]">                    
                    <div className="text-center mb-6">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Recuperar Acceso</h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Ingresa tu correo institucional y te enviaremos las instrucciones.
                        </p>
                    </div>

                    <form onSubmit={handleRecoverySubmit} className="space-y-6">
                        <div>
                            <input 
                                type="email" 
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all bg-yellow-50/50"
                                placeholder="ejemplo@kinecoronel.cl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-900 transition-colors shadow-md"
                        >
                            Enviar Enlace
                        </button>
                    </form>

                    {/* Botón para volver al login */}
                    <div className="mt-6 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsFlipped(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
                        >
                            ← Volver al inicio de sesión
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}