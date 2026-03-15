import { useEffect, useState, useRef } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { favoriteApi } from '../lib/api';
import { getUserSession } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface FavoritesPageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function FavoritesPage({ onNavigateToRestaurant }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const lastUpdatedRef = useRef<string | null>(null);

  async function loadFavorites() {
    console.log('Loading favorites...');
    try {
      const session = getUserSession();
      console.log('Session:', session);
      const { data } = await favoriteApi.getFavorites(session);
      console.log('Favorites data:', data);
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
    
    // 立即检查一次当前的 localStorage 值
    const initialUpdated = localStorage.getItem('favorites_updated');
    lastUpdatedRef.current = initialUpdated;
    console.log('Initial favorites_updated:', initialUpdated);
    
    const checkForUpdates = () => {
      const updated = localStorage.getItem('favorites_updated');
      console.log('Checking for updates. Current:', updated, 'Last:', lastUpdatedRef.current);
      if (updated && updated !== lastUpdatedRef.current) {
        console.log('Update detected, reloading favorites...');
        lastUpdatedRef.current = updated;
        loadFavorites();
      }
    };
    
    const interval = setInterval(checkForUpdates, 300);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  async function removeFavorite(restaurantId: string) {
    try {
      const session = getUserSession();
      await favoriteApi.removeFavorite(restaurantId, session);
      setFavorites(favorites.filter(r => r.id !== restaurantId));
      localStorage.setItem('favorites_updated', Date.now().toString());
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  function getCuisineEmoji(cuisineType: string) {
    const map: { [key: string]: string } = { '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲', '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰' };
    return map[cuisineType] || '🍜';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="text-gray-600 mt-1">共收藏了 {favorites.length} 家餐厅</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
            <p className="text-gray-600 mb-2">还没有收藏任何餐厅</p>
            <p className="text-gray-400 text-sm">去探索页面发现美食吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl flex-shrink-0">
                    {getCuisineEmoji(restaurant.cuisine_type)}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 line-clamp-1">{restaurant.name}</h3>
                        <p className="text-sm text-amber-600 line-clamp-1">{restaurant.cuisine_type}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {restaurant.rating.toFixed(1)}</span>
                          <span>¥{restaurant.avg_price}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFavorite(restaurant.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => onNavigateToRestaurant(restaurant.id)} className="w-full py-2 bg-amber-50 text-sm text-amber-600 font-medium hover:bg-amber-100 transition-colors">
                  查看详情
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
