import { useEffect, useState } from 'react';
import { Trophy, DollarSign, Moon, Sparkles, Star, ArrowLeft, MapPin } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';
import { RankingsCardSkeleton, Pagination } from '../components/Skeleton';
import { restaurantApi } from '../lib/api';
import type { Restaurant } from '../lib/database.types';

interface RankingsPageProps {
  onNavigateToRestaurant: (id: string) => void;
  onBack?: () => void;
}

export function RankingsPage({ onNavigateToRestaurant, onBack }: RankingsPageProps) {
  const [activeRanking, setActiveRanking] = useState<'popular' | 'value' | 'latenight' | 'new'>('popular');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadAllRestaurants();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [activeRanking, allRestaurants]);

  async function loadAllRestaurants() {
    try {
      setLoading(true);
      const { data } = await restaurantApi.getAll({ page: 1, page_size: 1000 });
      if (data?.data) {
        setAllRestaurants(data.data);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadRankings() {
    setLoading(true);
    let sortedRestaurants = [...allRestaurants];
    
    switch (activeRanking) {
      case 'popular':
        sortedRestaurants.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.review_count - a.review_count;
        });
        break;
      case 'value':
        sortedRestaurants = sortedRestaurants.filter(r => r.rating >= 4);
        sortedRestaurants.sort((a, b) => a.avg_price - b.avg_price);
        break;
      case 'latenight':
        sortedRestaurants = sortedRestaurants.filter(r => isLateNightRestaurant(r.hours));
        sortedRestaurants.sort((a, b) => b.rating - a.rating);
        break;
      case 'new':
        sortedRestaurants = sortedRestaurants.filter(r => r.is_new);
        sortedRestaurants.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    setRestaurants(sortedRestaurants);
    setCurrentPage(1);
    setLoading(false);
  }

  const totalPages = Math.ceil(restaurants.length / pageSize);
  const currentRestaurants = restaurants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const rankings = [
    { id: 'popular', name: '学生最爱', icon: Trophy },
    { id: 'value', name: '性价比', icon: DollarSign },
    { id: 'latenight', name: '深夜食堂', icon: Moon },
    { id: 'new', name: '新店', icon: Sparkles },
  ];

  function isLateNightRestaurant(hours?: string): boolean {
    if (!hours) return false

    const timeRanges = hours.split(/[,，]/).map(s => s.trim()).filter(Boolean)

    for (const range of timeRanges) {
      const match = range.match(/(\d{1,2}):?(\d{2})?\s*[-~至]\s*(\d{1,2}):?(\d{2})?/)
      if (!match) continue

      const endHour = parseInt(match[3])
      const endMinute = parseInt(match[4] || '0')
      const endTime = endHour * 60 + endMinute
      
      // 如果结束时间在22:00以后，或者跨天营业（结束时间 ≤ 开始时间）
      const startHour = parseInt(match[1])
      const startMinute = parseInt(match[2] || '0')
      const startTime = startHour * 60 + startMinute
      
      if (endTime >= 22 * 60 || endTime <= startTime) {
        return true
      }
    }

    return false
  }

  function getCuisineEmoji(cuisineType: string) {
    const map: { [key: string]: string } = { '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲', '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰' };
    return map[cuisineType] || '🍜';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-48 bg-gray-200 rounded mt-1 ml-13 animate-pulse"></div>
          </div>

          {/* 榜单标签 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* 餐厅列表骨架屏 */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <RankingsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
              title="返回首页"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">推荐榜单</h1>
          </div>
          <p className="text-gray-600 mt-1 ml-11">发现最受欢迎的校园美食</p>
        </div>

        {/* 榜单标签 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {rankings.map((ranking) => {
            const Icon = ranking.icon;
            const isActive = activeRanking === ranking.id;
            return (
              <button
                key={ranking.id}
                onClick={() => setActiveRanking(ranking.id as typeof activeRanking)}
                className={`p-4 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-amber-100 text-gray-600 hover:bg-amber-50'
                }`}
              >
                <Icon size={20} className="mx-auto mb-1" />
                <div className="text-sm font-medium">{ranking.name}</div>
              </button>
            );
          })}
        </div>

        {/* 餐厅列表 */}
        {restaurants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600">暂无数据</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  onClick={() => onNavigateToRestaurant(restaurant.id)}
                  className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index + (currentPage - 1) * pageSize < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + (currentPage - 1) * pageSize + 1}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl">
                    {getCuisineEmoji(restaurant.cuisine_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{restaurant.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {restaurant.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <span className="text-xs">人均</span>¥{restaurant.avg_price}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <MapPin size={12} />
                        {restaurant.school}
                      </span>
                    </div>
                  </div>
                  <FavoriteButton restaurantId={restaurant.id} size={18} />
                </div>
              ))}
            </div>

            {/* 分页组件 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
