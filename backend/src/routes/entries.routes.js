import { Router } from 'express';
import { getAll, getOne, upsert, remove } from '../controllers/entries.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:date', getOne);
router.put('/:date', upsert);
router.delete('/:date', remove);

export default router;
