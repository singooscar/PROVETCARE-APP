import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, FileText, Pill, Search, PenTool, AlertCircle } from 'lucide-react';
import { getFullUrl, ENDPOINTS } from '../config/api';
import { getAuthToken, handleApiError, downloadBlob } from '../utils/helpers';

/**
 * PrescriptionPanel Component (Refactorizado)
 * Permite prescripción flexible: Búsqueda en inventario O entrada manual
 */
const PrescriptionPanel = ({ appointmentId, petId, onSuccess }) => {
    // Estado de la lista de medicamentos a recetar
    const [prescribedItems, setPrescribedItems] = useState([]);

    // Estado para el formulario de agregar/buscar
    const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'search'
    const [searchTerm, setSearchTerm] = useState('');
    const [inventoryResults, setInventoryResults] = useState([]);

    // Formulario actual
    const [currentItem, setCurrentItem] = useState({
        name: '',
        dosage: '',
        duration: '',
        quantity: 1,
        instructions: ''
    });

    const [generalInstructions, setGeneralInstructions] = useState('');
    const [loading, setLoading] = useState(false);

    // Efecto para búsqueda de productos
    useEffect(() => {
        if (entryMode === 'search' && searchTerm.length > 2) {
            const timeoutId = setTimeout(async () => {
                try {
                    const token = getAuthToken();
                    const res = await axios.get(
                        getFullUrl(`${ENDPOINTS.INVENTORY}?search=${searchTerm}`),
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setInventoryResults(res.data);
                } catch (error) {
                    console.error('Error buscando:', error);
                }
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setInventoryResults([]);
        }
    }, [searchTerm, entryMode]);

    // Función para seleccionar del inventario
    const selectInventoryItem = (item) => {
        setCurrentItem({
            ...currentItem,
            name: item.name,
            // Pre-llenar si hay datos, o dejar vacíos
        });
        setSearchTerm('');
        setInventoryResults([]);
        setEntryMode('manual'); // Cambiar a modo edición para completar dosis
    };

    // Agregar ítem a la lista temporal
    const addItemToList = () => {
        if (!currentItem.name || !currentItem.dosage || !currentItem.duration) {
            toast.error('Por favor completa Nombre, Dosis y Duración');
            return;
        }

        setPrescribedItems([...prescribedItems, { ...currentItem, id: Date.now() }]);

        // Resetear formulario
        setCurrentItem({
            name: '',
            dosage: '',
            duration: '',
            quantity: 1,
            instructions: ''
        });
        setEntryMode('manual');
    };

    const removeItem = (id) => {
        setPrescribedItems(prescribedItems.filter(i => i.id !== id));
    };

    // Guardar receta final
    const handleSubmit = async () => {
        if (prescribedItems.length === 0) {
            toast.error('Agrega al menos un medicamento a la receta');
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            const payload = {
                petId,
                appointmentId,
                instructions: generalInstructions || 'Seguir indicaciones detalladas para cada medicamento.',
                medications: prescribedItems
            };

            const res = await axios.post(
                getFullUrl(ENDPOINTS.PRESCRIPTIONS.CREATE),
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob'
                }
            );

            const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
            downloadBlob(pdfBlob, `receta_medica_${petId}.pdf`);

            toast.success('Receta generada correctamente');
            setPrescribedItems([]);
            setGeneralInstructions('');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error:', error);
            const msg = handleApiError(error, 'Error al generar receta');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                    <Pill size={20} /> Nueva Receta Médica
                </h3>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* COLUMNA IZQUIERDA: FORMULARIO DE AGREGADO */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setEntryMode('manual')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${entryMode === 'manual' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                <PenTool size={16} className="inline mr-1" /> Entrada Manual
                            </button>
                            <button
                                onClick={() => setEntryMode('search')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${entryMode === 'search' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                <Search size={16} className="inline mr-1" /> Buscar Producto
                            </button>
                        </div>

                        {entryMode === 'search' ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar en inventario..."
                                    className="w-full p-2 border rounded-lg pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <Search size={16} className="absolute left-2.5 top-3 text-gray-400" />

                                <div className="mt-2 max-h-40 overflow-y-auto bg-white border rounded-lg shadow-sm">
                                    {inventoryResults.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => selectInventoryItem(item)}
                                            className="p-2 hover:bg-emerald-50 cursor-pointer text-sm border-b last:border-0"
                                        >
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-xs text-gray-500">Stock: {item.stock}</div>
                                        </div>
                                    ))}
                                    {searchTerm.length > 2 && inventoryResults.length === 0 && (
                                        <div className="p-2 text-xs text-center text-gray-400">No se encontraron productos</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Medicamento</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg bg-white"
                                        placeholder="Nombre del medicamento"
                                        value={currentItem.name}
                                        onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Dosis</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-lg bg-white"
                                            placeholder="Ej: 5ml / 1 tableta"
                                            value={currentItem.dosage}
                                            onChange={e => setCurrentItem({ ...currentItem, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Duración</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-lg bg-white"
                                            placeholder="Ej: Cada 8h por 5 días"
                                            value={currentItem.duration}
                                            onChange={e => setCurrentItem({ ...currentItem, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Cantidad Total</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg bg-white"
                                        placeholder="Total unidades a entregar"
                                        value={currentItem.quantity}
                                        onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={addItemToList}
                                    className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Agregar a la Receta
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: LISTA DE ITEMS */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 relative">
                        <div className="absolute top-0 right-0 p-2 bg-emerald-100 text-emerald-700 rounded-bl-xl text-xs font-bold">
                            VISTA PREVIA DE RECETA
                        </div>

                        {prescribedItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                <FileText size={48} className="mb-2 opacity-50" />
                                <p>No hay medicamentos agregados</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mt-6">
                                {prescribedItems.map((item, idx) => (
                                    <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Dosis:</span> {item.dosage} •
                                                <span className="font-medium ml-2">Duración:</span> {item.duration}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Cantidad a despachar: {item.quantity} unidades
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Instrucciones Adicionales / Notas</label>
                        <textarea
                            className="w-full p-3 border rounded-xl h-24 resize-none focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                            placeholder="Recomendaciones generales, dieta, cuidados, etc..."
                            value={generalInstructions}
                            onChange={e => setGeneralInstructions(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || prescribedItems.length === 0}
                        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Generando PDF...' : '🖨️ Guardar e Imprimir Receta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionPanel;
