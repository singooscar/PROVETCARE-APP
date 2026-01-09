import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, FileText, Pill, DollarSign } from 'lucide-react';

const PrescriptionPanel = ({ appointmentId, petId, onSuccess }) => {
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Cargar inventario inicial (o buscar cuando escribe)
        const fetchInventory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/inventory?search=${search}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInventory(res.data);
            } catch (error) {
                console.error('Error cargando inventario:', error);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchInventory();
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [search]);

    const addItem = (item) => {
        // Verificar si ya está
        if (selectedItems.find(i => i.id === item.id)) {
            toast.error('Este ítem ya está en la lista');
            return;
        }
        setSelectedItems([...selectedItems, { ...item, quantity: 1, dosage: '1 cada 24h', duration: '3 días' }]);
    };

    const removeItem = (id) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const updateItem = (id, field, value) => {
        setSelectedItems(selectedItems.map(i =>
            i.id === id ? { ...i, [field]: value } : i
        ));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            toast.error('Agrega al menos un medicamento');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                appointmentId,
                petId,
                instructions,
                items: selectedItems
            };

            const res = await axios.post('http://localhost:5000/api/prescriptions', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Receta creada y costos agregados');
                setSelectedItems([]);
                setInstructions('');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error('Error al crear receta:', error);
            toast.error('Error al generar la receta');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0).toFixed(2);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Pill className="text-emerald-600" />
                Farmacia y Facturación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLUMNA IZQUIERDA: BUSCADOR */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Buscar Medicamento / Servicio</label>
                        <input
                            type="text"
                            placeholder="Escribe para buscar (ej: Amoxicilina)..."
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="h-64 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2">
                        {inventory.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center hover:bg-emerald-50 cursor-pointer transition"
                                onClick={() => addItem(item)}>
                                <div>
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">Stock: {item.stock} | ${item.unit_price}</p>
                                </div>
                                <Plus size={18} className="text-emerald-600" />
                            </div>
                        ))}
                        {inventory.length === 0 && <p className="text-center text-gray-400 py-4">No se encontraron productos.</p>}
                    </div>
                </div>

                {/* COLUMNA DERECHA: LISTA SELECCIONADA */}
                <div className="flex flex-col h-full">
                    <div className="bg-gray-50 p-4 rounded-lg flex-1 border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-3 flex justify-between">
                            Resumen de Receta
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <DollarSign size={16} /> Total: ${calculateTotal()}
                            </span>
                        </h4>

                        {selectedItems.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">
                                <FileText size={40} className="mx-auto mb-2 opacity-50" />
                                <p>Selecciona productos para comenzar</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-[300px] પ્ર-1">
                                {selectedItems.map((item) => (
                                    <div key={item.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm text-emerald-800">{item.name}</span>
                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <label className="block text-gray-400">Cant.</label>
                                                <input type="number" min="1" className="w-full border rounded p-1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400">Dosis</label>
                                                <input type="text" className="w-full border rounded p-1"
                                                    value={item.dosage}
                                                    onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400">Duración</label>
                                                <input type="text" className="w-full border rounded p-1"
                                                    value={item.duration}
                                                    onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600 block mb-1">Instrucciones Generales</label>
                        <textarea
                            className="w-full p-2 border rounded-lg text-sm h-20 resize-none"
                            placeholder="Ej: Dar con abundante agua, suspender si observa vómito..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedItems.length === 0}
                        className={`mt-4 w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
                            ${loading || selectedItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg'}`}
                    >
                        {loading ? 'Procesando...' : 'Finalizar Receta y Generar PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionPanel;
