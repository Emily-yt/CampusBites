import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { successResponse, errorResponse } from '../utils/response'
import type { Restaurant, Review, MenuItem } from '../types/database'

function isRestaurantOpen(hours?: string): boolean {
  if (!hours) return true

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const timeRanges = hours.split(/[,，]/).map(s => s.trim()).filter(Boolean)

  for (const range of timeRanges) {
    const match = range.match(/(\d{1,2}):?(\d{2})?\s*[-~至]\s*(\d{1,2}):?(\d{2})?/)
    if (!match) continue

    const startHour = parseInt(match[1])
    const startMinute = parseInt(match[2] || '0')
    const endHour = parseInt(match[3])
    const endMinute = parseInt(match[4] || '0')

    const startTime = startHour * 60 + startMinute
    let endTime = endHour * 60 + endMinute

    if (endTime <= startTime) {
      endTime += 24 * 60
    }

    const adjustedCurrentTime = currentTime < startTime && endTime > 24 * 60 ? currentTime + 24 * 60 : currentTime

    if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
      return true
    }
  }

  return false
}

export class RestaurantController {
  // 获取所有餐厅（支持筛选和分页）
  async getAllRestaurants(req: Request, res: Response) {
    try {
      const {
        school,
        cuisine_type,
        max_distance,
        max_price,
        sort_by = 'rating',
        order = 'desc',
        page = '1',
        page_size = '20',
      } = req.query

      const pageNum = parseInt(page as string)
      const pageSize = parseInt(page_size as string)
      const offset = (pageNum - 1) * pageSize

      let query = supabase.from('restaurants').select('*', { count: 'exact' })

      // 筛选条件
      if (school && school !== 'all') {
        query = query.eq('school', school)
      }
      if (cuisine_type && cuisine_type !== 'all') {
        query = query.eq('cuisine_type', cuisine_type)
      }
      if (max_distance) {
        query = query.lte('distance_km', parseFloat(max_distance as string))
      }
      if (max_price) {
        query = query.lte('avg_price', parseFloat(max_price as string))
      }

      // 排序
      const orderAsc = order === 'asc'
      switch (sort_by) {
        case 'rating':
          query = query.order('rating', { ascending: orderAsc })
          break
        case 'price':
          query = query.order('avg_price', { ascending: orderAsc })
          break
        case 'distance':
          query = query.order('distance_km', { ascending: orderAsc })
          break
        case 'review_count':
          query = query.order('review_count', { ascending: orderAsc })
          break
        default:
          query = query.order('rating', { ascending: false })
      }

      // 分页
      query = query.range(offset, offset + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      const totalPages = count ? Math.ceil(count / pageSize) : 1

      successResponse(res, {
        data: data || [],
        pagination: {
          currentPage: pageNum,
          pageSize: pageSize,
          totalItems: count || 0,
          totalPages: totalPages,
        },
      })
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch restaurants', 500)
    }
  }

  // 获取单个餐厅详情
  async getRestaurantById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        errorResponse(res, 'Restaurant not found', 404)
        return
      }

