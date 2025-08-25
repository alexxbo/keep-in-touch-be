import {Router} from 'express';

import {authenticateToken} from '~middleware/auth';
import {validateRequest} from '~middleware/validation.middleware';

import {
  deleteAccount,
  getCurrentUser,
  getUserById,
  updateProfile,
} from '~controllers/users.controller';

import {updateProfileSchema, userParamsSchema} from '~validation/user.schemas';

const router = Router();

router.get('/me', authenticateToken, getCurrentUser);

router.patch(
  '/me',
  authenticateToken,
  validateRequest({body: updateProfileSchema}),
  updateProfile,
);

router.get('/:id', validateRequest({params: userParamsSchema}), getUserById);

router.delete('/me', authenticateToken, deleteAccount);

export {router as userRoutes};
