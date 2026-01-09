import express from 'express';
import {
    getUserPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
    getPetMedicalHistory
} from '../controllers/petController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de mascotas
router.get('/', getUserPets);
router.get('/:id', getPetById);
router.post('/', createPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);

// Historial médico
router.get('/:id/medical-history', getPetMedicalHistory);

export default router;
