import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { successResponse, errorResponse } from '../utils/response';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// 注册
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone, name, password, school, bio } = req.body;

    // 检查必填字段
    if (!name || !password) {
      return errorResponse(res, '昵称和密码不能为空', 400);
    }

    // 检查邮箱或手机号至少填一个
    if (!email && !phone) {
      return errorResponse(res, '邮箱或手机号至少填一个', 400);
    }

    // 检查邮箱是否已存在
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

    // 检查手机号是否已存在
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

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email: email || null,
        phone: phone || null,
        name,
        password_hash: passwordHash,
        school: school || null,
        bio: bio || null,
      })
      .select('id, email, phone, name, school, bio, created_at')
      .single();

    if (error) {
      throw error;
    }

    return successResponse(res, { user }, '注册成功', 201);
  } catch (error) {
    next(error);
  }
}

// 登录
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone, password } = req.body;

    // 检查必填字段
    if (!password) {
      return errorResponse(res, '密码不能为空', 400);
    }

    if (!email && !phone) {
      return errorResponse(res, '邮箱或手机号至少填一个', 400);
    }

    // 查找用户
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

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return errorResponse(res, '密码错误', 401);
    }

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return successResponse(res, { user: userWithoutPassword }, '登录成功');
  } catch (error) {
    next(error);
  }
}

// 获取用户信息
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, phone, name, school, bio, avatar, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    return successResponse(res, { user });
  } catch (error) {
    next(error);
  }
}

// 更新用户信息
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, school, bio, avatar } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        name,
        school,
        bio,
        avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, email, phone, name, school, bio, avatar, created_at, updated_at');

    const user = Array.isArray(data) ? data[0] : null;

    if (error) {
      throw error;
    }

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    return successResponse(res, { user }, '更新成功');
  } catch (error) {
    next(error);
  }
}

// 修改密码
export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // 获取用户
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isValidPassword) {
      return errorResponse(res, '原密码错误', 401);
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return successResponse(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
}

// 获取用户统计信息
export async function getUserStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 获取用户收藏数 - 同时查询用户ID和可能存在的旧session
    // 首先尝试用用户ID查询
    let { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('id, restaurant_id, created_at')
      .eq('user_session', id);

    if (favoritesError) throw favoritesError;

    // 如果没有找到，尝试从localStorage获取旧session（通过前端传入的header或查询参数）
    // 这里我们直接返回查询结果，因为前端现在应该使用用户ID作为session
    console.log('获取用户收藏，用户ID:', id, '收藏数量:', favorites?.length || 0);

    // 获取用户评价数（根据 user_name 匹配）
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, created_at, content, restaurant_id')
      .eq('user_name', user.name)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    // 获取用户打卡数
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id, created_at, restaurant_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (checkinsError) throw checkinsError;

    // 计算积分：基础100分 + 收藏数*10 + 打卡数*20
    const favoritesCount = favorites?.length || 0;
    const reviewsCount = reviews?.length || 0;
    const checkinsCount = checkins?.length || 0;
    const points = 100 + favoritesCount * 10 + checkinsCount * 20;

    // 生成成就徽章
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

    // 生成最近活动
    const activities = [];
    
    // 添加打卡活动
    if (checkins && checkins.length > 0) {
      for (const checkin of checkins.slice(0, 3)) {
        // 获取餐厅名称
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', checkin.restaurant_id)
          .single();
        
        activities.push({
          id: `checkin-${checkin.id}`,
          type: 'checkin',
          content: `打卡了 ${restaurant?.name || '未知餐厅'}`,
          time: formatTimeAgo(checkin.created_at),
          icon: 'MapPin',
        });
      }
    }

    // 添加收藏活动（从已获取的 favorites 数据中获取最近收藏）
    if (favoritesCount > 0 && favorites) {
      const recentFavorites = favorites
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2);

      for (const fav of recentFavorites) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', fav.restaurant_id)
          .single();
        
        activities.push({
          id: `fav-${fav.restaurant_id}`,
          type: 'favorite',
          content: `收藏了 ${restaurant?.name || '未知餐厅'}`,
          time: formatTimeAgo(fav.created_at),
          icon: 'Heart',
        });
      }
    }

    // 按时间排序并取前4条
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivities = activities.slice(0, 4);

    return successResponse(res, {
      stats: {
        favorites: favoritesCount,
        checkins: checkinsCount,
        points,
      },
      badges,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
}

// 获取用户口味偏好
export async function getUserPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // 先检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 获取用户偏好
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('taste_types, cuisine_types, budget_preference, created_at, updated_at')
      .eq('user_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 没有记录
      throw error;
    }

    // 如果没有记录，返回空对象
    if (!preferences) {
      return successResponse(res, {
        preferences: {
          taste_types: [],
          cuisine_types: [],
          budget_preference: '',
        },
      });
    }

    return successResponse(res, { preferences });
  } catch (error) {
    next(error);
  }
}

// 更新用户口味偏好
export async function updateUserPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { taste_types, cuisine_types, budget_preference } = req.body;

    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 检查是否已存在偏好记录
    const { data: existingPref } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', id)
      .single();

    let result;
    if (existingPref) {
      // 更新现有记录
      result = await supabase
        .from('user_preferences')
        .update({
          taste_types: taste_types || [],
          cuisine_types: cuisine_types || [],
          budget_preference: budget_preference || '',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', id)
        .select();
    } else {
      // 插入新记录
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: id,
          taste_types: taste_types || [],
          cuisine_types: cuisine_types || [],
          budget_preference: budget_preference || '',
        })
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    const preferences = Array.isArray(result.data) ? result.data[0] : null;

    return successResponse(res, { preferences }, '口味偏好已保存');
  } catch (error) {
    next(error);
  }
}

// 格式化时间为"多久前"
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}
