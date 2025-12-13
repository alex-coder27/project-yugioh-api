import { Router } from 'express';
import { getCards } from '../controllers/cardController';

const router = Router();

router.get('/', getCards);

export default router;