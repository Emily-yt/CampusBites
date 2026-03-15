import { Router } from 'express'
import { body } from 'express-validator'
import { RestaurantController } from '../controllers/restaurantController'
import { validateRequest } from '../middleware/validateRequest'

const router = Router()
const controller = new RestaurantController()

// 获取所有餐厅（支持筛选）
router.get('/', controller.getAllRestaurants)

// 获取学校列表
router.get('/schools', controller.getSchools)

// 获取菜系类型列表
router.get('/cuisine-types', controller.getCuisineTypes)

// 获取今日推荐
router.get('/recommendations/today', controller.getTodayRecommendations)

// 获取热门餐厅
router.get('/hot', controller.getHotRestaurants)

// 获取随机餐厅
router.get('/random', controller.getRandomRestaurant)

// 获取榜单
router.get('/rankings', controller.getRankings)

// AI推荐
router.post(
  '/ai-recommendations',
  [
    body('budget').optional().isNumeric().withMessage('Budget must be a number'),
    body('distance').optional().isNumeric().withMessage('Distance must be a number'),
    body('cuisine_type').optional().isString(),
    body('occasion').optional().isString(),
  ],
  validateRequest,
  controller.getAIRecommendations
)

// 获取单个餐厅详情
router.get('/:id', controller.getRestaurantById)

// 获取餐厅评价
router.get('/:id/reviews', controller.getRestaurantReviews)

// 获取餐厅菜单
router.get('/:id/menu', controller.getRestaurantMenu)

// 添加评价
router.post(
  '/:id/reviews',
  [
    body('user_name').notEmpty().withMessage('User name is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').notEmpty().withMessage('Content is required'),
    body('images').optional().isArray(),
  ],
  validateRequest,
  controller.addReview
)

export default router
