import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/chapters.controller.js';

// mergeParams is required to access :bookId from the parent router
const router = Router({ mergeParams: true }); 

router.get('/', getAll);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
