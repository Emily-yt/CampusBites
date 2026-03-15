import type { Restaurant, Review, MenuItem } from './database.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 通用请求函数
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { error: result.error || result.message || 'Request failed' };
    }

    return { data: result.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// 餐厅相关 API
export const restaurantApi = {
  // 获取所有餐厅（支持筛选和分页）
  getAll: (params?: {
    school?: string;
    cuisine_type?: string;
    max_distance?: number;
    max_price?: number;
    sort_by?: string;
    order?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return fetchApi<{ data: Restaurant[]; pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number } }>(`/restaurants?${queryParams.toString()}`);
  },

  // 获取单个餐厅
  getById: (id: string) => fetchApi<Restaurant>(`/restaurants/${id}`),

  // 获取餐厅评价
  getReviews: (id: string) => fetchApi<Review[]>(`/restaurants/${id}/reviews`),

  // 获取餐厅菜单
  getMenu: (id: string) => fetchApi<MenuItem[]>(`/restaurants/${id}/menu`),

  // 添加评价
  addReview: (id: string, review: {
    user_name: string;
    rating: number;
    content: string;
    images?: string[];
  }) => fetchApi<Review>(`/restaurants/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  }),

  // 获取今日推荐
  getTodayRecommendations: (limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/recommendations/today?limit=${limit || 3}`),

  // 获取热门餐厅
  getHotRestaurants: (limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/hot?limit=${limit || 6}`),

  // 获取随机餐厅
  getRandom: () => fetchApi<Restaurant>('/restaurants/random'),

  // 获取榜单
  getRankings: (type: string = 'popular', limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/rankings?type=${type}&limit=${limit || 20}`),

  // AI推荐
  getAIRecommendations: (params: {
    budget?: number;
    distance?: number;
    cuisine_type?: string;
    occasion?: string;
  }) => fetchApi<Restaurant[]>('/restaurants/ai-recommendations', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // 获取学校列表
  getSchools: () => fetchApi<string[]>('/restaurants/schools'),

  // 获取菜系类型列表
  getCuisineTypes: () => fetchApi<string[]>('/restaurants/cuisine-types'),
};

// 菜单相关 API
export const menuApi = {
  // 获取餐厅菜单
  getByRestaurantId: (restaurantId: string) =>
    fetchApi<MenuItem[]>(`/restaurants/${restaurantId}/menu`),
};

// 评价相关 API
export const reviewApi = {
  // 获取餐厅评价
  getByRestaurantId: (restaurantId: string) =>
    fetchApi<Review[]>(`/restaurants/${restaurantId}/reviews`),
  
  // 创建评价
  create: (review: {
    restaurant_id: string;
    user_name: string;
    rating: number;
    content: string;
    images?: string[];
  }) => fetchApi<Review>(`/restaurants/${review.restaurant_id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  }),
};

// 收藏相关 API
export const favoriteApi = {
  // 获取收藏列表
  getFavorites: (userSession: string) =>
    fetchApi<Restaurant[]>(`/favorites?user_session=${userSession}`),

  // 检查是否已收藏
  checkFavorite: (restaurantId: string, userSession: string) =>
    fetchApi<boolean>(`/favorites/${restaurantId}/check?user_session=${userSession}`),

  // 添加收藏
  addFavorite: (restaurantId: string, userSession: string) =>
    fetchApi('/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, user_session: userSession }),
    }),

  // 取消收藏
  removeFavorite: (restaurantId: string, userSession: string) =>
    fetchApi(`/favorites/${restaurantId}?user_session=${userSession}`, {
      method: 'DELETE',
    }),

  // 切换收藏状态
  toggleFavorite: (restaurantId: string, userSession: string) =>
    fetchApi<{ isFavorite: boolean; favorite?: any }>(`/favorites/${restaurantId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ user_session: userSession }),
    }),
};

// 用户相关 API
export const userApi = {
  // 获取用户统计信息
  getUserStats: (userId: string) => fetchApi(`/users/${userId}/stats`),
};

// 健康检查
export const healthCheck = () => fetchApi('/health');
