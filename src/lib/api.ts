import type { Restaurant, Review, MenuItem } from './database.types';

export const API_BASE_URL = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('MODE:', import.meta.env.MODE);

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

function cleanId(id: string): string {
  if (id.includes(':')) {
    return id.split(':')[0];
  }
  return id;
}

export const restaurantApi = {
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

  getById: (id: string) => fetchApi<Restaurant>(`/restaurants/${cleanId(id)}`),

  getReviews: (id: string) => fetchApi<Review[]>(`/restaurants/${cleanId(id)}/reviews`),

  getMenu: (id: string) => fetchApi<MenuItem[]>(`/restaurants/${cleanId(id)}/menu`),

  addReview: (id: string, review: {
    user_name: string;
    rating: number;
    content: string;
    images?: string[];
  }) => fetchApi<Review>(`/restaurants/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  }),

  getTodayRecommendations: (limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/recommendations/today?limit=${limit || 3}`),

  getHotRestaurants: (limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/hot?limit=${limit || 6}`),

  getRandom: () => fetchApi<Restaurant>('/restaurants/random'),

  getRankings: (type: string = 'popular', limit?: number) =>
    fetchApi<Restaurant[]>(`/restaurants/rankings?type=${type}&limit=${limit || 20}`),

  getAIRecommendations: (params: {
    budget?: number;
    distance?: number;
    cuisine_type?: string;
    occasion?: string;
  }) => fetchApi<Restaurant[]>('/restaurants/ai-recommendations', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  getSchools: () => fetchApi<string[]>('/restaurants/schools'),

  getCuisineTypes: () => fetchApi<string[]>('/restaurants/cuisine-types'),
};

export const menuApi = {
  getByRestaurantId: (restaurantId: string) =>
    fetchApi<MenuItem[]>(`/restaurants/${restaurantId}/menu`),
};

export const reviewApi = {
  getByRestaurantId: (restaurantId: string) =>
    fetchApi<Review[]>(`/restaurants/${restaurantId}/reviews`),
  
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

export const favoriteApi = {
  getFavorites: (userSession: string) =>
    fetchApi<Restaurant[]>(`/favorites?user_session=${userSession}`),

  checkFavorite: (restaurantId: string, userSession: string) =>
    fetchApi<boolean>(`/favorites/${cleanId(restaurantId)}/check?user_session=${userSession}`),

  addFavorite: (restaurantId: string, userSession: string) =>
    fetchApi('/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: cleanId(restaurantId), user_session: userSession }),
    }),

  removeFavorite: (restaurantId: string, userSession: string) =>
    fetchApi(`/favorites/${cleanId(restaurantId)}?user_session=${userSession}`, {
      method: 'DELETE',
    }),

  toggleFavorite: (restaurantId: string, userSession: string) =>
    fetchApi<{ isFavorite: boolean; favorite?: any }>(`/favorites/${cleanId(restaurantId)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ user_session: userSession }),
    }),
};

export const userApi = {
  getUserStats: (userId: string) => fetchApi(`/users/${userId}/stats`),
};

export const healthCheck = () => fetchApi('/health');
