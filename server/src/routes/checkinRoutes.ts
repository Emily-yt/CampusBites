import { Router } from 'express';
import {
  getUserCheckins,
  checkinRestaurant,
  cancelCheckin,
  checkCheckinStatus,
} from '../controllers/checkinController';

const router = Router();

// 获取用户打卡列表
router.get('/user/:userId', getUserCheckins);

// 检查用户是否已打卡某餐厅
router.get('/status/:userId/:restaurantId', checkCheckinStatus);

// 打卡餐厅
router.post('/', checkinRestaurant);

// 取消打卡
router.delete('/:userId/:restaurantId', cancelCheckin);

export default router;
