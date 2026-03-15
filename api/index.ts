import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 主处理函数
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  const route = Array.isArray(path) ? path.join('/') : path || '';

  try {
    // Health check
    if (route === 'health') {
      return res.status(200).json({ 
        success: true, 
        status: 'ok', 
        timestamp: new Date().toISOString() 
      });
    }

    // 获取餐厅列表
    if (route === 'restaurants' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: {
          data: data || [],
          pagination: {
            currentPage: 1,
            pageSize: 20,
            totalItems: data?.length || 0,
            totalPages: 1
          }
        }
      });
    }

    // 获取今日推荐
    if (route === 'restaurants/recommendations/today') {
      const limit = parseInt(req.query.limit as string) || 3;
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    // 获取热门餐厅
    if (route === 'restaurants/hot') {
      const limit = parseInt(req.query.limit as string) || 6;
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('review_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    // 获取单个餐厅
    if (route.startsWith('restaurants/') && !route.includes('/')) {
      const id = route.replace('restaurants/', '');
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    }

    // 默认 404
    return res.status(404).json({
      success: false,
      error: 'Not Found'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    });
  }
}
