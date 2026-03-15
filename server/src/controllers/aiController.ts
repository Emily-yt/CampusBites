import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import { successResponse } from '../utils/response';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.VITE_AI_API_KEY,
  baseURL: process.env.VITE_AI_API_URL,
});

interface AIRecommendationRequest {
  budget: number;
  distance: number;
  cuisinePreference: string;
  occasion: string;
  userQuery?: string;
}

export async function getAIRecommendation(req: Request, res: Response, next: NextFunction) {
  try {
    const { budget, distance, cuisinePreference, occasion, userQuery }: AIRecommendationRequest = req.body;

    // 从数据库获取符合条件的餐厅
    let query = supabase
      .from('restaurants')
      .select('*')
      .lte('avg_price', budget)
      .lte('distance_km', distance);

    if (cuisinePreference) {
      query = query.eq('cuisine_type', cuisinePreference);
    }

    const { data: restaurants, error } = await query;

    if (error) {
      throw error;
    }

    // 如果没有找到符合条件的餐厅，放宽条件查询所有餐厅
    let allRestaurants = restaurants;
    if (!restaurants || restaurants.length === 0) {
      const { data: allData } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20);
      allRestaurants = allData || [];
    }

    if (!allRestaurants || allRestaurants.length === 0) {
      return successResponse(res, {
        recommendations: [],
        aiAnalysis: '抱歉，数据库中没有餐厅数据。请稍后再试。',
      });
    }

    // 构建 AI 提示词
    const prompt = buildAIPrompt(allRestaurants, {
      budget,
      distance,
      cuisinePreference,
      occasion,
      userQuery,
    });

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.VITE_AI_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的美食推荐助手，擅长根据用户的需求推荐合适的餐厅。请用中文回复，语气友好亲切，像朋友一样给出建议。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // 解析 AI 响应，提取推荐的餐厅ID
    const recommendedIds = extractRecommendedIds(aiResponse, allRestaurants);
    
    // 根据 AI 推荐的顺序排序餐厅
    const sortedRecommendations = recommendedIds
      .map(id => allRestaurants.find((r: any) => r.id === id))
      .filter(Boolean) as any[];

    // 添加其他符合条件的餐厅（AI 没有特别推荐的）
    const otherRestaurants = allRestaurants.filter((r: any) => !recommendedIds.includes(r.id));
    const finalRecommendations = [...sortedRecommendations, ...otherRestaurants].slice(0, 5);

    return successResponse(res, {
      recommendations: finalRecommendations,
      aiAnalysis: aiResponse,
      totalFound: allRestaurants.length,
    });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    
    // 如果 AI 调用失败，返回基于规则的推荐
    try {
      const { budget, distance, cuisinePreference, occasion }: AIRecommendationRequest = req.body;
      
      let query = supabase
        .from('restaurants')
        .select('*')
        .lte('avg_price', budget)
        .lte('distance_km', distance);

      if (cuisinePreference) {
        query = query.eq('cuisine_type', cuisinePreference);
      }

      const { data: fallbackRestaurants } = await query
        .order('rating', { ascending: false })
        .limit(5);

      return successResponse(res, {
        recommendations: fallbackRestaurants || [],
        aiAnalysis: '根据你的条件，我为你找到了以下餐厅。这些都是评分较高的选择，希望能帮到你！',
        totalFound: fallbackRestaurants?.length || 0,
        fallback: true,
      });
    } catch (fallbackError) {
      next(error);
    }
  }
}

function buildAIPrompt(
  restaurants: any[],
  params: AIRecommendationRequest
): string {
  const { budget, distance, cuisinePreference, occasion, userQuery } = params;

  const restaurantList = restaurants
    .map(
      (r) => `
- ${r.name}（ID: ${r.id}）
  类型: ${r.cuisine_type}
  评分: ${r.rating}/5（${r.review_count}条评价）
  人均: ¥${r.avg_price}
  距离: ${r.distance_km}km
  简介: ${r.description}
  ${r.is_late_night ? '深夜营业' : ''}
`
    )
    .join('\n');

  return `请根据以下餐厅信息和用户需求，推荐最合适的3-5家餐厅。

## 用户需求
- 预算：人均不超过 ¥${budget}
- 距离：${distance}km 以内
- 菜系偏好：${cuisinePreference || '不限'}
- 用餐场景：${occasion || '日常用餐'}
${userQuery ? `- 其他要求：${userQuery}` : ''}

## 可选餐厅
${restaurantList}

## 回复格式
请按以下格式回复：

1. 首先给出一段友好的分析（100字左右），说明为什么推荐这些餐厅
2. 然后列出推荐的餐厅ID（按推荐顺序），格式为：RECOMMENDED_IDS: [id1, id2, id3]
3. 对每家餐厅给出简短推荐理由（1-2句话）

注意：请确保推荐的餐厅ID准确无误。`;
}

function extractRecommendedIds(aiResponse: string, restaurants: any[]): string[] {
  // 尝试从响应中提取推荐的餐厅ID
  const idPattern = /RECOMMENDED_IDS:\s*\[([^\]]+)\]/i;
  const match = aiResponse.match(idPattern);

  if (match) {
    const ids = match[1]
      .split(',')
      .map((id) => id.trim().replace(/['"]/g, ''))
      .filter((id) => restaurants.some((r) => r.id === id));
    return ids;
  }

  // 如果没有找到明确的ID列表，尝试从文本中提取
  const ids: string[] = [];
  for (const restaurant of restaurants) {
    if (aiResponse.includes(restaurant.id)) {
      ids.push(restaurant.id);
    }
  }

  return ids;
}
