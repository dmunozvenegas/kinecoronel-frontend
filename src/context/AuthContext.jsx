import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. CONEXIÓN GLOBAL HACIA EL BACKEND REAL
// Obliga a que cualquier petición de Axios apunte nativamente a tu VPS
axios.defaults.baseURL = 'https://https://kinecoronel-backend.onrender.com';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const tokenGuardado = localStorage.getItem('token');
        const usuarioGuardado = localStorage.getItem('usuario');
        
        if (tokenGuardado && usuarioGuardado) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
                // Aplicamos el token a las cabeceras globales
                axios.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
            } catch (error) {
                console.error("Error al leer la sesión local. Limpiando caché...");
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
            }
        }
        setCargando(false);
    }, []);

    const login = (datosUsuario, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(datosUsuario));
        setUsuario(datosUsuario);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
            {children}
        </AuthContext.Provider>
    );
};