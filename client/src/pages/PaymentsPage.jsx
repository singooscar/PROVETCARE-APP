import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, CreditCard, Receipt, History, Plus,
    Check, X, Download, ArrowLeft, Calendar, User,
    TrendingUp, AlertCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

const PaymentsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history' | 'new'

    // Data states
    const [charges, setCharges] = useState([]);
    const [payments, setPayments] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);

    // Payment form
    const [selectedCharges, setSelectedCharges] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    // New charge form
    const [showNewCharge, setShowNewCharge] = useState(false);
    const [newCharge, setNewCharge] = useState({
        clientId: '',
        petId: '',
        description: '',
        amount: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Si es admin, obtener todos los cargos y clientes
            if (user.role === 'admin') {
                const [chargesRes, paymentsRes, clientsRes] = await Promise.all([
                    api.get('/billing/admin/all-charges'),
                    api.get('/billing/admin/all-payments'),
                    api.get('/admin/clients-pets')
                ]);
                setCharges(chargesRes.data || []);
                setPayments(paymentsRes.data || []);
                setClients(clientsRes.data.data || []);
            } else {
                // Si es cliente, solo sus propios datos
                const [chargesRes, historyRes] = await Promise.all([
                    api.get(`/billing/pending/${user.id}`),
                    api.get(`/billing/history/${user.id}`)
                ]);
                setCharges(chargesRes.data || []);
                setPayments(historyRes.data.payments || []);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('Error al cargar información de pagos');
        } finally {
            setLoading(false);
        }
    };

    const toggleCharge = (id) => {
        setSelectedCharges(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedCharges(
            selectedCharges.length === charges.length ? [] : charges.map(c => c.id)
        );
    };

    const totalSelectedDebt = charges
        .filter(c => selectedCharges.includes(c.id))
        .reduce((acc, c) => acc + (parseFloat(c.total_amount) - parseFloat(c.paid_amount)), 0);

    useEffect(() => {
        if (selectedCharges.length > 0) {
            setPaymentAmount(totalSelectedDebt.toFixed(2));
        }
    }, [selectedCharges, totalSelectedDebt]);

    const handleProcessPayment = async (e) => {
        e.preventDefault();

        if (selectedCharges.length === 0) {
            toast.error('Selecciona al menos un cargo para pagar');
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }

        if (amount > totalSelectedDebt) {
            toast.error(`El monto no puede superar la deuda seleccionada ($${totalSelectedDebt.toFixed(2)})`);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/billing/pay', {
                clientId: user.role === 'admin' ? charges.find(c => selectedCharges.includes(c.id))?.client_id : user.id,
                chargeIds: selectedCharges,
                paymentAmount: amount,
                method: paymentMethod,
                reference,
                notes
            });

            if (res.data.success) {
                toast.success('✅ Pago procesado exitosamente');

                // Descargar recibo
                if (res.data.receiptUrl) {
                    window.open(`http://localhost:5000${res.data.receiptUrl}`, '_blank');
                }

                // Limpiar formulario
                setSelectedCharges([]);
                setPaymentAmount('');
                setReference('');
                setNotes('');

                // Recargar datos
                fetchData();
                setActiveTab('history');
            }
        } catch (error) {
            console.error('Error procesando pago:', error);
            toast.error('Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCharge = async (e) => {
        e.preventDefault();

        if (!newCharge.clientId || !newCharge.description || !newCharge.amount) {
            toast.error('Completa todos los campos requeridos');
            return;
        }

        try {
            await api.post('/billing/charge', {
                clientId: parseInt(newCharge.clientId),
                petId: newCharge.petId ? parseInt(newCharge.petId) : null,
                description: newCharge.description,
                amount: parseFloat(newCharge.amount)
            });

            toast.success('Cargo agregado correctamente');
            setNewCharge({ clientId: '', petId: '', description: '', amount: '' });
            setShowNewCharge(false);
            fetchData();
        } catch (error) {
            console.error('Error agregando cargo:', error);
            toast.error('Error al agregar el cargo');
        }
    };

    const selectedClient = clients.find(c => c.client_id === parseInt(newCharge.clientId));
    const clientPets = selectedClient?.pets || [];

    // Calculate statistics
    const totalPending = charges.reduce((acc, c) =>
        acc + (parseFloat(c.total_amount) - parseFloat(c.paid_amount)), 0
    );
    const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <DollarSign className="text-green-600" />
                                    Sistema de Pagos
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gestión de cobros y facturación
                                </p>
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <button
                                onClick={() => setShowNewCharge(!showNewCharge)}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
                            >
                                <Plus size={18} />
                                Nuevo Cargo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Pendiente</p>
                                <h3 className="text-3xl font-bold text-orange-600">
                                    ${totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-full">
                                <AlertCircle className="text-orange-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Cobrado</p>
                                <h3 className="text-3xl font-bold text-green-600">
                                    ${totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Cargos Activos</p>
                                <h3 className="text-3xl font-bold text-blue-600">{charges.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Charge Form */}
                {showNewCharge && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-green-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus className="text-green-600" size={20} />
                            Crear Nuevo Cargo
                        </h3>
                        <form onSubmit={handleAddCharge} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente *
                                </label>
                                <select
                                    value={newCharge.clientId}
                                    onChange={(e) => setNewCharge({ ...newCharge, clientId: e.target.value, petId: '' })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mascota (Opcional)
                                </label>
                                <select
                                    value={newCharge.petId}
                                    onChange={(e) => setNewCharge({ ...newCharge, petId: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    disabled={!newCharge.clientId}
                                >
                                    <option value="">Sin mascota específica</option>
                                    {clientPets.map(pet => (
                                        <option key={pet.id} value={pet.id}>
                                            {pet.name} ({pet.species})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción *
                                </label>
                                <input
                                    type="text"
                                    value={newCharge.description}
                                    onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                                    placeholder="Ej: Consulta General, Vacuna, Cirugía..."
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newCharge.amount}
                                        onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full pl-7 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowNewCharge(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Crear Cargo
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 py-4 px-6 font-medium transition flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <AlertCircle size={18} />
                            Cuentas por Cobrar
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-4 px-6 font-medium transition flex items-center justify-center gap-2 ${activeTab === 'history'
                                ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <History size={18} />
                            Historial de Pagos
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'pending' && (
                            <div>
                                {charges.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Check className="mx-auto text-green-200 mb-4" size={64} />
                                        <p className="text-gray-500 text-lg">No hay cargos pendientes</p>
                                        <p className="text-gray-400 text-sm mt-2">Todas las cuentas están al día</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Charges Table */}
                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-3 text-left">
                                                            <input
                                                                type="checkbox"
                                                                onChange={toggleAll}
                                                                checked={charges.length > 0 && selectedCharges.length === charges.length}
                                                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                            />
                                                        </th>
                                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Descripción</th>
                                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                                                        <th className="p-3 text-right text-sm font-semibold text-gray-600">Monto Total</th>
                                                        <th className="p-3 text-right text-sm font-semibold text-gray-600">Saldo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {charges.map(charge => {
                                                        const saldo = parseFloat(charge.total_amount) - parseFloat(charge.paid_amount);
                                                        return (
                                                            <tr key={charge.id} className="hover:bg-gray-50 transition">
                                                                <td className="p-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedCharges.includes(charge.id)}
                                                                        onChange={() => toggleCharge(charge.id)}
                                                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                                    />
                                                                </td>
                                                                <td className="p-3">
                                                                    <p className="font-medium text-gray-800">{charge.client_name || 'Cliente'}</p>
                                                                    {charge.pet_name && (
                                                                        <p className="text-xs text-gray-500">{charge.pet_name}</p>
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
                                                                    <p className="text-gray-800">{charge.description}</p>
                                                                    {charge.status === 'PARTIAL' && (
                                                                        <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                                                            Pago Parcial
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-gray-500 text-sm">
                                                                    {format(new Date(charge.created_at), 'dd MMM yyyy', { locale: es })}
                                                                </td>
                                                                <td className="p-3 text-right text-gray-400">
                                                                    ${parseFloat(charge.total_amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="p-3 text-right font-bold text-orange-600">
                                                                    ${saldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Payment Form */}
                                        {selectedCharges.length > 0 && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <CreditCard className="text-green-600" />
                                                    Procesar Pago
                                                </h4>
                                                <form onSubmit={handleProcessPayment}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Monto a Pagar
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-3 text-green-600 font-bold">$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={paymentAmount}
                                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                                    className="w-full pl-8 p-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                                                                    required
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Total seleccionado: ${totalSelectedDebt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Método de Pago
                                                            </label>
                                                            <select
                                                                value={paymentMethod}
                                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                                className="w-full p-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                            >
                                                                <option value="cash">💵 Efectivo</option>
                                                                <option value="card">💳 Tarjeta</option>
                                                                <option value="transfer">🏦 Transferencia</option>
                                                                <option value="check">📝 Cheque</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Referencia (Opcional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={reference}
                                                                onChange={(e) => setReference(e.target.value)}
                                                                placeholder="Nro. de operación, voucher..."
                                                                className="w-full p-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <span className="animate-spin">⏳</span>
                                                                Procesando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard size={20} />
                                                                Procesar Pago de ${parseFloat(paymentAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                            </>
                                                        )}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div>
                                {payments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <History className="mx-auto text-gray-200 mb-4" size={64} />
                                        <p className="text-gray-500 text-lg">No hay pagos registrados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {payments.map(payment => (
                                            <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-green-50 rounded-full">
                                                            <Receipt className="text-green-600" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">Pago #{payment.id}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(payment.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                    {payment.method === 'cash' ? '💵 Efectivo' :
                                                                        payment.method === 'card' ? '💳 Tarjeta' :
                                                                            payment.method === 'transfer' ? '🏦 Transferencia' : payment.method}
                                                                </span>
                                                                {payment.reference && (
                                                                    <span className="text-xs text-gray-500">Ref: {payment.reference}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-green-600">
                                                            ${parseFloat(payment.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        {payment.receipt_url && (
                                                            <a
                                                                href={`http://localhost:5000${payment.receipt_url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                                                            >
                                                                <Download size={14} />
                                                                Descargar Recibo
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
