import { Router } from 'express';
import {
  register,
  login,
  getUserById,
  updateUser,
  changePassword,
  getUserStats,
  getUserPreferences,
  updateUserPreferences,
} from '../controllers/userController';

const router = Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 获取用户统计信息
router.get('/:id/stats', getUserStats);

// 获取用户口味偏好
router.get('/:id/preferences', getUserPreferences);

// 更新用户口味偏好
router.put('/:id/preferences', updateUserPreferences);

// 获取用户信息
router.get('/:id', getUserById);

// 更新用户信息
router.put('/:id', updateUser);

// 修改密码
router.put('/:id/password', changePassword);

export default router;
