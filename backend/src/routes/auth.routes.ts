import { Router } from 'express';
import { register, verify, login, forgot, reset, refresh, logout } from "../controllers/auth.controller.js";

const router = Router();

router.post('/register', register);
router.get('/verify', verify);
router.post('/login', login);
router.post('/forgot-password', forgot);
router.post('/reset-password', reset);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;