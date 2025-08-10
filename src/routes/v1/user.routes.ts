import {Router} from 'express';
import {
  deleteAccount,
  getCurrentUser,
  getUserById,
  updatePassword,
  updateProfile,
} from '../../controllers/user.controller';
import {authenticateToken} from '../../middleware/auth';
import {validateRequest} from '../../middleware/validation.middleware';
import {
  updatePasswordSchema,
  updateProfileSchema,
  userIdSchema,
} from '../../models/user/user.schemas';

const router = Router();

router.get('/me', authenticateToken, getCurrentUser);

router.patch(
  '/me',
  authenticateToken,
  validateRequest({body: updateProfileSchema}),
  updateProfile,
);

router.patch(
  '/me/password',
  authenticateToken,
  validateRequest({body: updatePasswordSchema}),
  updatePassword,
);

router.get('/:id', validateRequest({params: userIdSchema}), getUserById);

router.delete('/me', authenticateToken, deleteAccount);

export {router as userRoutes};
