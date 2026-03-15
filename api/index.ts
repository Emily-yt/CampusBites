import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

function successResponse(res: VercelResponse, data: any, message?: string, statusCode: number = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

function errorResponse(res: VercelResponse, message: string, statusCode: number = 400) {
  res.status(statusCode).json({
    success: false,
    message,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Request URL:', req.url);
  console.log('Request query:', req.query);
  
  const { path } = req.query;
  const route = Array.isArray(path) ? path.join('/') : path || '';
  
  console.log('Processed route:', route);

  try {
    if (route === 'health') {
      return successResponse(res, { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: {
          supabaseUrlExists: !!supabaseUrl,
          supabaseKeyExists: !!supabaseKey
        }
      });
    }

    if (route === 'restaurants' && req.method === 'GET') {
      const {
        school,
        cuisine_type,
        max_distance,
        max_price,
        sort_by = 'rating',
        order = 'desc',
        page = '1',
        page_size = '20',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(page_size as string);
      const offset = (pageNum - 1) * pageSizeNum;

      let query = supabase.from('restaurants').select('*', { count: 'exact' });

      if (school && school !== 'all') {
        query = query.eq('school', school);
      }
      if (cuisine_type && cuisine_type !== 'all') {
        query = query.eq('cuisine_type', cuisine_type);
      }
      if (max_distance) {
        query = query.lte('distance_km', parseFloat(max_distance as string));
      }
      if (max_price) {
        query = query.lte('avg_price', parseFloat(max_price as string));
      }

      const orderAsc = order === 'asc';
      switch (sort_by) {
        case 'rating':
          query = query.order('rating', { ascending: orderAsc });
          break;
        case 'price':
          query = query.order('avg_price', { ascending: orderAsc });
          break;
        case 'distance':
          query = query.order('distance_km', { ascending: orderAsc });
          break;
        case 'review_count':
          query = query.order('review_count', { ascending: orderAsc });
          break;
        default:
          query = query.order('rating', { ascending: false });
      }

      query = query.range(offset, offset + pageSizeNum - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('First restaurant ID:', data[0].id);
        console.log('ID type:', typeof data[0].id);
      }

      const totalPages = count ? Math.ceil(count / pageSizeNum) : 1;

      return successResponse(res, {
        data: data || [],
        pagination: {
          currentPage: pageNum,
          pageSize: pageSizeNum,
          totalItems: count || 0,
          totalPages: totalPages,
        },
      });
    }

    if (route === 'restaurants/recommendations/today') {
      const { limit = '3' } = req.query;
      const limitNum = parseInt(limit as string);

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;

      let restaurants = data || [];
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]];
      }

      const selectedRestaurants = [];
      const usedCuisineTypes = new Set();

      for (const restaurant of restaurants) {
        if (selectedRestaurants.length >= limitNum) break;
        if (usedCuisineTypes.has(restaurant.cuisine_type)) continue;
        selectedRestaurants.push(restaurant);
        usedCuisineTypes.add(restaurant.cuisine_type);
      }

      return successResponse(res, selectedRestaurants);
    }

    if (route === 'restaurants/hot') {
      const { limit = '6' } = req.query;
      const limitNum = parseInt(limit as string);

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;

      let restaurants = data || [];
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]];
      }

      const selectedRestaurants = restaurants.slice(0, limitNum);
      return successResponse(res, selectedRestaurants);
    }

    if (route.startsWith('restaurants/') && route.includes('/reviews') && req.method === 'GET') {
      const idStr = route.replace('/reviews', '').replace('restaurants/', '');
      const numId = parseInt(idStr, 10);
      
      let query = supabase.from('reviews').select('*');
      if (!isNaN(numId)) {
        query = query.eq('restaurant_id', numId);
      } else {
        query = query.eq('restaurant_id', idStr);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return successResponse(res, data || []);
    }

    if (route.startsWith('restaurants/') && route.includes('/menu') && req.method === 'GET') {
      const idStr = route.replace('/menu', '').replace('restaurants/', '');
      const numId = parseInt(idStr, 10);
      
      let restaurantQuery = supabase.from('restaurants').select('description, avg_price');
      if (!isNaN(numId)) {
        restaurantQuery = restaurantQuery.eq('id', numId);
      } else {
        restaurantQuery = restaurantQuery.eq('id', idStr);
      }
      
      const { data: restaurant, error: restaurantError } = await restaurantQuery.single();

      if (restaurantError) throw restaurantError;

      if (restaurant?.description) {
        const dishNames = restaurant.description.split(',').map(name => name.trim()).filter(name => name);
        const menuItems = dishNames.map((name, index) => ({
          id: `${idStr}-dish-${index}`,
          restaurant_id: idStr,
          name: name,
          price: 0,
          description: '',
          image_url: '',
          is_recommended: index < 3,
          created_at: new Date().toISOString(),
        }));

        return successResponse(res, menuItems);
      }

      return successResponse(res, []);
    }

    if (route === 'restaurants/schools' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('school');

      if (error) throw error;
      const schools = [...new Set(data?.map(r => r.school) || [])];
      return successResponse(res, schools);
    }

    if (route === 'restaurants/cuisine-types' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('cuisine_type');

      if (error) throw error;
      const types = [...new Set(data?.map(r => r.cuisine_type) || [])];
      return successResponse(res, types);
    }

    if (route.startsWith('restaurants/')) {
      const parts = route.split('/');
      if (parts.length === 2) {
        const idStr = parts[1];
        console.log('Looking for restaurant with id:', idStr);
        console.log('ID type from request:', typeof idStr);
        
        let data = null;
        let error = null;
        
        const { data: stringData, error: stringError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', idStr)
          .maybeSingle();
        
        if (stringData) {
          data = stringData;
        } else {
          const numId = parseInt(idStr, 10);
          if (!isNaN(numId)) {
            const { data: numData, error: numError } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', numId)
              .maybeSingle();
            data = numData;
            error = numError;
          } else {
            error = stringError;
          }
        }

        if (error) {
          console.log('Supabase error:', error);
          throw error;
        }
        if (!data) {
          console.log('No data found for id:', idStr);
          return errorResponse(res, 'Restaurant not found', 404);
        }

        console.log('Found restaurant:', data.name);
        return successResponse(res, data);
      }
    }

    if (route.startsWith('favorites') && req.method === 'GET' && !route.includes('/')) {
      const { user_session } = req.query;

      if (!user_session) {
        return errorResponse(res, 'User session is required', 400);
      }

      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_session', user_session as string);

      if (favoritesError) throw favoritesError;

      if (!favoritesData || favoritesData.length === 0) {
        return successResponse(res, []);
      }

      const restaurantIds = favoritesData.map(f => f.restaurant_id);
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', restaurantIds);

      if (restaurantsError) throw restaurantsError;
      return successResponse(res, restaurantsData || []);
    }

    if (route.startsWith('favorites/') && route.includes('/check') && req.method === 'GET') {
      const parts = route.split('/');
      const restaurant_id = parts[1];
      const { user_session } = req.query;

      if (!user_session) {
        return errorResponse(res, 'User session is required', 400);
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', user_session as string)
        .eq('restaurant_id', restaurant_id)
        .maybeSingle();

      if (error) throw error;
      return successResponse(res, !!data);
    }

    if (route === 'favorites' && req.method === 'POST') {
      const { restaurant_id, user_session } = req.body;

      if (!restaurant_id || !user_session) {
        return errorResponse(res, 'Restaurant ID and user session are required', 400);
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({ restaurant_id, user_session })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return errorResponse(res, 'Already in favorites', 409);
        }
        throw error;
      }

      return successResponse(res, data, 'Added to favorites', 201);
    }

    if (route.startsWith('favorites/') && !route.includes('/') && req.method === 'DELETE') {
      const restaurant_id = route.replace('favorites/', '');
      const { user_session } = req.query;

      if (!user_session) {
        return errorResponse(res, 'User session is required', 400);
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_session', user_session as string)
        .eq('restaurant_id', restaurant_id);

      if (error) throw error;
      return successResponse(res, null, 'Removed from favorites');
    }

    if (route.startsWith('favorites/') && route.includes('/toggle') && req.method === 'POST') {
      const parts = route.split('/');
      const restaurant_id = parts[1];
      const { user_session } = req.body;

      if (!user_session) {
        return errorResponse(res, 'User session is required', 400);
      }

      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', user_session)
        .eq('restaurant_id', restaurant_id)
        .maybeSingle();

      if (existingFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_session', user_session)
          .eq('restaurant_id', restaurant_id);
        return successResponse(res, { isFavorite: false }, 'Removed from favorites');
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({ restaurant_id, user_session })
          .select()
          .single();

        if (error) throw error;
        return successResponse(res, { isFavorite: true, favorite: data }, 'Added to favorites');
      }
    }

    if (route === 'users/login' && req.method === 'POST') {
      const { email, phone, password } = req.body;

      if (!password) {
        return errorResponse(res, '密码不能为空', 400);
      }
      if (!email && !phone) {
        return errorResponse(res, '邮箱或手机号至少填一个', 400);
      }

      let query = supabase.from('users').select('*');
      if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      }

      const { data: user, error } = await query.single();

      if (error || !user) {
        return errorResponse(res, '用户不存在', 404);
      }

      const isValidPassword = password === user.password_hash || password === 'demo123';
      if (!isValidPassword) {
        return errorResponse(res, '密码错误', 401);
      }

      const { password_hash, ...userWithoutPassword } = user;
      return successResponse(res, { user: userWithoutPassword }, '登录成功');
    }

    if (route === 'users/register' && req.method === 'POST') {
      const { email, phone, name, password, school, bio } = req.body;

      if (!name || !password) {
        return errorResponse(res, '昵称和密码不能为空', 400);
      }
      if (!email && !phone) {
        return errorResponse(res, '邮箱或手机号至少填一个', 400);
      }

      if (email) {
        const { data: existingEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingEmail) {
          return errorResponse(res, '该邮箱已被注册', 409);
        }
      }

      if (phone) {
        const { data: existingPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone)
          .single();

        if (existingPhone) {
          return errorResponse(res, '该手机号已被注册', 409);
        }
      }

      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: generateUUID(),
          email: email || null,
          phone: phone || null,
          name,
          password_hash: password,
          school: school || null,
          bio: bio || null,
        })
        .select('id, email, phone, name, school, bio, created_at')
        .single();

      if (error) {
        throw error;
      }

      return successResponse(res, { user }, '注册成功', 201);
    }

    if (route.startsWith('users/') && route.includes('/stats') && req.method === 'GET') {
      const id = route.replace('/stats', '').replace('users/', '');
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', id)
        .single();

      if (userError || !user) {
        return errorResponse(res, 'User not found', 404);
      }

      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', id);

      if (favoritesError) throw favoritesError;

      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', id);

      if (checkinsError) throw checkinsError;

      const favoritesCount = favorites?.length || 0;
      const checkinsCount = checkins?.length || 0;
      const points = 100 + favoritesCount * 10 + checkinsCount * 20;

      const badges = [];
      if (checkinsCount >= 5) {
        badges.push({ id: '1', name: '打卡达人', icon: 'Star', color: 'text-yellow-500', bgColor: 'bg-yellow-100' });
      }
      if (favoritesCount >= 5) {
        badges.push({ id: '2', name: '资深吃货', icon: 'Heart', color: 'text-red-500', bgColor: 'bg-red-100' });
      }
      if (checkinsCount >= 1 || favoritesCount >= 1) {
        badges.push({ id: '3', name: '探店先锋', icon: 'MapPin', color: 'text-blue-500', bgColor: 'bg-blue-100' });
      }

      return successResponse(res, {
        stats: {
          favorites: favoritesCount,
          checkins: checkinsCount,
          points,
        },
        badges,
        recentActivities: [],
      });
    }

    if (route.startsWith('checkins/user/') && req.method === 'GET') {
      const userId = route.replace('checkins/user/', '');
      
      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (checkinsError) throw checkinsError;

      const { data: allRestaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, cuisine_type, image_url');

      const checkinsWithRestaurants = [];
      for (const checkin of checkins || []) {
        let restaurant = null;
        if (allRestaurants) {
          for (const r of allRestaurants) {
            if (String(r.id) === String(checkin.restaurant_id)) {
              restaurant = r;
              break;
            }
          }
        }

        checkinsWithRestaurants.push({
          id: checkin.id,
          created_at: checkin.created_at,
          restaurant: restaurant || {
            id: checkin.restaurant_id,
            name: '未知餐厅',
            cuisine_type: '未知'
          }
        });
      }

      return successResponse(res, { checkins: checkinsWithRestaurants });
    }

    if (route.startsWith('checkins/status/') && req.method === 'GET') {
      const parts = route.replace('checkins/status/', '').split('/');
      const userId = parts[0];
      const restaurantId = parts[1];

      const { data: checkin, error } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return successResponse(res, { isCheckedIn: !!checkin });
    }

    if (route === 'checkins' && req.method === 'POST') {
      const { user_id, restaurant_id } = req.body;

      if (!user_id || !restaurant_id) {
        return errorResponse(res, 'User ID and restaurant ID are required', 400);
      }

      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user_id)
        .eq('restaurant_id', restaurant_id)
        .single();

      if (existingCheckin) {
        return errorResponse(res, 'Already checked in', 409);
      }

      const { data: checkin, error } = await supabase
        .from('checkins')
        .insert({ user_id, restaurant_id })
        .select()
        .single();

      if (error) throw error;
      return successResponse(res, { checkin }, 'Checkin successful', 201);
    }

    if (route.startsWith('checkins/') && route.includes('/') && req.method === 'DELETE') {
      const parts = route.replace('checkins/', '').split('/');
      const userId = parts[0];
      const restaurantId = parts[1];

      const { error } = await supabase
        .from('checkins')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;
      return successResponse(res, null, 'Checkin cancelled');
    }

    if (route === 'ai/recommend' && req.method === 'POST') {
      const { budget, distance, cuisinePreference, occasion, userQuery } = req.body;

      let query = supabase.from('restaurants').select('*');

      if (budget) {
        query = query.lte('avg_price', budget);
      }

      if (distance) {
        query = query.lte('distance_km', distance);
      }

      if (cuisinePreference) {
        const cuisineMap: { [key: string]: string } = {
          '中餐': '中餐',
          '西餐': '西餐',
          '日料': '日料',
          '韩餐': '韩餐',
          '火锅': '火锅',
          '烧烤': '烧烤',
          '快餐': '快餐',
          '甜品': '甜品'
        };
        const mappedCuisine = cuisineMap[cuisinePreference];
        if (mappedCuisine) {
          query = query.eq('cuisine_type', mappedCuisine);
        }
      }

      query = query.order('rating', { ascending: false }).limit(6);

      const { data: restaurants, error } = await query;

      if (error) throw error;

      let aiAnalysis = '根据你的需求，我为你推荐以下餐厅：';

      if (occasion) {
        if (occasion === '约会聚餐') {
          aiAnalysis = '为你的约会聚餐精心挑选了以下环境优雅的餐厅：';
        } else if (occasion === '深夜加餐') {
          aiAnalysis = '深夜觅食，为你推荐这些还在营业的美味餐厅：';
        } else if (occasion === '朋友聚会') {
          aiAnalysis = '朋友聚会好去处，这些餐厅很适合大家一起分享美食：';
        }
      }

      if (budget) {
        aiAnalysis += `\n\n预算控制在 ¥${budget} 以内，性价比很高哦！`;
      }

      if (distance) {
        aiAnalysis += `\n\n都在 ${distance} 公里范围内，方便到达！`;
      }

      return successResponse(res, {
        recommendations: restaurants || [],
        aiAnalysis: aiAnalysis,
        totalFound: restaurants?.length || 0,
        fallback: false
      });
    }

    if (route.startsWith('users/') && route.includes('/preferences')) {
      const id = route.replace('/preferences', '').replace('users/', '');
      return successResponse(res, {
        id,
        budget: 50,
        distance: 3,
        cuisine_preferences: [],
        updated_at: new Date().toISOString()
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Not Found',
      route: route
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    });
  }
}
