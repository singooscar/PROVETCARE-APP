import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Activity, Clipboard, FileText, Pill, Save, ArrowLeft,
    Check, AlertCircle, Clock, Thermometer, Heart, Weight,
    Stethoscope, FilePlus, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PrescriptionPanel from '../components/PrescriptionPanel';

// Componentes de la página
const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${active
            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const VitalSignInput = ({ icon: Icon, label, value, onChange, unit, placeholder, name, type = "number" }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Icon size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full text-2xl font-bold text-gray-800 outline-none placeholder-gray-300"
            />
            {unit && <span className="text-gray-400 text-sm font-medium">{unit}</span>}
        </div>
    </div>
);

const MedicalConsultation = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('evaluation'); // evaluation | diagnosis | prescription | files

    // Estado principal de la consulta
    const [consultation, setConsultation] = useState({
        petId: null,
        visitDate: format(new Date(), 'yyyy-MM-dd'),
        // Signos Vitales
        weight: '',
        temperature: '',
        heart_rate: '',
        respiratory_rate: '',
        mucous_membranes: '',
        capillary_refill_time: '',
        hydration_status: '',
        // Evaluación
        anamnesis: '', // Motivo de consulta / Historia
        abdomen_palpation: '',
        lymph_nodes: '',
        notes: '', // Examen físico general
        // Diagnóstico
        diagnosis: '',
        treatment: '',
        medications: '' // Texto libre legado
    });

    const [petData, setPetData] = useState(null);
    const [ownerData, setOwnerData] = useState(null);
    const [appointmentData, setAppointmentData] = useState(null);

    useEffect(() => {
        loadConsultationData();
    }, [appointmentId]);

    const loadConsultationData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/medical-records/consultation/${appointmentId}`);

            if (res.data.success) {
                if (res.data.exists) {
                    // Cargar datos existentes
                    const data = res.data.data;
                    setConsultation({
                        ...data,
                        petId: data.pet_id,
                        visitDate: data.visit_date.split('T')[0]
                    });
                    setPetData(data.pet);
                    setOwnerData({
                        name: data.pet.owner_name,
                        email: data.pet.owner_email
                    });
                } else {
                    // Iniciar nueva consulta con datos de la cita
                    const appt = res.data.appointment;
                    setAppointmentData(appt);
                    setPetData({
                        id: appt.pet_id,
                        name: appt.pet_name,
                        species: appt.species,
                        breed: appt.breed,
                        age: appt.age,
                        weight: appt.current_weight,
                        photo_url: appt.photo_url
                    });
                    setOwnerData({
                        id: appt.client_id,
                        name: appt.client_name,
                        email: appt.client_email
                    });

                    // Pre-llenar motivo de consulta si existe
                    setConsultation(prev => ({
                        ...prev,
                        petId: appt.pet_id,
                        anamnesis: appt.notes ? `Motivo de cita: ${appt.notes}` : '',
                        weight: appt.current_weight || ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error cargando consulta:', error);
            toast.error('Error al cargar datos de la consulta');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setConsultation(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (redirect = false) => {
        try {
            setSaving(true);

            // Determinar si es crear o actualizar (si tiene ID)
            const method = consultation.id ? 'put' : 'post';
            const url = consultation.id
                ? `/medical-records/${consultation.id}`
                : '/medical-records';

            const payload = {
                ...consultation,
                appointmentId: parseInt(appointmentId)
            };

            const res = await api[method](url, payload);

            if (res.data.success) {
                toast.success('Consulta guardada correctamente');

                // Actualizar ID si fue creación
                if (!consultation.id && res.data.data) {
                    setConsultation(prev => ({ ...prev, id: res.data.data.id }));
                }

                if (redirect) {
                    navigate('/payments');
                }
            }
        } catch (error) {
            console.error('Error guardando consulta:', error);
            toast.error('Error al guardar la consulta');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header del Paciente */}
            <div className="bg-white shadow-sm border-b z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={20} />
                            </button>

                            {/* Avatar Mascota */}
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                {petData?.photo_url ? (
                                    <img src={petData.photo_url} alt={petData.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold text-blue-600">
                                        {petData?.name?.charAt(0)}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    {petData?.name}
                                    <span className="text-sm font-normal text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                                        {petData?.species} • {petData?.breed}
                                    </span>
                                </h1>
                                <p className="text-sm text-gray-500 flex items-center gap-4">
                                    <span>👤 {ownerData?.name}</span>
                                    <span>🎂 {petData?.age} años</span>
                                    {consultation.weight && <span>⚖️ {consultation.weight} kg (Actual)</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition flex items-center gap-2"
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : 'Guardar Borrador'}
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm flex items-center gap-2"
                            >
                                <Check size={18} />
                                Finalizar y Cobrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-12 gap-6">

                {/* Sidebar Izquierdo - Contexto */}
                <div className="col-span-3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Motivo de Consulta</h3>
                        <p className="text-gray-800 font-medium">
                            {appointmentData?.service_type || 'Consulta General'}
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                            {appointmentData?.notes || 'Sin notas del cliente'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>{format(new Date(), "dd MMM yyyy, HH:mm")}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Historial Reciente</h3>
                        <div className="text-center py-8 text-gray-400 text-sm">
                            <Clock size={24} className="mx-auto mb-2 opacity-50" />
                            <p>No hay consultas previas</p>
                        </div>
                    </div>
                </div>

                {/* Área Principal */}
                <div className="col-span-9 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {/* Tabs de Navegación */}
                    <div className="flex border-b border-gray-100">
                        <TabButton
                            active={activeTab === 'evaluation'}
                            onClick={() => setActiveTab('evaluation')}
                            icon={Activity}
                            label="Evaluación Clínica"
                        />
                        <TabButton
                            active={activeTab === 'diagnosis'}
                            onClick={() => setActiveTab('diagnosis')}
                            icon={Clipboard}
                            label="Diagnóstico y Plan"
                        />
                        <TabButton
                            active={activeTab === 'prescription'}
                            onClick={() => setActiveTab('prescription')}
                            icon={Pill}
                            label="Receta Médica"
                        />
                        <TabButton
                            active={activeTab === 'files'}
                            onClick={() => setActiveTab('files')}
                            icon={FilePlus}
                            label="Archivos"
                        />
                    </div>

                    {/* Contenido Dinámico */}
                    <div className="p-6 flex-1 overflow-y-auto">

                        {/* TAB 1: EVALUACIÓN */}
                        {activeTab === 'evaluation' && (
                            <div className="space-y-6">
                                {/* Signos Vitales */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Activity className="text-red-500" /> Signos Vitales
                                    </h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <VitalSignInput
                                            icon={Weight} label="Peso" unit="kg"
                                            name="weight" value={consultation.weight} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Thermometer} label="Temperatura" unit="°C"
                                            name="temperature" value={consultation.temperature} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Heart} label="Frec. Cardíaca" unit="lpm"
                                            name="heart_rate" value={consultation.heart_rate} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Activity} label="Frec. Respiratoria" unit="rpm"
                                            name="respiratory_rate" value={consultation.respiratory_rate} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Activity} label="Mucosas" type="text" placeholder="Ej: Rosadas"
                                            name="mucous_membranes" value={consultation.mucous_membranes} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Clock} label="TLLC" type="text" placeholder="< 2 seg"
                                            name="capillary_refill_time" value={consultation.capillary_refill_time} onChange={handleInputChange}
                                        />
                                        <VitalSignInput
                                            icon={Activity} label="Hidratación" type="text" placeholder="Normal"
                                            name="hydration_status" value={consultation.hydration_status} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Anamnesis y Examen Físico */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Anamnesis / Historia</label>
                                        <textarea
                                            name="anamnesis"
                                            value={consultation.anamnesis}
                                            onChange={handleInputChange}
                                            rows={6}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                            placeholder="Describa el motivo de consulta y la historia clínica..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Examen Físico General</label>
                                        <textarea
                                            name="notes"
                                            value={consultation.notes}
                                            onChange={handleInputChange}
                                            rows={6}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                            placeholder="Hallazgos del examen físico..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Palpación Abdominal</label>
                                        <textarea
                                            name="abdomen_palpation"
                                            value={consultation.abdomen_palpation}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                            placeholder="Sin particularidades..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ganglios Linfáticos</label>
                                        <textarea
                                            name="lymph_nodes"
                                            value={consultation.lymph_nodes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                            placeholder="Normales, reactivos..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DIAGNÓSTICO */}
                        {activeTab === 'diagnosis' && (
                            <div className="space-y-6 max-w-4xl mx-auto">
                                <div>
                                    <label className="block text-lg font-bold text-gray-800 mb-2">Diagnóstico</label>
                                    <textarea
                                        name="diagnosis"
                                        value={consultation.diagnosis}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                        placeholder="Diagnóstico presuntivo o definitivo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-bold text-gray-800 mb-2">Plan de Tratamiento</label>
                                    <textarea
                                        name="treatment"
                                        value={consultation.treatment}
                                        onChange={handleInputChange}
                                        rows={8}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Describa el plan a seguir, procedimientos realizados, etc..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 3: RECETA */}
                        {activeTab === 'prescription' && (
                            <div>
                                {consultation.id ? (
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <PrescriptionPanel
                                            appointmentId={parseInt(appointmentId)}
                                            petId={consultation.petId}
                                            onClose={() => { }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                                        <AlertCircle size={48} className="text-gray-400 mb-4" />
                                        <h3 className="text-lg font-bold text-gray-600">Guarda la consulta primero</h3>
                                        <p className="text-gray-500 mb-6">Debes guardar los datos clínicos antes de crear una receta.</p>
                                        <button
                                            onClick={() => handleSave(false)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                                        >
                                            Guardar Borrador
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: ARCHIVOS */}
                        {activeTab === 'files' && (
                            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                                <FilePlus size={64} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-600">Subir Archivos</h3>
                                <p className="text-gray-400 mt-2">Arrastra imágenes, radiografías o resultados de laboratorio aquí</p>
                                <button className="mt-6 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    Seleccionar Archivos
                                </button>
                                <p className="text-xs text-gray-400 mt-4">(Funcionalidad en desarrollo)</p>
                            </div>
                        )}

                    </div>

                    {/* Botón Flotante para Siguiente Paso (si no es el último tab) */}
                    {activeTab !== 'files' && (
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => {
                                    if (activeTab === 'evaluation') setActiveTab('diagnosis');
                                    else if (activeTab === 'diagnosis') setActiveTab('prescription');
                                    else if (activeTab === 'prescription') setActiveTab('files');
                                }}
                                className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition"
                            >
                                Siguiente paso
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicalConsultation;
