import {Router} from 'express';
import {z} from 'zod';
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

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.email('Please provide a valid email').toLowerCase(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username must contain only letters, numbers, underscore, and dash',
      ),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters')
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character',
      ),
  }),
});

const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email('Please provide a valid email').toLowerCase(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character',
      ),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

router.post('/register', validateRequest(registerSchema), register);

router.post('/login', validateRequest(loginSchema), login);

router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);

router.post('/logout', authenticateToken, logout);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  forgotPassword,
);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  resetPassword,
);

export {router as authRoutes};
