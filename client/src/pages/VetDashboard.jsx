import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import PrescriptionPanel from '../components/PrescriptionPanel';
import {
    Calendar as CalendarIcon,
    Users,
    ClipboardList,
    CheckCircle,
    XCircle,
    Clock,
    PlusCircle,
    LogOut,
    Search,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VetDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Estados de datos
    const [stats, setStats] = useState({
        pending_requests: 0,
        under_review: 0,
        today_appointments: 0,
        total_clients: 0
    });
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]); // Clientes con mascotas para el select

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null); // Para panel de recetas

    // Formulario de Nueva Cita
    const [formData, setFormData] = useState({
        clientId: '',
        petId: '',
        appointmentDate: '',
        appointmentTime: '',
        serviceType: '',
        notes: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, appRes, clientsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/appointments'), // Admin ve todas
                api.get('/admin/clients-pets')
            ]);

            setStats(statsRes.data.data);
            setAppointments(appRes.data.data.appointments); // Asumiendo estructura de respuesta estandarizada
            setClients(clientsRes.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus, currentStatus) => {
        try {
            // Lógica específica del flujo A
            if (currentStatus === 'requested' && newStatus === 'under_review') {
                await api.patch(`/appointments/${appointmentId}/mark-review`);
                toast.success('Cita marcada "En Revisión"');
            } else if (newStatus === 'confirmed') {
                await api.patch(`/appointments/${appointmentId}/status`, {
                    status: 'confirmed',
                    adminNotes: 'Confirmada por veterinario'
                });
                toast.success('Cita confirmada exitosamente');
            } else if (newStatus === 'rejected') {
                if (!confirm('¿Estás seguro de rechazar esta cita?')) return;
                await api.patch(`/appointments/${appointmentId}/status`, {
                    status: 'rejected',
                    adminNotes: 'No disponible en este horario'
                });
                toast.success('Cita rechazada');
            }
            fetchDashboardData(); // Recargar datos
        } catch (error) {
            toast.error('Error al actualizar estado');
        }
    };

    const handleCreateFollowUp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/appointments/follow-up', formData);
            toast.success('Cita de control creada exitosamente');
            setShowFollowUpModal(false);
            setFormData({
                clientId: '',
                petId: '',
                appointmentDate: '',
                appointmentTime: '',
                serviceType: '',
                notes: ''
            });
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al crear cita');
        }
    };

    // Filtrado de citas
    const filteredAppointments = appointments.filter(apt => {
        if (filterStatus === 'all') return true;
        return apt.status === filterStatus;
    });

    // Encontrar mascotas del cliente seleccionado para el segundo select
    const selectedClientPets = clients.find(c => c.client_id === parseInt(formData.clientId))?.pets || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-primary-600">Cargando panel veterinario...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar Veterinario */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span>👨‍⚕️</span> Panel Veterinario
                        </h1>
                        <p className="text-gray-600 mt-1">Bienvenido, Dr. {user?.name}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                        {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Solicitudes Nuevas</p>
                            <h3 className="text-3xl font-bold text-blue-600">{stats.pending_requests}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600"><ClipboardList /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">En Revisión</p>
                            <h3 className="text-3xl font-bold text-yellow-600">{stats.under_review}</h3>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><Clock /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Citas para Hoy</p>
                            <h3 className="text-3xl font-bold text-green-600">{stats.today_appointments}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full text-green-600"><CalendarIcon /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Clientes</p>
                            <h3 className="text-3xl font-bold text-purple-600">{stats.total_clients}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Users /></div>
                    </div>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-2 items-center bg-white p-1 rounded-lg border shadow-sm">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterStatus('requested')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterStatus === 'requested' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Nuevas
                        </button>
                        <button
                            onClick={() => setFilterStatus('under_review')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterStatus === 'under_review' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            En Revisión
                        </button>
                        <button
                            onClick={() => setFilterStatus('confirmed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterStatus === 'confirmed' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Confirmadas
                        </button>
                    </div>

                    <button
                        onClick={() => setShowFollowUpModal(true)}
                        className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition"
                    >
                        <PlusCircle size={20} />
                        Nueva Cita de Control
                    </button>
                </div>

                {/* Appointments List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mascota / Dueño</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha y Hora</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{apt.pet_name}</div>
                                        <div className="text-sm text-gray-500">{apt.client_name || 'Cliente'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {format(new Date(apt.appointment_date), 'dd MMM yyyy', { locale: es })}
                                        </div>
                                        <div className="text-sm text-gray-500">{apt.appointment_time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                                            {apt.service_type}
                                        </span>
                                        {apt.created_by_admin && (
                                            <div className="mt-1 text-xs text-purple-600 flex items-center gap-1">
                                                <Users size={10} /> Control Médico
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={apt.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {/* Acciones dependientes del estado */}
                                        {apt.status === 'requested' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'under_review', apt.status)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 border border-yellow-200"
                                                    title="Marcar para revisión"
                                                >
                                                    <Clock size={14} /> Revisar
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'rejected', apt.status)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 border border-red-200"
                                                    title="Rechazar"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}

                                        {apt.status === 'under_review' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'confirmed', apt.status)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 border border-green-200"
                                                >
                                                    <CheckCircle size={14} /> Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'rejected', apt.status)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 border border-red-200"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}

                                        {(apt.status === 'confirmed' || apt.status === 'rejected') && (
                                            <div className="flex justify-end gap-2">
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => setSelectedAppointment(apt)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 shadow-sm"
                                                    >
                                                        <PlusCircle size={14} /> Gestión Médica
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredAppointments.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No hay citas que coincidan con el filtro.
                        </div>
                    )}
                </div>

                {/* Modal de Prescripción / Facturación */}
                {selectedAppointment && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <ClipboardList size={20} /> Gestión Médica: {selectedAppointment.pet_name}
                                    </h3>
                                    <p className="text-xs text-emerald-100">
                                        {selectedAppointment.service_type} - {selectedAppointment.client_name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="hover:bg-emerald-700 p-1 rounded transition"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="p-6">
                                <PrescriptionPanel
                                    appointmentId={selectedAppointment.id}
                                    petId={selectedAppointment.pet_id}
                                    onSuccess={() => {
                                        // Opcional: Cerrar modal o refrescar
                                        // setSelectedAppointment(null);
                                        fetchDashboardData();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Nueva Cita de Control */}
            {showFollowUpModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="bg-primary-600 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <PlusCircle size={20} /> Nueva Cita de Control
                            </h3>
                            <button onClick={() => setShowFollowUpModal(false)} className="hover:bg-primary-700 p-1 rounded">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFollowUp} className="p-6 space-y-4">
                            {/* Selección de Cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select
                                    className="input w-full"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value, petId: '' })}
                                    required
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.client_id} value={client.client_id}>
                                            {client.client_name} ({client.client_email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selección de Mascota (Dependiente) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mascota</label>
                                <select
                                    className="input w-full"
                                    value={formData.petId}
                                    onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
                                    required
                                    disabled={!formData.clientId}
                                >
                                    <option value="">Seleccionar mascota...</option>
                                    {selectedClientPets.map(pet => (
                                        <option key={pet.id} value={pet.id}>
                                            {pet.name} ({pet.species} - {pet.breed})
                                        </option>
                                    ))}
                                </select>
                                {formData.clientId && selectedClientPets.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Este cliente no tiene mascotas registradas.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={formData.appointmentDate}
                                        onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                        required
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        className="input w-full"
                                        value={formData.appointmentTime}
                                        onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio</label>
                                <select
                                    className="input w-full"
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Control Post-Operatorio">Control Post-Operatorio</option>
                                    <option value="Vacunación">Vacunación</option>
                                    <option value="Consulta de Seguimiento">Consulta de Seguimiento</option>
                                    <option value="Exámenes de Laboratorio">Exámenes de Laboratorio</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas Médicas</label>
                                <textarea
                                    className="input w-full"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Detalles sobre el control..."
                                ></textarea>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full">
                                    Confirmar Cita de Control
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente Helper para Badges
function StatusBadge({ status }) {
    const styles = {
        requested: 'bg-blue-100 text-blue-800 border-blue-200',
        under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        confirmed: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
        requested: 'Solicitada',
        under_review: 'En Revisión',
        confirmed: 'Confirmada',
        rejected: 'Rechazada',
        cancelled: 'Cancelada'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.cancelled}`}>
            {labels[status] || status}
        </span>
    );
}
