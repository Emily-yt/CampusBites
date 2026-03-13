import { useEffect, useState } from 'react';
import { Star, MapPin, DollarSign, Shuffle, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface HomePageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function HomePage({ onNavigateToRestaurant }: HomePageProps) {
  const [todayRecommendations, setTodayRecommendations] = useState<Restaurant[]>([]);
  const [hotRestaurants, setHotRestaurants] = useState<Restaurant[]>([]);
  const [randomRestaurant, setRandomRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: recommended } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })
        .limit(3);

      const { data: hot } = await supabase
        .from('restaurants')
        .select('*')
        .order('review_count', { ascending: false })
        .limit(6);

      setTodayRecommendations(recommended || []);
      setHotRestaurants(hot || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getRandomRestaurant() {
    try {
      const { data, count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: false });

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setRandomRestaurant(data[randomIndex]);
      }
    } catch (error) {
      console.error('Error getting random restaurant:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            发现校园周边
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> 美食宝藏</span>
          </h1>
          <p className="text-gray-600 text-lg">为大学生量身定制的美食探索平台</p>
        </div>

        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl">
                <Shuffle className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">今天吃什么？</h2>
            </div>
            <button
              onClick={getRandomRestaurant}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg font-medium"
            >
              随机推荐
            </button>
          </div>

          {randomRestaurant && (
            <div
              onClick={() => onNavigateToRestaurant(randomRestaurant.id)}
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all border border-orange-100"
            >
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-4xl shadow-sm">
                  🍽️
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{randomRestaurant.name}</h3>
                  <p className="text-gray-600 mb-3">{randomRestaurant.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-lg text-sm">
                      <Star className="text-yellow-500" size={16} fill="currentColor" />
                      <span className="font-medium">{randomRestaurant.rating.toFixed(1)}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-lg text-sm">
                      <DollarSign className="text-green-500" size={16} />
                      <span>¥{randomRestaurant.avg_price}/人</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-lg text-sm">
                      <MapPin className="text-blue-500" size={16} />
                      <span>{randomRestaurant.distance_km}km</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-2 rounded-lg">
              <TrendingUp className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">今日推荐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {todayRecommendations.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => onNavigateToRestaurant(restaurant.id)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group border border-gray-100"
              >
                <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  🍜
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-500" size={16} fill="currentColor" />
                      <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({restaurant.review_count})</span>
                    </div>
                    <span className="text-orange-600 font-bold">¥{restaurant.avg_price}</span>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <MapPin size={14} className="mr-1" />
                    <span>{restaurant.school} · {restaurant.distance_km}km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-2 rounded-lg">
              <Clock className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">热门榜单</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                onClick={() => onNavigateToRestaurant(restaurant.id)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 flex items-center space-x-4 group"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="text-yellow-500" size={14} fill="currentColor" />
                      <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-500">{restaurant.review_count}条评价</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
