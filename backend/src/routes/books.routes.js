import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/books.controller.js';
import chapterRoutes from './chapters.routes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

router.use('/:bookId/chapters', chapterRoutes);

export default router;
