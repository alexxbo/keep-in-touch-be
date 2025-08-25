import {Router} from 'express';

import {authenticateToken} from '~middleware/auth';
import {validateRequest} from '~middleware/validation.middleware';

import {
  forgotPassword,
  getSessions,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  revokeSession,
  updatePassword,
} from '~controllers/auth.controller';

import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerUserSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '~validation/auth.schemas';

const router = Router();

router.post('/register', validateRequest({body: registerUserSchema}), register);

router.post('/login', validateRequest({body: loginSchema}), login);

router.post(
  '/refresh',
  validateRequest({body: refreshTokenSchema}),
  refreshToken,
);

router.post(
  '/logout',
  authenticateToken,
  validateRequest({body: logoutSchema}),
  logout,
);

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

router.patch(
  '/update-password',
  authenticateToken,
  validateRequest({body: updatePasswordSchema}),
  updatePassword,
);

// Session management routes
router.get('/sessions', authenticateToken, getSessions);

router.delete('/sessions/:tokenId', authenticateToken, revokeSession);

export {router as authRoutes};