      successResponse(res, data)
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch restaurant', 500)
    }
  }

  // 获取餐厅评价
  async getRestaurantReviews(req: Request, res: Response) {
    try {
      const { id } = req.params

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      successResponse(res, data || [])
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch reviews', 500)
    }
  }

  // 获取餐厅菜单
  async getRestaurantMenu(req: Request, res: Response) {
    try {
      const { id } = req.params

      // 首先从 restaurants 表获取 description 字段
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('description, avg_price')
        .eq('id', id)
        .single()

      if (restaurantError) throw restaurantError

      // 如果 description 存在，解析为菜单项
      if (restaurant?.description) {
        const dishNames = restaurant.description.split(',').map(name => name.trim()).filter(name => name)
        
        // 生成菜单项数据
        const menuItems = dishNames.map((name, index) => ({
          id: `${id}-dish-${index}`,
          restaurant_id: id,
          name: name,
          price: 0, // 价格未知，设为0
          description: '',
          image_url: '',
          is_recommended: index < 3, // 前3个标记为推荐
          created_at: new Date().toISOString(),
        }))

        successResponse(res, menuItems)
        return
      }

      // 如果 description 为空，回退到从 menu_items 表查询
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .order('is_recommended', { ascending: false })

      if (error) throw error

      successResponse(res, data || [])
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch menu', 500)
    }
  }

  // 添加评价
  async addReview(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { user_name, rating, content, images } = req.body

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          restaurant_id: id,
          user_name,
          rating,
          content,
          images: images || [],
        })
        .select()
        .single()

      if (error) throw error

      // 更新餐厅评分和评论数
      await this.updateRestaurantRating(id)

      successResponse(res, data, 'Review added successfully', 201)
    } catch (error: any) {
      errorResponse(res, 'Failed to add review', 500)
    }
  }

  // 更新餐厅评分
  private async updateRestaurantRating(restaurantId: string) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', restaurantId)

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

      await supabase
        .from('restaurants')
        .update({
          rating: parseFloat(avgRating.toFixed(1)),
          review_count: reviews.length,
        })
        .eq('id', restaurantId)
    }
  }

  // 获取今日推荐
  async getTodayRecommendations(req: Request, res: Response) {
    try {
      const { limit = '3' } = req.query
      const limitNum = parseInt(limit as string)

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20)

      if (error) throw error

      let restaurants = data || []

      // 从评分前20的餐厅中随机打乱
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]]
      }

      const selectedRestaurants: Restaurant[] = []
      const usedCuisineTypes = new Set<string>()

      for (const restaurant of restaurants) {
        if (selectedRestaurants.length >= limitNum) break
        if (usedCuisineTypes.has(restaurant.cuisine_type)) continue
        if (!isRestaurantOpen(restaurant.hours)) continue

        selectedRestaurants.push(restaurant)
        usedCuisineTypes.add(restaurant.cuisine_type)
      }

      successResponse(res, selectedRestaurants)
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch recommendations', 500)
    }
  }

  // 获取热门餐厅
  async getHotRestaurants(req: Request, res: Response) {
    try {
      const { limit = '6' } = req.query
      const limitNum = parseInt(limit as string)

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20)

      if (error) throw error

      let restaurants = data || []

      // 从评分前20的餐厅中随机打乱
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]]
      }

      // 取前limitNum个
      const selectedRestaurants = restaurants.slice(0, limitNum)

      successResponse(res, selectedRestaurants)
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch hot restaurants', 500)
    }
  }

  // 获取随机餐厅
  async getRandomRestaurant(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')

      if (error) throw error
      if (!data || data.length === 0) {
        errorResponse(res, 'No restaurants found', 404)
        return
      }

      const randomIndex = Math.floor(Math.random() * data.length)
      successResponse(res, data[randomIndex])
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch random restaurant', 500)
    }
  }

  // 获取榜单
  async getRankings(req: Request, res: Response) {
    try {
      const { type = 'popular', limit = '20' } = req.query

      let query = supabase.from('restaurants').select('*')

      switch (type) {
        case 'popular':
          query = query.order('rating', { ascending: false }).order('review_count', { ascending: false })
          break
        case 'value':
          query = query.order('avg_price', { ascending: true }).gte('rating', 4)
          break
        case 'latenight':
          query = query.eq('is_late_night', true).order('rating', { ascending: false })
          break
        case 'new':
          query = query.eq('is_new', true).order('created_at', { ascending: false })
          break
        default:
          query = query.order('rating', { ascending: false })
      }

      const { data, error } = await query.limit(parseInt(limit as string))

      if (error) throw error

      successResponse(res, data || [])
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch rankings', 500)
    }
  }

  // AI推荐
  async getAIRecommendations(req: Request, res: Response) {
    try {
      const {
        budget = '50',
        distance = '3',
        cuisine_type,
        occasion,
      } = req.body

      let query = supabase
        .from('restaurants')
        .select('*')
        .lte('avg_price', parseFloat(budget as string))
        .lte('distance_km', parseFloat(distance as string))

      if (cuisine_type) {
        query = query.eq('cuisine_type', cuisine_type)
      }

      if (occasion === '深夜加餐') {
        query = query.eq('is_late_night', true)
      }

      if (occasion === '约会聚餐') {
        query = query.gte('rating', 4.5)
      }

      if (occasion === '快速解决') {
        query = query.lte('distance_km', 1.5)
      }

      const { data, error } = await query.order('rating', { ascending: false }).limit(5)

      if (error) throw error

      successResponse(res, data || [])
    } catch (error: any) {
      errorResponse(res, 'Failed to get AI recommendations', 500)
    }
  }

  // 获取所有学校列表
  async getSchools(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('school')

      if (error) throw error

      const schools = [...new Set(data?.map(r => r.school) || [])]
      successResponse(res, schools)
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch schools', 500)
    }
  }

  // 获取所有菜系类型
  async getCuisineTypes(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('cuisine_type')

      if (error) throw error

      const types = [...new Set(data?.map(r => r.cuisine_type) || [])]
      successResponse(res, types)
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch cuisine types', 500)
    }
  }
}
