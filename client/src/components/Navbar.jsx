import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, PawPrint, MessageCircle, LogOut, ArrowLeft } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const showBackButton = location.pathname !== '/dashboard';

    return (
        <nav className="bg-white shadow-md border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo y Back Button */}
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Volver"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                        )}
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="text-2xl">🐾</div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                PROVETCARE
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/dashboard')
                                    ? 'bg-blue-100 text-blue-600 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Home size={20} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/calendar"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/calendar')
                                    ? 'bg-blue-100 text-blue-600 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Calendar size={20} />
                            <span>Calendario</span>
                        </Link>

                        <Link
                            to="/pets"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/pets')
                                    ? 'bg-blue-100 text-blue-600 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <PawPrint size={20} />
                            <span>Mis Mascotas</span>
                        </Link>

                        <Link
                            to="/chat"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/chat')
                                    ? 'bg-blue-100 text-blue-600 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <MessageCircle size={20} />
                            <span>Chat</span>
                        </Link>
                    </div>

                    {/* User Info y Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut size={20} />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t">
                <div className="flex items-center justify-around py-2">
                    <Link
                        to="/dashboard"
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Home size={20} />
                        <span className="text-xs">Inicio</span>
                    </Link>

                    <Link
                        to="/calendar"
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive('/calendar') ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Calendar size={20} />
                        <span className="text-xs">Citas</span>
                    </Link>

                    <Link
                        to="/pets"
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive('/pets') ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <PawPrint size={20} />
                        <span className="text-xs">Mascotas</span>
                    </Link>

                    <Link
                        to="/chat"
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive('/chat') ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <MessageCircle size={20} />
                        <span className="text-xs">Chat</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
