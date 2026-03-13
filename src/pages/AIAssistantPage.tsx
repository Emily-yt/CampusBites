import { useState } from 'react';
import { Sparkles, Send, Star, DollarSign, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface AIAssistantPageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function AIAssistantPage({ onNavigateToRestaurant }: AIAssistantPageProps) {
  const [budget, setBudget] = useState(50);
  const [distance, setDistance] = useState(3);
  const [cuisinePreference, setCuisinePreference] = useState('');
  const [occasion, setOccasion] = useState('');
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const cuisineTypes = ['中餐', '西餐', '日料', '韩餐', '火锅', '烧烤', '快餐', '甜品'];
  const occasions = ['日常用餐', '约会聚餐', '深夜加餐', '朋友聚会', '独自用餐', '快速解决'];

  async function getRecommendations() {
    setLoading(true);
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .lte('avg_price', budget)
        .lte('distance_km', distance);

      if (cuisinePreference) {
        query = query.eq('cuisine_type', cuisinePreference);
      }

      if (occasion === '深夜加餐') {
        query = query.eq('is_late_night', true);
      }

      if (occasion === '约会聚餐') {
        query = query.gte('rating', 4.5);
      }

      if (occasion === '快速解决') {
        query = query.lte('distance_km', 1.5);
      }

      const { data } = await query.order('rating', { ascending: false }).limit(5);

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> 吃饭助手</span>
          </h1>
          <p className="text-gray-600 text-lg">告诉我你的需求，让AI帮你找到完美的餐厅</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                预算范围: ¥{budget}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-green-200 to-green-400 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>¥10</span>
                <span>¥200</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                最远距离: {distance}km
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5km</span>
                <span>10km</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                想吃什么菜系？
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setCuisinePreference('')}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    cuisinePreference === ''
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  都可以
                </button>
                {cuisineTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCuisinePreference(type)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      cuisinePreference === type
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                用餐场景？
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setOccasion(occ)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      occasion === occ
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={getRecommendations}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>AI正在分析...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>获取AI推荐</span>
                </>
              )}
            </button>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI推荐结果</h2>
                <p className="text-gray-600 text-sm">为你找到{recommendations.length}家符合条件的餐厅</p>
              </div>
            </div>

            <div className="space-y-4">
              {recommendations.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  onClick={() => onNavigateToRestaurant(restaurant.id)}
                  className="flex items-center space-x-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-purple-200"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      {index + 1}
                    </div>
                  </div>

                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    🍽️
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                          {restaurant.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-1">{restaurant.description}</p>
                      </div>
                      <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-600 text-sm font-medium rounded-lg flex-shrink-0">
                        {restaurant.cuisine_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-1">
                        <Star className="text-yellow-500" size={16} fill="currentColor" />
                        <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="font-medium text-gray-900">¥{restaurant.avg_price}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <MapPin size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-600">{restaurant.distance_km}km</span>
                      </div>

                      {restaurant.avg_price <= budget * 0.7 && (
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded">
                          超值
                        </span>
                      )}

                      {restaurant.rating >= 4.5 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs font-bold rounded">
                          高分
                        </span>
                      )}

                      {restaurant.distance_km <= 1 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded">
                          超近
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">设置你的需求</h3>
            <p className="text-gray-600">告诉AI你的预算、距离和口味偏好，让我为你推荐最合适的餐厅</p>
          </div>
        )}
      </div>
    </div>
  );
}
