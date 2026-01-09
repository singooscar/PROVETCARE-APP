import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Calendar as CalendarIcon, Clock, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function Calendar() {
    const [appointments, setAppointments] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formData, setFormData] = useState({
        pet_id: '',
        appointment_date: '',
        appointment_time: '',
        service_type: '',
        notes: ''
    });

    const [services, setServices] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('local'); // 'local' | 'online'
    const [selectedServicePrice, setSelectedServicePrice] = useState(0);

    useEffect(() => {
        fetchAppointments();
        fetchPets();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (error) {
            console.error('Error cargando servicios:', error);
        }
    };

    const handleServiceChange = (e) => {
        const serviceName = e.target.value;
        const service = services.find(s => s.name === serviceName);
        setFormData({ ...formData, service_type: serviceName });
        setSelectedServicePrice(service ? service.base_price : 0);
    };

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            setAppointments(response.data.data?.appointments || response.data);
        } catch (error) {
            toast.error('Error al cargar citas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPets = async () => {
        try {
            const response = await api.get('/pets');
            setPets(response.data);
        } catch (error) {
            console.error('Error al cargar mascotas:', error);
        }
    };

    const handleSelectSlot = ({ start }) => {
        setSelectedDate(start);
        setFormData({
            ...formData,
            appointment_date: format(start, 'yyyy-MM-dd'),
            appointment_time: '10:00'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.pet_id) {
            toast.error('Debes seleccionar una mascota');
            return;
        }

        try {
            // Adjuntar preferencia de pago a la nota
            const paymentNote = ` | Pago: ${paymentMethod === 'online' ? 'ONLINE (Pendiente)' : 'EN CLÍNICA'}`;
            const finalNotes = (formData.notes || '') + paymentNote;

            await api.post('/appointments/request', {
                petId: parseInt(formData.pet_id),
                appointmentDate: formData.appointment_date,
                appointmentTime: formData.appointment_time,
                serviceType: formData.service_type,
                notes: finalNotes
            });

            toast.success('Cita solicitada correctamente.');
            setShowModal(false);
            resetForm();
            fetchAppointments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al solicitar cita');
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('¿Estás seguro de cancelar esta cita?')) return;

        try {
            await api.patch(`/appointments/${id}/cancel`);
            toast.success('Cita cancelada');
            fetchAppointments();
        } catch (error) {
            toast.error('Error al cancelar cita');
        }
    };

    const resetForm = () => {
        setFormData({
            pet_id: '',
            appointment_date: '',
            appointment_time: '',
            service_type: '',
            notes: ''
        });
        setPaymentMethod('local');
        setSelectedServicePrice(0);
        setSelectedDate(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    // Convertir citas a eventos del calendario
    const events = appointments.map(apt => {
        const dateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        return {
            id: apt.id,
            title: `${apt.pet_name} - ${apt.service_type}`,
            start: dateTime,
            end: new Date(dateTime.getTime() + 60 * 60 * 1000), // 1 hora de duración
            resource: apt
        };
    });

    // Estilos para los eventos según el estado
    const eventStyleGetter = (event) => {
        const status = event.resource.status;
        let backgroundColor = '#3174ad';

        switch (status) {
            case 'approved':
            case 'confirmed':
                backgroundColor = '#10b981';
                break;
            case 'pending':
            case 'requested':
                backgroundColor = '#f59e0b';
                break;
            case 'rejected':
                backgroundColor = '#ef4444';
                break;
            case 'cancelled':
                backgroundColor = '#6b7280';
                break;
            case 'completed':
                backgroundColor = '#8b5cf6';
                break;
            case 'under_review':
                backgroundColor = '#eab308';
                break;
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const getStatusBadge = (status) => {
        const badges = {
            requested: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Solicitada' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' },
            under_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En Revisión' },
            confirmed: { color: 'bg-green-100 text-green-800', icon: Check, text: 'Confirmada' },
            approved: { color: 'bg-green-100 text-green-800', icon: Check, text: 'Aprobada' },
            rejected: { color: 'bg-red-100 text-red-800', icon: X, text: 'Rechazada' },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: X, text: 'Cancelada' },
            completed: { color: 'bg-purple-100 text-purple-800', icon: Check, text: 'Completada' }
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                <Icon size={12} />
                {badge.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Cargando calendario...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Calendario de Citas</h1>
                        <p className="text-gray-600">Gestiona las citas de tus mascotas</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <PlusCircle size={20} />
                        Nueva Cita
                    </button>
                </div>
            </div>

            {/* Calendario */}
            <div className="max-w-7xl mx-auto">
                <div className="card p-6 mb-6" style={{ height: '600px' }}>
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        culture="es"
                        selectable
                        onSelectSlot={handleSelectSlot}
                        eventPropGetter={eventStyleGetter}
                        messages={{
                            next: "Siguiente",
                            previous: "Anterior",
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                            agenda: "Agenda",
                            date: "Fecha",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "No hay citas en este rango",
                            showMore: (total) => `+ Ver más (${total})`
                        }}
                    />
                </div>

                {/* Lista de Citas */}
                <div className="card">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Mis Citas</h2>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="p-12 text-center">
                            <CalendarIcon size={64} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No tienes citas programadas
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Agenda una cita para el cuidado de tus mascotas
                            </p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn btn-primary mx-auto"
                            >
                                Crear Primera Cita
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y text-left">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {apt.pet_name}
                                                </h3>
                                                {getStatusBadge(apt.status)}
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p className="flex items-center gap-2">
                                                    <CalendarIcon size={16} />
                                                    {format(new Date(apt.appointment_date), 'dd/MM/yyyy', { locale: es })}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Clock size={16} />
                                                    {apt.appointment_time}
                                                </p>
                                                <p className="font-semibold text-gray-700">
                                                    Servicio: {apt.service_type}
                                                </p>
                                                {apt.notes && (
                                                    <p className="italic">Notas: {apt.notes}</p>
                                                )}
                                                {apt.admin_notes && (
                                                    <p className="text-blue-600">
                                                        <AlertCircle size={14} className="inline mr-1" />
                                                        Nota del veterinario: {apt.admin_notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {apt.status === 'pending' || apt.status === 'requested' ? (
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="btn bg-red-500 hover:bg-red-600 text-white text-sm ml-4"
                                            >
                                                Cancelar
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Nueva Cita */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Nueva Cita Veterinaria
                            </h2>

                            {pets.length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
                                    <p className="text-gray-700 mb-4">
                                        Primero debes registrar una mascota para poder agendar una cita
                                    </p>
                                    <button
                                        onClick={handleCloseModal}
                                        className="btn btn-secondary"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Mascota <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.pet_id}
                                            onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Seleccionar mascota...</option>
                                            {pets.map(pet => (
                                                <option key={pet.id} value={pet.id}>
                                                    {pet.name} ({pet.species})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Fecha <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.appointment_date}
                                                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                                min={format(new Date(), 'yyyy-MM-dd')}
                                                className="input w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Hora <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={formData.appointment_time}
                                                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                                className="input w-full"
                                            >
                                                <option value="08:00">08:00 AM</option>
                                                <option value="09:00">09:00 AM</option>
                                                <option value="10:00">10:00 AM</option>
                                                <option value="11:00">11:00 AM</option>
                                                <option value="12:00">12:00 PM</option>
                                                <option value="14:00">02:00 PM</option>
                                                <option value="15:00">03:00 PM</option>
                                                <option value="16:00">04:00 PM</option>
                                                <option value="17:00">05:00 PM</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tipo de Servicio <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.service_type}
                                            onChange={handleServiceChange}
                                            className="input w-full"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {services.map(srv => (
                                                <option key={srv.id} value={srv.name}>
                                                    {srv.name} - ${srv.base_price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* SECCIÓN DE PRECIOS Y PAGO */}
                                    {selectedServicePrice > 0 && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-gray-700 font-medium">Costo Base Estimado:</span>
                                                <span className="text-xl font-bold text-blue-700">${selectedServicePrice}</span>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="block text-sm font-semibold text-gray-700">Método de Pago</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div
                                                        className={`border rounded-lg p-3 cursor-pointer transition ${paymentMethod === 'local' ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-gray-200 bg-gray-50'}`}
                                                        onClick={() => setPaymentMethod('local')}
                                                    >
                                                        <div className="font-bold text-gray-800">En Clínica</div>
                                                        <div className="text-xs text-gray-500">Pagar el día de la cita</div>
                                                    </div>
                                                    <div
                                                        className={`border rounded-lg p-3 cursor-pointer transition ${paymentMethod === 'online' ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-gray-200 bg-gray-50'}`}
                                                        onClick={() => setPaymentMethod('online')}
                                                    >
                                                        <div className="font-bold text-gray-800">Online Ahora</div>
                                                        <div className="text-xs text-gray-500">Tarjeta Crédito/Débito (Mock)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Notas adicionales
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="input w-full"
                                            rows="3"
                                            placeholder="Describe el motivo de la consulta..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="btn btn-secondary flex-1"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1"
                                        >
                                            Agendar Cita
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
