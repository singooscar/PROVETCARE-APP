import express from 'express';
import {
    getUserPets,
    createPet,
    getPetById,
    updatePet,
    deletePet
} from '../controllers/petController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserPets);
router.post('/', createPet);
router.get('/:id', getPetById);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);

export default router;
