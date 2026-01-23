import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, FileText, Pill, DollarSign } from 'lucide-react';
import { getFullUrl, ENDPOINTS } from '../config/api';
import { getAuthToken, handleApiError, downloadBlob } from '../utils/helpers';

/**
 * PrescriptionPanel Component
 * Panel para gestionar recetas médicas con integración de inventario
 * 
 * @param {number} appointmentId - ID de la cita médica
 * @param {number} petId - ID de la mascota
 * @param {function} onSuccess - Callback al completar exitosamente
 */
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
                const token = getAuthToken();
                const res = await axios.get(
                    getFullUrl(`${ENDPOINTS.INVENTORY}?search=${search}`),
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setInventory(res.data);
            } catch (error) {
                console.error('Error cargando inventario:', error);
                const msg = error.response?.data?.error || error.message;
                toast.error(`Error de inventario: ${msg}`);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchInventory();
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [search]);

    /**
     * Agrega un item del inventario a la receta
     * Valida que no esté duplicado y que haya stock
     */
    const addItem = (item) => {
        // Verificar si ya está
        if (selectedItems.find(i => i.id === item.id)) {
            toast.error('Este ítem ya está en la lista');
            return;
        }

        // Validar stock disponible
        if (item.stock <= 0) {
            toast.error('No hay stock disponible de este producto');
            return;
        }

        setSelectedItems([...selectedItems, {
            ...item,
            quantity: 1,
            dosage: '1 cada 24h',
            duration: '3 días'
        }]);
        toast.success(`${item.name} agregado`);
    };

    /**
     * Elimina un item de la lista de seleccionados
     */
    const removeItem = (id) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    /**
     * Actualiza un campo de un item seleccionado
     */
    const updateItem = (id, field, value) => {
        setSelectedItems(selectedItems.map(i => {
            if (i.id === id) {
                // Validar cantidad vs stock
                if (field === 'quantity') {
                    const numValue = parseInt(value) || 1;
                    if (numValue > i.stock) {
                        toast.error(`Solo hay ${i.stock} unidades disponibles`);
                        return i;
                    }
                    return { ...i, [field]: numValue };
                }
                return { ...i, [field]: value };
            }
            return i;
        }));
    };

    /**
     * Envía la receta al servidor y descarga el PDF generado
     */
    const handleSubmit = async () => {
        // Validaciones
        if (selectedItems.length === 0) {
            toast.error('Agrega al menos un medicamento');
            return;
        }

        if (!petId) {
            toast.error('No se especificó la mascota');
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();

            // Preparar payload con el formato correcto
            const payload = {
                petId,
                appointmentId,
                instructions: instructions || 'Sin instrucciones adicionales',
                medications: selectedItems.map(item => ({
                    name: item.name,
                    dosage: item.dosage,
                    duration: item.duration,
                    quantity: item.quantity
                }))
            };

            console.log('Enviando receta:', payload);

            // Hacer petición esperando un blob (archivo PDF)
            const res = await axios.post(
                getFullUrl(ENDPOINTS.PRESCRIPTIONS.CREATE),
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob' // Importante: esperar archivo binario
                }
            );

            // Descargar el PDF usando la función helper
            const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
            const filename = `receta_${petId}_${Date.now()}.pdf`;
            downloadBlob(pdfBlob, filename);

            // Éxito
            toast.success('✅ Receta creada y PDF descargado correctamente');

            // Limpiar formulario
            setSelectedItems([]);
            setInstructions('');

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error al crear receta:', error);

            // Manejar errores
            if (error.response?.data instanceof Blob) {
                // Si el error viene como blob, convertirlo a JSON
                try {
                    const text = await error.response.data.text();
                    const errorData = JSON.parse(text);
                    toast.error(`Error: ${errorData.message || 'Error al generar la receta'}`);
                } catch {
                    toast.error('Error al generar la receta');
                }
            } else {
                const errorMessage = handleApiError(error, 'Error al generar la receta');
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calcula el total de la receta
     */
    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) =>
            sum + ((item.unit_price || 0) * (item.quantity || 0)), 0
        ).toFixed(2);
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
                        <label className="text-sm font-medium text-gray-600 mb-1 block">
                            Buscar Medicamento / Servicio
                        </label>
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
                            <div
                                key={item.id}
                                className={`bg-white p-3 rounded shadow-sm flex justify-between items-center transition ${item.stock > 0
                                    ? 'hover:bg-emerald-50 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                                onClick={() => item.stock > 0 && addItem(item)}
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Stock: {item.stock} | ${item.unit_price}
                                        {item.stock === 0 && <span className="text-red-500 ml-2">(Agotado)</span>}
                                    </p>
                                </div>
                                {item.stock > 0 && <Plus size={18} className="text-emerald-600" />}
                            </div>
                        ))}
                        {inventory.length === 0 && (
                            <p className="text-center text-gray-400 py-4">
                                No se encontraron productos.
                            </p>
                        )}
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
                            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                                {selectedItems.map((item) => (
                                    <div key={item.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm text-emerald-800">{item.name}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-400 hover:text-red-600"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <label className="block text-gray-400">Cant.</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.stock}
                                                    className="w-full border rounded p-1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400">Dosis</label>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded p-1"
                                                    value={item.dosage}
                                                    onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400">Duración</label>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded p-1"
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
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                            Instrucciones Generales
                        </label>
                        <textarea
                            className="w-full p-2 border rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ej: Dar con abundante agua, suspender si observa vómito..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedItems.length === 0}
                        className={`mt-4 w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
                            ${loading || selectedItems.length === 0
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg'
                            }`}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <FileText size={18} />
                                Finalizar Receta y Generar PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionPanel;

