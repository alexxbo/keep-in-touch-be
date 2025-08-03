import {Router} from 'express';
import {
  changePassword,
  getProfile,
  login,
  register,
  updateProfile,
} from '../../controllers/authController';
import {authenticateToken} from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
