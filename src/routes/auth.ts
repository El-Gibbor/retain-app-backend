import { Router } from 'express';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { authRateLimit } from '../middleware/rate-limit';
import { signInSchema, signUpSchema } from '../schemas/auth';
import { getCurrentUser, signIn, signUp } from '../services/auth';

export const authRouter = Router();

authRouter.post('/signup', authRateLimit, async (req, res) => {
  const result = await signUp(signUpSchema.parse(req.body));
  res.status(201).json(result);
});

authRouter.post('/signin', authRateLimit, async (req, res) => {
  res.json(await signIn(signInSchema.parse(req.body)));
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await getCurrentUser(getAuthUser(req).id) });
});
