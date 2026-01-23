import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileText, Download, Calendar, Stethoscope, Pill, ArrowLeft, AlertCircle } from 'lucide-react';

const MedicalHistory = () => {
    const { petId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [petInfo, setPetInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMedicalHistory();
    }, [petId]);

    const fetchMedicalHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Obtener historial médico
            const historyRes = await axios.get(
                `http://localhost:5000/api/medical-records/pet/${petId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setHistory(historyRes.data.data || []);

            // Obtener info de la mascota
            const petRes = await axios.get(
                `http://localhost:5000/api/pets/${petId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPetInfo(petRes.data);
            setError(null);

        } catch (error) {
            console.error('Error cargando historial:', error);

            if (error.response?.status === 403) {
                setError('No tienes permiso para ver este historial médico');
                toast.error('Acceso denegado');
            } else if (error.response?.status === 404) {
                setError('Mascota no encontrada');
            } else {
                setError('Error al cargar el historial médico');
                toast.error('Error al cargar datos');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (prescriptionId) => {
        try {
            const token = localStorage.getItem('token');

            const res = await axios.get(
                `http://localhost:5000/api/prescriptions/${prescriptionId}/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `receta_${prescriptionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(pdfUrl);

            toast.success('PDF descargado correctamente');
        } catch (error) {
            console.error('Error descargando PDF:', error);
            toast.error('Error al descargar el PDF');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando historial médico...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 mb-2">Error de Acceso</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-6 mb-6 shadow-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>

                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full">
                        <Stethoscope size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Historial Médico</h1>
                        {petInfo && (
                            <p className="text-emerald-100 text-lg mt-1">
                                {petInfo.name} - {petInfo.species} ({petInfo.breed})
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Información del Paciente */}
            {petInfo && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="text-emerald-600" />
                        Información del Paciente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">Nombre</label>
                            <p className="font-semibold text-gray-800">{petInfo.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Especie / Raza</label>
                            <p className="font-semibold text-gray-800">{petInfo.species} - {petInfo.breed}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Edad</label>
                            <p className="font-semibold text-gray-800">{petInfo.age} años</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Peso</label>
                            <p className="font-semibold text-gray-800">{petInfo.weight} kg</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Género</label>
                            <p className="font-semibold text-gray-800 capitalize">{petInfo.gender}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Historial */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-emerald-600" />
                        Historial de Consultas
                        <span className="ml-auto text-sm font-normal text-gray-600">
                            {history.length} {history.length === 1 ? 'registro' : 'registros'}
                        </span>
                    </h2>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-12">
                        <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No hay registros médicos para esta mascota</p>
                        <p className="text-gray-400 text-sm mt-2">Los historiales aparecerán aquí cuando se registren consultas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Fecha de Consulta
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Diagnóstico
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Tratamiento
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Veterinario
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Receta
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-emerald-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-emerald-600" />
                                                <span className="font-medium text-gray-900">
                                                    {new Date(record.visit_date).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 font-medium">{record.diagnosis || 'Sin diagnóstico'}</p>
                                            {record.medications && (
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Pill size={12} />
                                                    {record.medications}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">{record.treatment || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-800">
                                                {record.vet_name || record.veterinarian_name || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {record.prescription_pdf ? (
                                                <button
                                                    onClick={() => downloadPDF(record.prescription_id)}
                                                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm font-medium"
                                                >
                                                    <Download size={16} />
                                                    Descargar PDF
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin receta</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Notas adicionales */}
            {history.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Este historial es confidencial y solo debe ser compartido con profesionales de la salud veterinaria autorizados.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MedicalHistory;
