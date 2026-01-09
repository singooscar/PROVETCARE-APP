import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Heart, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Pets() {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        species: '',
        breed: '',
        age: '',
        weight: '',
        gender: 'macho',
        photo_url: '',
        notes: ''
    });

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const response = await api.get('/pets');
            setPets(response.data);
        } catch (error) {
            toast.error('Error al cargar mascotas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingPet) {
                await api.put(`/pets/${editingPet.id}`, formData);
                toast.success('Mascota actualizada correctamente');
            } else {
                await api.post('/pets', formData);
                toast.success('Mascota agregada correctamente');
            }

            setShowModal(false);
            resetForm();
            fetchPets();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar mascota');
        }
    };

    const handleEdit = (pet) => {
        setEditingPet(pet);
        setFormData({
            name: pet.name,
            species: pet.species,
            breed: pet.breed || '',
            age: pet.age || '',
            weight: pet.weight || '',
            gender: pet.gender || 'macho',
            photo_url: pet.photo_url || '',
            notes: pet.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta mascota?')) return;

        try {
            await api.delete(`/pets/${id}`);
            toast.success('Mascota eliminada correctamente');
            fetchPets();
        } catch (error) {
            toast.error('Error al eliminar mascota');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            species: '',
            breed: '',
            age: '',
            weight: '',
            gender: 'macho',
            photo_url: '',
            notes: ''
        });
        setEditingPet(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">🐾 Mis Mascotas</h1>
                        <p className="text-gray-600">Gestiona la información de tus compañeros peludos</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <PlusCircle size={20} />
                        Agregar Mascota
                    </button>
                </div>
            </div>

            {/* Grid de Mascotas */}
            <div className="max-w-7xl mx-auto">
                {pets.length === 0 ? (
                    <div className="card text-center py-12">
                        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No tienes mascotas registradas
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Agrega tu primera mascota para comenzar a gestionar sus citas y historial médico
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary mx-auto"
                        >
                            Agregar Primera Mascota
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pets.map((pet) => (
                            <div key={pet.id} className="card hover:shadow-lg transition-shadow">
                                {/* Imagen */}
                                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                                    {pet.photo_url ? (
                                        <img
                                            src={pet.photo_url}
                                            alt={pet.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Heart size={64} className="text-purple-400" />
                                    )}
                                </div>

                                {/* Información */}
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.name}</h3>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="font-semibold w-20">Especie:</span>
                                            <span>{pet.species}</span>
                                        </div>
                                        {pet.breed && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-semibold w-20">Raza:</span>
                                                <span>{pet.breed}</span>
                                            </div>
                                        )}
                                        {pet.age && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-semibold w-20">Edad:</span>
                                                <span>{pet.age} años</span>
                                            </div>
                                        )}
                                        {pet.weight && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-semibold w-20">Peso:</span>
                                                <span>{pet.weight} kg</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="font-semibold w-20">Género:</span>
                                            <span className="capitalize">{pet.gender}</span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(pet)}
                                            className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pet.id)}
                                            className="btn bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Formulario */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {editingPet ? 'Editar Mascota' : 'Agregar Nueva Mascota'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input w-full"
                                            placeholder="Nombre de tu mascota"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Especie <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.species}
                                            onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Perro">Perro</option>
                                            <option value="Gato">Gato</option>
                                            <option value="Ave">Ave</option>
                                            <option value="Conejo">Conejo</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Raza
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.breed}
                                            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                            className="input w-full"
                                            placeholder="Raza (opcional)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Género
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="macho">Macho</option>
                                            <option value="hembra">Hembra</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Edad (años)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="input w-full"
                                            placeholder="Edad"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Peso (kg)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            className="input w-full"
                                            placeholder="Peso"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        URL de Foto
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.photo_url}
                                        onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                                        className="input w-full"
                                        placeholder="https://ejemplo.com/foto.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Notas
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="input w-full"
                                        rows="3"
                                        placeholder="Información adicional sobre tu mascota..."
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
                                        {editingPet ? 'Actualizar' : 'Agregar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
