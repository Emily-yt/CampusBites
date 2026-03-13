import { useEffect, useState } from 'react';
import { Filter, Star, MapPin, DollarSign, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Restaurant } from '../lib/database.types';

interface ExplorePageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function ExplorePage({ onNavigateToRestaurant }: ExplorePageProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    school: 'all',
    maxDistance: 10,
    maxPrice: 1000,
    cuisineType: 'all',
  });

  const schools = ['all', '北京大学', '清华大学', '人民大学', '北京师范大学'];
  const cuisineTypes = ['all', '中餐', '西餐', '日料', '韩餐', '火锅', '烧烤', '快餐', '甜品'];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [restaurants, filters]);

  async function loadRestaurants() {
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false });

      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...restaurants];

    if (filters.school !== 'all') {
      filtered = filtered.filter(r => r.school === filters.school);
    }

    if (filters.cuisineType !== 'all') {
      filtered = filtered.filter(r => r.cuisine_type === filters.cuisineType);
    }

    filtered = filtered.filter(r => r.distance_km <= filters.maxDistance);
    filtered = filtered.filter(r => r.avg_price <= filters.maxPrice);

    setFilteredRestaurants(filtered);
  }

  function resetFilters() {
    setFilters({
      school: 'all',
      maxDistance: 10,
      maxPrice: 1000,
      cuisineType: 'all',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">地图探索</h1>
            <p className="text-gray-600">找到{filteredRestaurants.length}家餐厅</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
          >
            <Filter size={20} />
            <span className="font-medium">筛选</span>
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">筛选条件</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                重置
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学校
                </label>
                <select
                  value={filters.school}
                  onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {schools.map(school => (
                    <option key={school} value={school}>
                      {school === 'all' ? '全部学校' : school}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  菜系类型
                </label>
                <select
                  value={filters.cuisineType}
                  onChange={(e) => setFilters({ ...filters, cuisineType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {cuisineTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? '全部菜系' : type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大距离: {filters.maxDistance}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ ...filters, maxDistance: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最高价格: ¥{filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => onNavigateToRestaurant(restaurant.id)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group border border-gray-100"
            >
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  🍽️
                </div>
                {restaurant.is_new && (
                  <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    新店
                  </span>
                )}
                {restaurant.is_late_night && (
                  <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    深夜营业
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors flex-1">
                    {restaurant.name}
                  </h3>
                  <span className="ml-2 px-2 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded">
                    {restaurant.cuisine_type}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {restaurant.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-500" size={16} fill="currentColor" />
                      <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({restaurant.review_count}条)</span>
                    </div>
                    <span className="text-orange-600 font-bold text-lg">¥{restaurant.avg_price}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-1 text-blue-500" />
                    <span>{restaurant.school}</span>
                    <span className="mx-2">·</span>
                    <span>{restaurant.distance_km}km</span>
                  </div>
                </div>

                {restaurant.hours && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    营业时间: {restaurant.hours}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">没有找到符合条件的餐厅</h3>
            <p className="text-gray-600 mb-4">试试调整筛选条件</p>
            <button
              onClick={resetFilters}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-all"
            >
              重置筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
