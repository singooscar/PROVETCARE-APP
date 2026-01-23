import React, { useState, useEffect } from 'react';
import { Check, DollarSign, FileText, Calendar, CreditCard, AlertCircle, Clock, History } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CheckoutPanel = ({ clientId, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
    const [charges, setCharges] = useState([]);
    const [history, setHistory] = useState({ payments: [], paidCharges: [] });
    const [loading, setLoading] = useState(false);

    // Payment Form
    const [selectedCharges, setSelectedCharges] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    // Add Charge Form
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [newCharge, setNewCharge] = useState({ description: '', amount: '' });

    useEffect(() => {
        if (clientId) {
            fetchCharges();
            fetchHistory();
        }
    }, [clientId]);

    const fetchCharges = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/billing/pending/${clientId}`);
            setCharges(res.data);
        } catch (error) {
            toast.error('Error cargando cuentas por cobrar');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/billing/history/${clientId}`);
            setHistory(res.data);
        } catch (error) {
            console.error('Error loading history', error);
        }
    };

    // --- Logic for Selection ---
    const toggleCharge = (id) => {
        setSelectedCharges(prev => {
            if (prev.includes(id)) return prev.filter(c => c !== id);
            return [...prev, id];
        });
    };

    const toggleAll = () => {
        if (selectedCharges.length === charges.length) {
            setSelectedCharges([]);
        } else {
            setSelectedCharges(charges.map(c => c.id));
        }
    };

    const handleAddCharge = async (e) => {
        e.preventDefault();
        if (!newCharge.description || !newCharge.amount) return;

        try {
            await api.post('/billing/charge', {
                clientId,
                description: newCharge.description,
                amount: parseFloat(newCharge.amount)
            });
            toast.success('Cargo agregado');
            setNewCharge({ description: '', amount: '' });
            setShowAddCharge(false);
            fetchCharges();
        } catch (error) {
            toast.error('Error agregando cargo');
        }
    };


    // Calculate totals
    const totalSelectedDebt = charges
        .filter(c => selectedCharges.includes(c.id))
        .reduce((acc, c) => acc + (parseFloat(c.total_amount) - parseFloat(c.paid_amount)), 0);

    // Initial Payment Amount effect
    useEffect(() => {
        // If user hasn't manually edited the amount, auto-fill with selected total
        // Simple heuristic: set amount to totalSelectedDebt
        setPaymentAmount(totalSelectedDebt > 0 ? totalSelectedDebt.toString() : '');
    }, [selectedCharges]); // But be careful not to overwrite user input if they want partial.

    // Better: only set if they haven't typed? Or just let them verify.
    // Let's settle on: Updating selection updates default amount. User can override.

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
            toast.error(`El monto no puede superar la deuda seleccionada ($${totalSelectedDebt})`);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/billing/pay', {
                clientId,
                chargeIds: selectedCharges,
                paymentAmount: amount,
                method: paymentMethod,
                reference,
                notes
            }, { responseType: 'blob' }); // Expecting PDF blob? Or JSON with URL?

            // Actually controller returns JSON with URL in my implementaton?
            // Wait, generated controller returns: res.json({ success: true, message.., receiptUrl })
            // Ah, so responseType shouldn't be blob for the main POST.
            // Let me re-check controller.
            // Controller: res.json({ success: true... })
            // But wait, the previous `InvoicePanel` used blob.
            // The `billingController` generates file but returns JSON URL.
            // So we need to download it separately.

            // Re-read controller: 
            // res.json({ success: true, message: 'Pago procesado correctamente', receiptUrl: relativePath });
            // OK, so normal POST.

        } catch (error) {
            // Wait, I need to fetch correctly. catch below.
        }

        // Let's fix the API call structure
    };

    const realSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.post('/billing/pay', {
                clientId,
                chargeIds: selectedCharges,
                paymentAmount: parseFloat(paymentAmount),
                method: paymentMethod,
                reference,
                notes
            });

            if (res.data.success) {
                toast.success('Pago registrado exitosamente');
                // Download Receipt
                if (res.data.receiptUrl) {
                    window.open(`http://localhost:5000${res.data.receiptUrl}`, '_blank');
                }

                // Refresh
                fetchCharges();
                fetchHistory();
                setSelectedCharges([]);
                setPaymentAmount('');
                setReference('');
                if (onSuccess) onSuccess();
            }

        } catch (error) {
            console.error(error);
            toast.error('Error procesando el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg min-h-[500px] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <DollarSign size={18} /> Por Cobrar
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={18} /> Historial de Pagos
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1">
                {activeTab === 'pending' && (
                    <div className="flex flex-col h-full">
                        {/* Add Charge Toolbar */}
                        <div className="mb-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {!showAddCharge ? (
                                <button
                                    onClick={() => setShowAddCharge(true)}
                                    className="text-sm flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded transition"
                                >
                                    <DollarSign size={16} /> + Nuevo Cargo
                                </button>
                            ) : (
                                <form onSubmit={handleAddCharge} className="flex gap-2 items-center w-full">
                                    <input
                                        type="text"
                                        placeholder="Descripción (ej. Vacuna)"
                                        className="flex-1 text-sm p-1.5 border rounded"
                                        value={newCharge.description}
                                        onChange={e => setNewCharge({ ...newCharge, description: e.target.value })}
                                        autoFocus
                                    />
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full text-sm pl-4 p-1.5 border rounded"
                                            value={newCharge.amount}
                                            onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700">
                                        <Check size={16} />
                                    </button>
                                    <button type="button" onClick={() => setShowAddCharge(false)} className="text-gray-500 p-1.5 hover:text-red-500">
                                        <AlertCircle size={16} />
                                    </button>
                                </form>
                            )}
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Total Pendiente</p>
                                <p className="font-bold text-gray-700">
                                    ${charges.reduce((acc, c) => acc + (parseFloat(c.total_amount) - parseFloat(c.paid_amount)), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {charges.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-2 text-green-200" />
                                <p>No hay deudas pendientes</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-auto flex-1 max-h-[300px] mb-4 border rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                            <tr>
                                                <th className="p-3 w-10">
                                                    <input
                                                        type="checkbox"
                                                        onChange={toggleAll}
                                                        checked={charges.length > 0 && selectedCharges.length === charges.length}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </th>
                                                <th className="p-3">Concepto</th>
                                                <th className="p-3">Mascota</th>
                                                <th className="p-3">Fecha</th>
                                                <th className="p-3 text-right">Monto</th>
                                                <th className="p-3 text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {charges.map(charge => {
                                                const saldo = parseFloat(charge.total_amount) - parseFloat(charge.paid_amount);
                                                return (
                                                    <tr key={charge.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCharges.includes(charge.id)}
                                                                onChange={() => toggleCharge(charge.id)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="p-3 font-medium">
                                                            {charge.description}
                                                            {charge.status === 'PARTIAL' && (
                                                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Parcial</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-500">{charge.pet_name || '-'}</td>
                                                        <td className="p-3 text-gray-500">{format(new Date(charge.created_at), 'dd/MM/yyyy')}</td>
                                                        <td className="p-3 text-right text-gray-400">${parseFloat(charge.total_amount).toLocaleString()}</td>
                                                        <td className="p-3 text-right font-bold text-gray-800">${saldo.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Payment Area */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-sm text-blue-700 font-medium mb-1">Monto a Pagar</p>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-blue-500 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    className="pl-7 pr-3 py-2 w-40 text-lg font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-xs text-blue-400 mt-1">
                                                Total Seleccionado: <span className="font-semibold">${totalSelectedDebt.toLocaleString()}</span>
                                            </p>
                                        </div>

                                        <div className="flex-1 ml-6 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Método</label>
                                                <select
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-full text-sm p-2 border border-blue-200 rounded-lg bg-white"
                                                >
                                                    <option value="cash">Efectivo</option>
                                                    <option value="card">Tarjeta Débito/Crédito</option>
                                                    <option value="transfer">Transferencia</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Referencia</label>
                                                <input
                                                    type="text"
                                                    value={reference}
                                                    onChange={(e) => setReference(e.target.value)}
                                                    placeholder="Nro. Voucher / Nota"
                                                    className="w-full text-sm p-2 border border-blue-200 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={realSubmit}
                                        disabled={loading || selectedCharges.length === 0}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2"
                                    >
                                        {loading ? <span className="animate-pulse">Procesando Pago...</span> : (
                                            <>
                                                <CreditCard size={20} /> Pagar ${parseFloat(paymentAmount || 0).toLocaleString()}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="h-full overflow-y-auto pr-2 space-y-4">
                        {/* Payments List */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FileText size={16} /> Últimos Pagos Realizados
                            </h4>
                            {history.payments.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No hay pagos registrados</p>
                            ) : (
                                <div className="space-y-2">
                                    {history.payments.map(pay => (
                                        <div key={pay.id} className="bg-white p-3 border rounded-lg flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">Pago #{pay.id}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(pay.created_at), 'dd MMM yyyy, HH:mm', { locale: es })} • {pay.method}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">${parseFloat(pay.amount).toLocaleString()}</p>
                                                {pay.receipt_url && (
                                                    <a
                                                        href={`http://localhost:5000${pay.receipt_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-500 hover:underline flex items-center justify-end gap-1 mt-1"
                                                    >
                                                        <FileText size={12} /> Ver Recibo
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Paid Charges List */}
                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Clock size={16} /> Servicios Pagados (Detalle)
                            </h4>
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-400 bg-gray-50">
                                    <tr>
                                        <th className="p-2">Fecha</th>
                                        <th className="p-2">Descripción</th>
                                        <th className="p-2 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.paidCharges.length === 0 ? (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sin registros</td></tr>
                                    ) : (
                                        history.paidCharges.map(charge => (
                                            <tr key={charge.id} className="border-b">
                                                <td className="p-2 text-gray-500">{format(new Date(charge.created_at), 'dd/MM/yy')}</td>
                                                <td className="p-2">{charge.description}</td>
                                                <td className="p-2 text-right font-medium text-gray-600">${parseFloat(charge.total_amount).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function CheckCircle({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}

export default CheckoutPanel;
