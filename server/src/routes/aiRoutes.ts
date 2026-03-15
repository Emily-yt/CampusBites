import { Router } from 'express';
import { getAIRecommendation } from '../controllers/aiController';

const router = Router();

// AI 餐厅推荐
router.post('/recommend', getAIRecommendation);

export default router;
