import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { successResponse, errorResponse } from '../utils/response';

// 获取用户打卡列表
export async function getUserCheckins(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    console.log('=== 获取用户打卡列表, userId:', userId, ' ===');

    // 第一步：获取打卡记录
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (checkinsError) {
      console.error('查询打卡记录错误:', checkinsError);
      throw checkinsError;
    }

    console.log('打卡记录数量:', checkins?.length);
    if (checkins && checkins.length > 0) {
      console.log('第一条打卡记录原始数据:', JSON.stringify(checkins[0], null, 2));
    }

    // 第二步：获取所有餐厅
    console.log('正在获取所有餐厅...');
    const { data: allRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, cuisine_type, image_url');
    
    if (restaurantsError) {
      console.error('查询餐厅列表错误:', restaurantsError);
    }
    
    console.log('获取到的餐厅数量:', allRestaurants?.length);
    
    // 打印所有餐厅的ID，方便对比
    if (allRestaurants) {
      console.log('所有餐厅的ID列表:');
      allRestaurants.forEach((r, i) => {
        console.log(`  ${i+1}. ID: [${r.id}] (${typeof r.id}) - ${r.name}`);
      });
    }

    // 第三步：匹配餐厅信息
    console.log('开始匹配餐厅信息...');
    const checkinsWithRestaurants = [];
    
    for (const checkin of checkins || []) {
      console.log('---');
      console.log('处理打卡记录 ID:', checkin.id);
      console.log('checkin.restaurant_id:', checkin.restaurant_id);
      console.log('checkin.restaurant_id 类型:', typeof checkin.restaurant_id);
      
      let restaurant = null;
      
      // 尝试多种匹配方法
      if (allRestaurants) {
        for (const r of allRestaurants) {
          console.log(`  对比餐厅: [${r.id}] vs [${checkin.restaurant_id}]`);
          console.log(`    类型对比: ${typeof r.id} vs ${typeof checkin.restaurant_id}`);
          console.log(`    字符串相等: ${String(r.id) === String(checkin.restaurant_id)}`);
          console.log(`    直接相等: ${r.id === checkin.restaurant_id}`);
          
          if (String(r.id) === String(checkin.restaurant_id)) {
            restaurant = r;
            console.log('  ✓ 找到匹配的餐厅:', r.name);
            break;
          }
        }
      }
      
      const result = {
        id: checkin.id,
        created_at: checkin.created_at,
        restaurant: restaurant || {
          id: checkin.restaurant_id,
          name: '未知餐厅',
          cuisine_type: '未知'
        }
      };
      
      console.log('最终餐厅信息:', result.restaurant);
      checkinsWithRestaurants.push(result);
    }

    console.log('---');
    console.log('最终返回的打卡记录数量:', checkinsWithRestaurants.length);
    console.log('最终返回数据:', JSON.stringify(checkinsWithRestaurants, null, 2));
    return successResponse(res, { checkins: checkinsWithRestaurants });
  } catch (error) {
    console.error('getUserCheckins 异常:', error);
    next(error);
  }
}

// 检查用户是否已打卡某餐厅
export async function checkCheckinStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, restaurantId } = req.params;

    const { data: checkin, error } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 没有记录
      throw error;
    }

    return successResponse(res, { isCheckedIn: !!checkin });
  } catch (error) {
    next(error);
  }
}

// 打卡餐厅
export async function checkinRestaurant(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id, restaurant_id } = req.body;

    if (!user_id || !restaurant_id) {
      return errorResponse(res, '用户ID和餐厅ID不能为空', 400);
    }

    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 检查餐厅是否存在
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return errorResponse(res, '餐厅不存在', 404);
    }

    // 检查是否已经打卡
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', user_id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (existingCheckin) {
      return errorResponse(res, '已经打卡过该餐厅', 409);
    }

    // 创建打卡记录
    const { data: checkin, error } = await supabase
      .from('checkins')
      .insert({
        user_id,
        restaurant_id,
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(res, { checkin }, '打卡成功', 201);
  } catch (error) {
    next(error);
  }
}

// 取消打卡
export async function cancelCheckin(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, restaurantId } = req.params;

    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;

    return successResponse(res, null, '取消打卡成功');
  } catch (error) {
    next(error);
  }
}
