import { useEffect, useState } from 'react';
import { Star, MapPin, ChevronRight, Clock, Users, Shuffle, Sparkles } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';
import { RandomPickerModal } from '../components/RandomPickerModal';
import { RestaurantQuickCompare } from '../components/RestaurantQuickCompare';
import { RestaurantCardSkeleton } from '../components/Skeleton';
import { QuickGuideCard } from '../components/QuickGuideCard';
import { restaurantApi } from '../lib/api';
import type { Restaurant } from '../lib/database.types';

interface HomePageProps {
  onNavigateToRestaurant: (id: string) => void;
  onNavigateToRankings?: () => void;
}

export function HomePage({ onNavigateToRestaurant, onNavigateToRankings }: HomePageProps) {
  const [todayRecommendations, setTodayRecommendations] = useState<Restaurant[]>([]);
  const [hotRestaurants, setHotRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  function handleDismissGuide() {
    setShowGuide(false);
    localStorage.setItem('hasSeenGuide', 'true');
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const startTime = Date.now();
    const minLoadingTime = 600;
    const today = new Date().toDateString();

    try {
      // 获取今日推荐（每天只刷新一次）
      let recommendationsData = null;
      const cachedRecommendations = localStorage.getItem('todayRecommendations');
      const cachedDate = localStorage.getItem('todayRecommendationsDate');
      
      if (cachedRecommendations && cachedDate === today) {
        recommendationsData = JSON.parse(cachedRecommendations);
        setTodayRecommendations(recommendationsData);
      } else {
        const { data: freshData } = await restaurantApi.getTodayRecommendations(3);
        if (freshData) {
          recommendationsData = freshData;
          setTodayRecommendations(recommendationsData);
          localStorage.setItem('todayRecommendations', JSON.stringify(recommendationsData));
          localStorage.setItem('todayRecommendationsDate', today);
        }
      }

      // 获取热门餐厅（最多评价）
      const { data: hotData } = await restaurantApi.getHotRestaurants(6);
      if (hotData) {
        setHotRestaurants(hotData);
      }

      // 获取所有餐厅用于随机选择（使用大的page_size获取所有餐厅）
      const { data: allData } = await restaurantApi.getAll({ page: 1, page_size: 1000 });
      if (allData?.data) {
        setAllRestaurants(allData.data);
      }
    } catch (error) {
      console.error('Error loading home page data:', error);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }

  function handleRandomPick() {
    if (allRestaurants.length === 0) return;
    setShowPickerModal(true);
  }

  function handleClosePicker() {
    setShowPickerModal(false);
  }

  function getCuisineEmoji(cuisineType: string) {
    const emojiMap: { [key: string]: string } = {
      '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲',
      '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰',
    };
    return emojiMap[cuisineType] || '🍜';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* 页面标题 */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* 随机决定今天吃什么 + 餐厅对比 */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 纠结今天吃什么 */}
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-48 mx-auto mb-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-56 mx-auto mb-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-24 mx-auto bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              {/* 餐厅对比 */}
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-48 mx-auto mb-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-56 mx-auto mb-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-9 w-24 mx-auto bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </section>

          {/* 今日推荐 */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
            </div>
          </section>

          {/* 热门榜单 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                  <div className="w-14 h-14 rounded-lg bg-gray-200 animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">发现校园美食</h1>
            <p className="text-gray-600 mt-1">为大学生精选周边美味</p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
          >
            <Sparkles size={18} />
            <span className="text-sm font-medium">快速入门</span>
          </button>
        </div>

        {/* 随机决定今天吃什么 + 餐厅对比 */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 纠结今天吃什么 */}
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-amber-300 hover:bg-amber-50/30 transition-all">
              <div className="text-6xl mb-3">🍽️</div>
              <h2 className="text-lg font-bold text-gray-700 mb-1">纠结今天吃什么？</h2>
              <p className="text-gray-500 text-sm mb-3">让我们帮你随机挑选三家餐厅！</p>
              <button
                onClick={handleRandomPick}
                className="bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Shuffle size={16} />
                开始随机
              </button>
            </div>

            {/* 餐厅对比 */}
            <RestaurantQuickCompare
              restaurants={allRestaurants}
              onNavigateToRestaurant={onNavigateToRestaurant}
            />
          </div>
        </section>

        {/* 今日推荐 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">今日推荐</h2>
            <span className="text-sm text-gray-400">精选高评分餐厅</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todayRecommendations.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => onNavigateToRestaurant(restaurant.id)}
                className="bg-white rounded-2xl border border-amber-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-amber-200 transition-all group flex flex-col h-full"
              >
                <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                  {getCuisineEmoji(restaurant.cuisine_type)}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg group-hover:text-amber-600 transition-colors truncate flex-1 min-w-0">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <FavoriteButton restaurantId={restaurant.id} size={18} />
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                        {restaurant.cuisine_type}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-shrink-0 min-h-[44px]">{restaurant.description}</p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Star size={14} className="text-yellow-500" fill="currentColor" /> 
                          <strong>{restaurant.rating.toFixed(1)}</strong>
                        </span>
                        <span className="text-gray-400">({restaurant.review_count}条)</span>
                      </div>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <span className="text-xs">人均</span>¥{restaurant.avg_price}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {restaurant.school}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {restaurant.hours}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 热门榜单 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-red-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-800">热门榜单</h2>
              <span className="text-sm text-gray-400">精选高评分餐厅</span>
            </div>
            <button 
              onClick={onNavigateToRankings}
              className="flex items-center gap-1 text-amber-600 text-sm hover:text-amber-700"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                onClick={() => onNavigateToRestaurant(restaurant.id)}
                className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
              >
                {/* 排名 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-red-500 text-white' :
                  index === 1 ? 'bg-orange-500 text-white' :
                  index === 2 ? 'bg-amber-500 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                
                {/* 图标 */}
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {getCuisineEmoji(restaurant.cuisine_type)}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate group-hover:text-amber-600 transition-colors">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" /> {restaurant.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {restaurant.review_count}条
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <span className="text-xs">人均</span>¥{restaurant.avg_price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <MapPin size={12} /> {restaurant.school}
                  </div>
                </div>
                
                {/* 收藏按钮和箭头 */}
                <div className="flex items-center gap-2">
                  <FavoriteButton restaurantId={restaurant.id} size={18} />
                  <ChevronRight className="text-gray-300 group-hover:text-amber-400 transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 随机选择弹窗 */}
      <RandomPickerModal
        isOpen={showPickerModal}
        allRestaurants={allRestaurants}
        onClose={handleClosePicker}
        onSelectRestaurant={onNavigateToRestaurant}
      />

      {/* 快速入门引导 */}
      {showGuide && <QuickGuideCard onDismiss={handleDismissGuide} />}
    </div>
  );
}
