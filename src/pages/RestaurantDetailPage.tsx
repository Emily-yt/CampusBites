import { useEffect, useState } from 'react';
import { ArrowLeft, Star, MapPin, DollarSign, Phone, Clock, Share2 } from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';
import { restaurantApi, menuApi, reviewApi } from '../lib/api';
import type { Restaurant, Review, MenuItem } from '../lib/database.types';

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
}

export function RestaurantDetailPage({ restaurantId, onBack }: RestaurantDetailPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, content: '' });

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  async function loadRestaurantData() {
    setLoading(true);
    const startTime = Date.now();
    const minLoadingTime = 600;

    try {
      // 从后端 API 获取餐厅详情
      const { data: restaurantData } = await restaurantApi.getById(restaurantId);
      if (restaurantData) {
        setRestaurant(restaurantData);
        
        // 获取菜单
        const { data: menuData } = await menuApi.getByRestaurantId(restaurantId);
        setMenuItems(menuData || []);
        
        // 获取评价
        const { data: reviewsData } = await reviewApi.getByRestaurantId(restaurantId);
        setReviews(reviewsData || []);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }

  async function submitReview() {
    if (!newReview.userName || !newReview.content || !restaurant) return;
    
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
    const map: { [key: string]: string } = { '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲', '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰' };
    return map[cuisineType] || '🍜';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600">未找到该餐厅</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
            <ArrowLeft size={18} /> <span>返回</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-amber-50 rounded-full transition-colors">
              <Share2 size={18} />
            </button>
            <FavoriteButton restaurantId={restaurantId} size={20} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* 餐厅头部 */}
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden mb-6">
          <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-7xl">
            {getCuisineEmoji(restaurant.cuisine_type)}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
                <span className="text-sm text-amber-600 font-medium">{restaurant.cuisine_type}</span>
              </div>
            </div>
            
            {/* 核心信息 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1"><Star size={12} /> 评分</div>
                <div className="font-bold text-gray-800 text-lg">{restaurant.rating.toFixed(1)}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1"><DollarSign size={12} /> 人均</div>
                <div className="font-bold text-gray-800 text-lg">¥{restaurant.avg_price}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 text-xs mb-1"><Clock size={12} /> 营业</div>
                <div className="font-bold text-gray-800">{restaurant.hours || '-'}</div>
              </div>
            </div>

            {/* 联系信息 */}
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin size={14} className="text-amber-500" /> {restaurant.address}</span>
              {restaurant.phone && <span className="flex items-center gap-1"><Phone size={14} className="text-amber-500" /> {restaurant.phone}</span>}
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="flex border-b border-amber-100">
            <button onClick={() => setActiveTab('menu')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'menu' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}>菜单 ({menuItems.length})</button>
            <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'reviews' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}>评价 ({reviews.length})</button>
          </div>

          <div className="p-5">
            {activeTab === 'menu' && (
              <div>
                {menuItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-gray-600">暂无菜单</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {menuItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                        <span className="w-6 h-6 flex items-center justify-center text-xs bg-amber-200 text-amber-700 rounded-full flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800 truncate flex-1">{item.name}</span>
                        {item.is_recommended && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded flex-shrink-0">推荐</span>}
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
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-full hover:bg-amber-600 transition-colors">
                    {showReviewForm ? '取消' : '写评价'}
                  </button>
                </div>

                {showReviewForm && (
                  <div className="bg-amber-50 p-4 rounded-xl mb-4">
                    <input type="text" placeholder="昵称" value={newReview.userName} onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm mb-3 focus:outline-none focus:border-amber-400" />
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setNewReview({ ...newReview, rating: r })}><Star size={24} className={r <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'} fill={r <= newReview.rating ? 'currentColor' : 'none'} /></button>
                      ))}
                    </div>
                    <textarea placeholder="评价内容" value={newReview.content} onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm mb-3 focus:outline-none focus:border-amber-400" rows={3} />
                    <button onClick={submitReview} disabled={!newReview.userName || !newReview.content} className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">提交</button>
                  </div>
                )}

                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-600">暂无评价</p>
                    </div>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="p-4 bg-amber-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{review.user_name}</span>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{Array(5).fill(0).map((_, i) => <Star key={i} size={12} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'} fill={i < review.rating ? 'currentColor' : 'none'} />)}</span>
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
  );
}
