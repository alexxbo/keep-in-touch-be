import {Router} from 'express';
import {
  changePassword,
  getProfile,
  login,
  register,
  updateProfile,
} from '../../controllers/user.controller';
import {authenticateToken} from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.put('/me', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export {router as userRoutes};
