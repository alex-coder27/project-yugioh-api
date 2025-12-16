import { Router } from 'express';
import { createDeck, getDecks, getDeckById, updateDeck, deleteDeck } from '../controllers/deckController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createDeck);
router.get('/', authenticateToken, getDecks);
router.get('/:id', authenticateToken, getDeckById);
router.put('/:id', authenticateToken, updateDeck);
router.delete('/:id', authenticateToken, deleteDeck);

export default router;