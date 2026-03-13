import { useEffect, useState } from 'react';
import { Trophy, DollarSign, Moon, Sparkles, Star, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface RankingsPageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function RankingsPage({ onNavigateToRestaurant }: RankingsPageProps) {
  const [activeRanking, setActiveRanking] = useState<'popular' | 'value' | 'latenight' | 'new'>('popular');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [activeRanking]);

  async function loadRankings() {
    setLoading(true);
    try {
      let query = supabase.from('restaurants').select('*');

      switch (activeRanking) {
        case 'popular':
          query = query.order('rating', { ascending: false }).order('review_count', { ascending: false });
          break;
        case 'value':
          query = query.order('avg_price', { ascending: true }).gte('rating', 4);
          break;
        case 'latenight':
          query = query.eq('is_late_night', true).order('rating', { ascending: false });
          break;
        case 'new':
          query = query.eq('is_new', true).order('created_at', { ascending: false });
          break;
      }

      const { data } = await query.limit(20);
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  }

  const rankings = [
    {
      id: 'popular',
      name: '学生最爱榜',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      description: '口碑最好的人气餐厅',
    },
    {
      id: 'value',
      name: '性价比榜',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      description: '物美价廉的实惠之选',
    },
    {
      id: 'latenight',
      name: '深夜食堂榜',
      icon: Moon,
      color: 'from-blue-500 to-purple-500',
      description: '深夜也能满足你的胃',
    },
    {
      id: 'new',
      name: '新店榜',
      icon: Sparkles,
      color: 'from-pink-500 to-red-500',
      description: '最新开业值得尝试',
    },
  ];

  const currentRanking = rankings.find(r => r.id === activeRanking);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            美食
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> 推荐榜单</span>
          </h1>
          <p className="text-gray-600 text-lg">发现最受学生欢迎的美食好店</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {rankings.map((ranking) => {
            const Icon = ranking.icon;
            const isActive = activeRanking === ranking.id;
            return (
              <button
                key={ranking.id}
                onClick={() => setActiveRanking(ranking.id as typeof activeRanking)}
                className={`p-6 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-white shadow-xl scale-105 ring-2 ring-orange-500'
                    : 'bg-white/80 shadow-md hover:shadow-lg hover:scale-102'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ranking.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className={`font-bold mb-2 ${isActive ? 'text-orange-600' : 'text-gray-900'}`}>
                  {ranking.name}
                </h3>
                <p className="text-sm text-gray-600">{ranking.description}</p>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              {currentRanking && (
                <>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentRanking.color} flex items-center justify-center`}>
                    <currentRanking.icon className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentRanking.name}</h2>
                    <p className="text-gray-600 text-sm">{currentRanking.description}</p>
                  </div>
                </>
              )}
            </div>

            {restaurants.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">暂无数据</h3>
                <p className="text-gray-600">该榜单暂时没有餐厅</p>
              </div>
            ) : (
              <div className="space-y-4">
                {restaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    onClick={() => onNavigateToRestaurant(restaurant.id)}
                    className="flex items-center space-x-4 p-5 bg-gray-50 rounded-xl hover:bg-orange-50 hover:shadow-md transition-all cursor-pointer group border border-gray-100"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                        'bg-white text-gray-700 border-2 border-gray-200'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
                      🍽️
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                            {restaurant.name}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-1">{restaurant.description}</p>
                        </div>
                        <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-600 text-sm font-medium rounded-lg flex-shrink-0">
                          {restaurant.cuisine_type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-1">
                          <Star className="text-yellow-500" size={16} fill="currentColor" />
                          <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">({restaurant.review_count}条)</span>
                        </div>

                        <div className="flex items-center space-x-1 text-gray-600">
                          <DollarSign size={16} className="text-green-500" />
                          <span className="font-medium">¥{restaurant.avg_price}</span>
                        </div>

                        <div className="flex items-center space-x-1 text-gray-600">
                          <MapPin size={16} className="text-blue-500" />
                          <span className="text-sm">{restaurant.school}</span>
                          <span className="text-sm">· {restaurant.distance_km}km</span>
                        </div>

                        {restaurant.is_late_night && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                            深夜营业
                          </span>
                        )}

                        {restaurant.is_new && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded">
                            新店
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
