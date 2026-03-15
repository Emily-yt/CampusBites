import { Router } from 'express'
import restaurantRoutes from './restaurantRoutes'
import favoriteRoutes from './favoriteRoutes'
import userRoutes from './userRoutes'
import aiRoutes from './aiRoutes'
import checkinRoutes from './checkinRoutes'

const router = Router()

router.use('/restaurants', restaurantRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/users', userRoutes)
router.use('/ai', aiRoutes)
router.use('/checkins', checkinRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
