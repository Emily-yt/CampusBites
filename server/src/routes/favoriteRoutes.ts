import { Router } from 'express'
import { body } from 'express-validator'
import { FavoriteController } from '../controllers/favoriteController'
import { validateRequest } from '../middleware/validateRequest'

const router = Router()
const controller = new FavoriteController()

// 获取用户收藏列表
router.get('/', controller.getFavorites)

// 检查是否已收藏
router.get('/:restaurant_id/check', controller.checkFavorite)

// 添加收藏
router.post(
  '/',
  [
    body('restaurant_id').notEmpty().withMessage('Restaurant ID is required'),
    body('user_session').notEmpty().withMessage('User session is required'),
  ],
  validateRequest,
  controller.addFavorite
)

// 切换收藏状态
router.post(
  '/:restaurant_id/toggle',
  [
    body('user_session').notEmpty().withMessage('User session is required'),
  ],
  validateRequest,
  controller.toggleFavorite
)

// 取消收藏
router.delete('/:restaurant_id', controller.removeFavorite)

export default router
