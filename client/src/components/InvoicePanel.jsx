import { useState } from 'react';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const InvoicePanel = ({ appointmentId, onSuccess }) => {
    const [items, setItems] = useState([
        { description: 'Consulta General', quantity: 1, unitPrice: 50000 }
    ]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1) return;
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleGenerateInvoice = async () => {
        setLoading(true);
        try {
            // Validar que no haya campos vacíos
            if (items.some(item => !item.description || item.unitPrice <= 0)) {
                toast.error('Completa todos los ítems correctamente');
                setLoading(false);
                return;
            }

            const response = await api.post('/invoices/generate', {
                appointmentId,
                items,
                notes
            }, {
                responseType: 'blob' // Esperamos un PDF
            });

            // Descargar PDF
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `factura_${appointmentId}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Factura generada y descargada');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
            toast.error('Error al generar factura');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <FileText className="text-blue-600 mt-1" size={20} />
                <div>
                    <h4 className="font-bold text-blue-800">Generación de Factura</h4>
                    <p className="text-sm text-blue-600">Agrega los servicios y productos para generar el cobro al cliente.</p>
                </div>
            </div>

            {/* Lista de Items */}
            <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-500 uppercase px-2">
                    <div className="col-span-6">Descripción</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-3 text-right">Precio Unit.</div>
                    <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                        <div className="col-span-6">
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                placeholder="Ej: Vacuna Triple Felina"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full text-center bg-white border border-gray-300 rounded px-1 py-1 text-sm"
                            />
                        </div>
                        <div className="col-span-3">
                            <div className="relative">
                                <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full text-right bg-white border border-gray-300 rounded pl-5 pr-2 py-1 text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Eliminar ítem"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddItem}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} /> Agregar Ítem
                </button>
            </div>

            {/* Notas opcionales */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Detalles sobre métodos de pago, garantías, etc..."
                ></textarea>
            </div>

            {/* Footer con Total y Acción */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="text-right">
                    <p className="text-sm text-gray-500">Total a Pagar</p>
                    <p className="text-2xl font-bold text-gray-800">
                        ${calculateTotal().toLocaleString()}
                    </p>
                </div>
                <button
                    onClick={handleGenerateInvoice}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? (
                        <span className="animate-pulse">Generando...</span>
                    ) : (
                        <>
                            <Download size={20} /> Generar Factura PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default InvoicePanel;
