import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Calendar, TrendingUp, Settings, LogOut, Menu, X, Receipt } from 'lucide-react';

export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const usuarioStorage = localStorage.getItem('usuario');
    const usuario = usuarioStorage ? JSON.parse(usuarioStorage) : null;
    const nombreMostrar = usuario && usuario.nombre ? usuario.nombre : 'Usuario';
    
    let iniciales = 'KC';
    if (usuario && usuario.nombre) {
        const partes = usuario.nombre.split(' ');
        if (partes.length >= 2) {
            iniciales = `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
        } else {
            iniciales = usuario.nombre.substring(0, 2).toUpperCase();
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('usuario'); 
        navigate('/login'); 
    };

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/pacientes', icon: <Users size={20} />, label: 'Pacientes' },
        { path: '/ordenes', icon: <ClipboardList size={20} />, label: 'Órdenes Clínicas' },
        { path: '/agenda', icon: <Calendar size={20} />, label: 'Agenda' },
        { path: '/reportes', icon: <TrendingUp size={20} />, label: 'Reportes' },
        { path: '/bonos', icon: <Receipt size={20} />, label: 'Carga de Bonos' },
    ];

    return (
        /* Se agregó print:h-auto print:overflow-visible print:bg-white para evitar que el PDF salga cortado */
        <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block">
            
            {/* BOTÓN HAMBURGUESA PARA MÓVILES (Oculto al imprimir: print:hidden) */}
            <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 print:hidden">
                <div className="flex items-center gap-2">
                    <img src="/logo/logo-original.jpg" alt="Logo KineCoronel" className="h-10 w-auto object-contain" />
                </div>
                <button onClick={() => setMenuAbierto(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Menu size={24} />
                </button>
            </div>

            {/* FONDO OSCURO EN MÓVIL (Oculto al imprimir) */}
            {menuAbierto && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity print:hidden"
                    onClick={() => setMenuAbierto(false)}
                ></div>
            )}

            {/* SIDEBAR / MENÚ LATERAL (Oculto al imprimir: print:hidden) */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out print:hidden
                ${menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center shrink-0 h-16 md:h-auto">
                    <img src="/logo/logo-original.jpg" alt="Logo KineCoronel" className="h-10 md:h-12 w-auto object-contain" />
                    <button onClick={() => setMenuAbierto(false)} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-md">
                        <X size={20} />
                    </button>
                </div>

                <div className="md:hidden p-4 border-b border-gray-100 bg-blue-50/50 flex items-center gap-3 shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200 shrink-0">
                        {iniciales}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">Dr. {nombreMostrar}</p>
                        <p className="text-xs text-gray-500">Kinesiólogo</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActivo = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMenuAbierto(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActivo 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 space-y-1 shrink-0">
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        <Settings size={18} className="text-gray-400" /> Configuración
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} className="text-red-400" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL (Modificado para expandirse en la impresión) */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0 print:pt-0 print:overflow-visible print:block">
                
                {/* Header Superior - Oculto al imprimir: print:hidden */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 items-center justify-end shrink-0 hidden md:flex print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-700">Dr. {nombreMostrar}</p>
                            <p className="text-xs text-gray-500">Kinesiólogo</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
                            {iniciales}
                        </div>
                    </div>
                </header>

                {/* Área de Componentes (Sin scrolls al imprimir) */}
                <div className="flex-1 overflow-auto bg-gray-50 print:overflow-visible print:bg-white print:h-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}