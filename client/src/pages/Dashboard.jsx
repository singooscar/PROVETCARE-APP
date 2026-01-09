import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MessageCircle, PawPrint } from 'lucide-react';
import VetDashboard from './VetDashboard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Si es veterinario/admin, mostrar Dashboard específico
    if (user?.role === 'admin') {
        return <VetDashboard />;
    }

    const cards = [
        { title: 'Calendario', icon: CalendarIcon, path: '/calendar', color: 'bg-blue-500' },
        { title: 'Mis Mascotas', icon: PawPrint, path: '/pets', color: 'bg-green-500' },
        { title: 'Chat', icon: MessageCircle, path: '/chat', color: 'bg-purple-500' },
    ];

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <button
                            key={card.path}
                            onClick={() => navigate(card.path)}
                            className={`${card.color} text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col items-center justify-center`}
                        >
                            <card.icon size={48} className="mb-4" />
                            <h3 className="text-2xl font-bold">{card.title}</h3>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
