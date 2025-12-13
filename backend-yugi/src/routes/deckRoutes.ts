import { Router } from 'express';
import { createDeck } from '../controllers/deckController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createDeck);


export default router;