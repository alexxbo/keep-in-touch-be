import {Router} from 'express';
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from '../../controllers/auth.controller';
import {authenticateToken} from '../../middleware/auth';
import {validateRequest} from '../../middleware/validation.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerUserSchema,
  resetPasswordSchema,
} from '../../models/auth/auth.schemas';

const router = Router();

router.post('/register', validateRequest({body: registerUserSchema}), register);

router.post('/login', validateRequest({body: loginSchema}), login);

router.post(
  '/refresh',
  validateRequest({body: refreshTokenSchema}),
  refreshToken,
);

router.post('/logout', authenticateToken, logout);

router.post(
  '/forgot-password',
  validateRequest({body: forgotPasswordSchema}),
  forgotPassword,
);

router.post(
  '/reset-password',
  validateRequest({body: resetPasswordSchema}),
  resetPassword,
);

export {router as authRoutes};
