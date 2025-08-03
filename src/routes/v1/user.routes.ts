import {Router} from 'express';
import {z} from 'zod';
import {
  deleteAccount,
  getCurrentUser,
  getUserById,
  updatePassword,
  updateProfile,
} from '../../controllers/user.controller';
import {authenticateToken} from '../../middleware/auth';
import {validateRequest} from '../../middleware/validation.middleware';

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters')
      .trim()
      .optional(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username must contain only letters, numbers, underscore, and dash',
      )
      .optional(),
  }),
});

const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'New password must contain uppercase, lowercase, number, and special character',
      ),
  }),
});

const userIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});

router.get('/me', authenticateToken, getCurrentUser);

router.patch(
  '/me',
  authenticateToken,
  validateRequest(updateProfileSchema),
  updateProfile,
);

router.patch(
  '/me/password',
  authenticateToken,
  validateRequest(updatePasswordSchema),
  updatePassword,
);

router.get('/:id', validateRequest(userIdSchema), getUserById);

router.delete('/me', authenticateToken, deleteAccount);

export {router as userRoutes};
