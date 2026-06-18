import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { getMe, login, register } from './authController.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, getMe);
