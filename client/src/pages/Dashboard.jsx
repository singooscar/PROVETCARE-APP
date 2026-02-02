import { useAuth } from '../context/AuthContext';
import VetDashboard from './VetDashboard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
    const { user } = useAuth();

    // Si es veterinario/admin, mostrar Dashboard específico
    if (user?.role === 'admin') {
        return <VetDashboard />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span>👋</span> Hola, {user?.name || 'Cliente'}
                        </h1>
                        <p className="text-gray-600 mt-1">Bienvenido a tu panel de control de ProVetCare</p>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                        {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Banner Area */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                PROVETCARE
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                Somos su aliado de confianza en el cuidado integral de sus mascotas.
                                Nuestro compromiso es brindar atención veterinaria de vanguardia con calidez humana,
                                asegurando el bienestar y la salud de quienes más ama.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                                    🏥 Medicina General
                                </div>
                                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                                    💉 Vacunación
                                </div>
                                <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold">
                                    🦷 Odontología
                                </div>
                            </div>
                        </div>

                        {/* Services Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                                    <span className="text-2xl">🚑</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Emergencias 24/7</h3>
                                <p className="text-gray-500 text-sm">
                                    Atención prioritaria para situaciones críticas en cualquier momento del día.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                    <span className="text-2xl">🧪</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Laboratorio Clínico</h3>
                                <p className="text-gray-500 text-sm">
                                    Resultados precisos y rápidos con equipos de última tecnología.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Horarios de Atención</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex justify-between">
                                    <span>Lunes - Viernes</span>
                                    <span className="font-semibold">8:00 AM - 8:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Sábados</span>
                                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Domingos</span>
                                    <span className="font-semibold text-green-600">Solo Urgencias</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                            <h3 className="font-bold text-lg mb-2">¿Necesita ayuda?</h3>
                            <p className="text-blue-100 text-sm mb-4">
                                Contáctenos para agendar una cita o resolver sus dudas.
                            </p>
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                <span className="text-2xl">📞</span>
                                <div>
                                    <p className="text-xs text-blue-200 uppercase">Línea Directa</p>
                                    <p className="font-bold font-mono text-lg">+1 234 567 890</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
