import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getMe, updateProfile } from '../controllers/user.controller';

const router = Router();

router.use(authenticate); 

router.get('/me', getMe);
router.put('/me', updateProfile);

export default router;