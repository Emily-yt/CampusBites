import { useEffect, useState } from 'react';
import { X, Star, MapPin, DollarSign, Phone, Clock, Heart } from 'lucide-react';
import { restaurantApi, menuApi, reviewApi, favoriteApi } from '../lib/api';
import { getUserSession, getCurrentUser } from '../lib/supabase';
import type { Restaurant, Review, MenuItem } from '../lib/database.types';
import { CheckInButton } from './CheckInButton';
import { RestaurantDetailSkeleton } from './Skeleton';

interface RestaurantDetailModalProps {
  restaurantId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantDetailModal({ restaurantId, isOpen, onClose }: RestaurantDetailModalProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, content: '' });
  
  // 收藏状态管理
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // 当前用户ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // 获取当前用户
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (isOpen && restaurantId) {
      loadRestaurantData();
    }
  }, [isOpen, restaurantId]);

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setRestaurant(null);
      setReviews([]);
      setMenuItems([]);
      setActiveTab('menu');
      setShowReviewForm(false);
      setNewReview({ userName: '', rating: 5, content: '' });
      setIsFavorite(false);
    }
  }, [isOpen]);

  async function loadRestaurantData() {
    if (!restaurantId) return;

    setLoading(true);
    const startTime = Date.now();
    const minLoadingTime = 600; // 最小显示骨架屏时间 600ms

    try {
      // 并行获取餐厅详情和收藏状态
      const session = getUserSession();
      const [
        { data: restaurantData },
        { data: menuData },
        { data: reviewsData },
        { data: favoriteData }
      ] = await Promise.all([
        restaurantApi.getById(restaurantId),
        menuApi.getByRestaurantId(restaurantId),
        reviewApi.getByRestaurantId(restaurantId),
        favoriteApi.checkFavorite(restaurantId, session)
      ]);

      if (restaurantData) {
        setRestaurant(restaurantData);
        setMenuItems(menuData || []);
        setReviews(reviewsData || []);
        setIsFavorite(!!favoriteData);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      // 确保骨架屏至少显示 minLoadingTime 时间
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (isToggling || !restaurantId) return;

    const newFavoriteState = !isFavorite;
    
    // 先更新 UI，让用户立即看到反馈
    setIsFavorite(newFavoriteState);
    setIsToggling(true);
    
    try {
      const session = getUserSession();
      
      if (newFavoriteState) {
        await favoriteApi.addFavorite(restaurantId, session);
      } else {
        await favoriteApi.removeFavorite(restaurantId, session);
      }
      
      localStorage.setItem('favorites_updated', Date.now().toString());
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // 如果请求失败，恢复原来的状态
      setIsFavorite(!newFavoriteState);
    } finally {
      setIsToggling(false);
    }
  }

  async function submitReview() {
    if (!newReview.userName || !newReview.content || !restaurant || !restaurantId) return;
    
    try {
      const reviewData = {
        restaurant_id: restaurantId,
        user_name: newReview.userName,
        rating: newReview.rating,
        content: newReview.content,
        images: [],
      };
      
      await reviewApi.create(reviewData);
      
      // 重新加载评价
      const { data: reviewsData } = await reviewApi.getByRestaurantId(restaurantId);
      setReviews(reviewsData || []);
      
      setNewReview({ userName: '', rating: 5, content: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  }

  function getCuisineEmoji(cuisineType: string) {
    const map: { [key: string]: string } = {
      '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲',
      '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '西式快餐': '🍔', '披萨': '🍕', '甜品': '🍰'
    };
    return map[cuisineType] || '🍜';
  }

  // 点击背景关闭弹窗
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* 顶部导航 */}
        <div className="bg-white border-b border-amber-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 truncate flex-1">
            {restaurant?.name || '餐厅详情'}
          </h2>
          <div className="flex items-center gap-2">
            {restaurantId && !loading && (
              <button
                onClick={toggleFavorite}
                disabled={isToggling}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isFavorite 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-amber-50'
                } ${isToggling ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Heart 
                  size={20} 
                  fill={isFavorite ? 'currentColor' : 'none'}
                  className={isToggling ? 'animate-pulse' : ''}
                />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
          {loading ? (
            <RestaurantDetailSkeleton />
          ) : !restaurant ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-gray-600">未找到该餐厅</p>
            </div>
          ) : (
            <div>
              {/* 餐厅头部 */}
              <div className="relative">
                <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-6xl">
                  {getCuisineEmoji(restaurant.cuisine_type)}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
                    <span className="text-sm text-amber-600 font-medium">{restaurant.cuisine_type}</span>
                  </div>
                  {restaurant.id && (
                    <CheckInButton restaurantId={restaurant.id} userId={currentUserId} />
                  )}
                </div>
                <p className="text-gray-600 mb-4 text-sm">{restaurant.description}</p>
                
                {/* 核心信息 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1">
                      <Star size={10} /> 评分
                    </div>
                    <div className="font-bold text-gray-800 text-base">{restaurant.rating.toFixed(1)}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1">
                      <DollarSign size={10} /> 人均
                    </div>
                    <div className="font-bold text-gray-800 text-base">¥{restaurant.avg_price}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1">
                      <Clock size={10} /> 营业
                    </div>
                    <div className="font-bold text-gray-800 text-sm">{restaurant.hours || '-'}</div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="flex flex-col gap-1 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-amber-500" /> {restaurant.address}
                  </span>
                  {restaurant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} className="text-amber-500" /> {restaurant.phone}
                    </span>
                  )}
                </div>

                {/* 标签页 */}
                <div className="border border-amber-100 rounded-xl overflow-hidden">
                  <div className="flex border-b border-amber-100">
                    <button 
                      onClick={() => setActiveTab('menu')} 
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === 'menu' 
                          ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      菜单 ({menuItems.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('reviews')} 
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === 'reviews' 
                          ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      评价 ({reviews.length})
                    </button>
                  </div>

                  <div className="p-4">
                    {activeTab === 'menu' && (
                      <div>
                        {menuItems.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-gray-600">暂无菜单</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {menuItems.map(item => (
                              <div 
                                key={item.id} 
                                className="p-3 bg-amber-50 rounded-xl"
                              >
                                <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                                {item.is_recommended && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                                    推荐
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500">{reviews.length} 条评价</span>
                          <button 
                            onClick={() => setShowReviewForm(!showReviewForm)} 
                            className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-full hover:bg-amber-600 transition-colors"
                          >
                            {showReviewForm ? '取消' : '写评价'}
                          </button>
                        </div>

                        {showReviewForm && (
                          <div className="bg-amber-50 p-4 rounded-xl mb-4">
                            <input 
                              type="text" 
                              placeholder="昵称" 
                              value={newReview.userName} 
                              onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })} 
                              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm mb-3 focus:outline-none focus:border-amber-400" 
                            />
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map(r => (
                                <button 
                                  key={r} 
                                  onClick={() => setNewReview({ ...newReview, rating: r })}
                                >
                                  <Star 
                                    size={20} 
                                    className={r <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'} 
                                    fill={r <= newReview.rating ? 'currentColor' : 'none'} 
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea 
                              placeholder="评价内容" 
                              value={newReview.content} 
                              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} 
                              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm mb-3 focus:outline-none focus:border-amber-400" 
                              rows={3} 
                            />
                            <button 
                              onClick={submitReview} 
                              disabled={!newReview.userName || !newReview.content} 
                              className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                              提交
                            </button>
                          </div>
                        )}

                        <div className="space-y-3">
                          {reviews.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-3">💬</div>
                              <p className="text-gray-600">暂无评价</p>
                            </div>
                          ) : (
                            reviews.map(review => (
                              <div key={review.id} className="p-3 bg-amber-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-800 text-sm">{review.user_name}</span>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>
                                      {Array(5).fill(0).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          size={10} 
                                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'} 
                                          fill={i < review.rating ? 'currentColor' : 'none'} 
                                        />
                                      ))}
                                    </span>
                                    <span>{new Date(review.created_at).toLocaleDateString('zh-CN')}</span>
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm">{review.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
