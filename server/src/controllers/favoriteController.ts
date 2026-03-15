import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { successResponse, errorResponse } from '../utils/response'
import type { Favorite, Restaurant } from '../types/database'

export class FavoriteController {
  // 获取用户收藏列表
  async getFavorites(req: Request, res: Response) {
    try {
      const { user_session } = req.query

      if (!user_session) {
        errorResponse(res, 'User session is required', 400)
        return
      }

      // 获取收藏的餐厅ID列表
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_session', user_session as string)

      if (favoritesError) throw favoritesError

      if (!favoritesData || favoritesData.length === 0) {
        successResponse(res, [])
        return
      }

      const restaurantIds = favoritesData.map(f => f.restaurant_id)

      // 获取餐厅详情
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', restaurantIds)

      if (restaurantsError) throw restaurantsError

      successResponse(res, restaurantsData || [])
    } catch (error: any) {
      errorResponse(res, 'Failed to fetch favorites', 500)
    }
  }

  // 检查是否已收藏
  async checkFavorite(req: Request, res: Response) {
    try {
      const { restaurant_id } = req.params
      const { user_session } = req.query

      if (!user_session) {
        errorResponse(res, 'User session is required', 400)
        return
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', user_session as string)
        .eq('restaurant_id', restaurant_id)
        .maybeSingle()

      if (error) throw error

      successResponse(res, !!data)
    } catch (error: any) {
      errorResponse(res, 'Failed to check favorite', 500)
    }
  }

  // 添加收藏
  async addFavorite(req: Request, res: Response) {
    try {
      const { restaurant_id, user_session } = req.body

      if (!restaurant_id || !user_session) {
        errorResponse(res, 'Restaurant ID and user session are required', 400)
        return
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          restaurant_id,
          user_session,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          errorResponse(res, 'Already in favorites', 409)
          return
        }
        throw error
      }

      successResponse(res, data, 'Added to favorites', 201)
    } catch (error: any) {
      errorResponse(res, 'Failed to add favorite', 500)
    }
  }

  // 取消收藏
  async removeFavorite(req: Request, res: Response) {
    try {
      const { restaurant_id } = req.params
      const { user_session } = req.query

      if (!user_session) {
        errorResponse(res, 'User session is required', 400)
        return
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_session', user_session as string)
        .eq('restaurant_id', restaurant_id)

      if (error) throw error

      successResponse(res, null, 'Removed from favorites')
    } catch (error: any) {
      errorResponse(res, 'Failed to remove favorite', 500)
    }
  }

  // 切换收藏状态
  async toggleFavorite(req: Request, res: Response) {
    try {
      const { restaurant_id } = req.params
      const { user_session } = req.body

      if (!user_session) {
        errorResponse(res, 'User session is required', 400)
        return
      }

      // 检查是否已收藏
      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', user_session)
        .eq('restaurant_id', restaurant_id)
        .maybeSingle()

      if (existingFavorite) {
        // 取消收藏
        await supabase
          .from('favorites')
          .delete()
          .eq('user_session', user_session)
          .eq('restaurant_id', restaurant_id)

        successResponse(res, { isFavorite: false }, 'Removed from favorites')
      } else {
        // 添加收藏
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            restaurant_id,
            user_session,
          })
          .select()
          .single()

        if (error) throw error

        successResponse(res, { isFavorite: true, favorite: data }, 'Added to favorites')
      }
    } catch (error: any) {
      errorResponse(res, 'Failed to toggle favorite', 500)
    }
  }
}
