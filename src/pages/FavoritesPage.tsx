import { useEffect, useState } from 'react';
import { Heart, Star, MapPin, DollarSign, Trash2 } from 'lucide-react';
import { supabase, getUserSession } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface FavoritesPageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function FavoritesPage({ onNavigateToRestaurant }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const session = getUserSession();

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_session', session);

      if (favoritesData && favoritesData.length > 0) {
        const restaurantIds = favoritesData.map(f => f.restaurant_id);

        const { data: restaurantsData } = await supabase
          .from('restaurants')
          .select('*')
          .in('id', restaurantIds);

        setFavorites(restaurantsData || []);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(restaurantId: string) {
    try {
      const session = getUserSession();

      await supabase
        .from('favorites')
        .delete()
        .eq('user_session', session)
        .eq('restaurant_id', restaurantId);

      setFavorites(favorites.filter(f => f.id !== restaurantId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 mb-4 shadow-lg">
            <Heart className="text-white" size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            我的
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent"> 收藏</span>
          </h1>
          <p className="text-gray-600 text-lg">
            {favorites.length > 0 ? `你收藏了${favorites.length}家餐厅` : '还没有收藏任何餐厅'}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
            <div className="text-6xl mb-4">💝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">还没有收藏</h3>
            <p className="text-gray-600 mb-6">
              浏览餐厅时点击收藏按钮，将喜欢的餐厅保存到这里
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group border border-gray-100 relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(restaurant.id);
                  }}
                  className="absolute top-3 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                  title="取消收藏"
                >
                  <Trash2 size={18} />
                </button>

                <div
                  onClick={() => onNavigateToRestaurant(restaurant.id)}
                  className="cursor-pointer"
                >
                  <div className="h-48 bg-gradient-to-br from-red-100 via-pink-100 to-orange-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                    🍽️
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors flex-1 pr-2">
                        {restaurant.name}
                      </h3>
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded flex-shrink-0">
                        {restaurant.cuisine_type}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="text-yellow-500" size={16} fill="currentColor" />
                          <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">({restaurant.review_count}条)</span>
                        </div>
                        <span className="text-red-600 font-bold text-lg">¥{restaurant.avg_price}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={14} className="mr-1 text-blue-500" />
                        <span>{restaurant.school}</span>
                        <span className="mx-2">·</span>
                        <span>{restaurant.distance_km}km</span>
                      </div>
                    </div>

                    {restaurant.hours && (
                      <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        {restaurant.hours}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">收藏统计</h3>
                <p className="text-gray-600 text-sm">你已收藏{favorites.length}家餐厅</p>
              </div>
              <div className="flex items-center space-x-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(favorites.reduce((sum, r) => sum + r.rating, 0) / favorites.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">平均评分</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{Math.round(favorites.reduce((sum, r) => sum + r.avg_price, 0) / favorites.length)}
                  </div>
                  <div className="text-xs text-gray-500">平均价格</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
