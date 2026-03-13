import { useEffect, useState } from 'react';
import { ArrowLeft, Star, MapPin, DollarSign, Phone, Clock, Heart, ThumbsUp } from 'lucide-react';
import { supabase, getUserSession } from '../lib/supabase';
import type { Restaurant, Review, MenuItem } from '../lib/database.types';

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
}

export function RestaurantDetailPage({ restaurantId, onBack }: RestaurantDetailPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, content: '' });

  useEffect(() => {
    loadRestaurantData();
    checkFavorite();
  }, [restaurantId]);

  async function loadRestaurantData() {
    try {
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('is_recommended', { ascending: false });

      setRestaurant(restaurantData);
      setReviews(reviewsData || []);
      setMenuItems(menuData || []);
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkFavorite() {
    try {
      const session = getUserSession();
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_session', session)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  }

  async function toggleFavorite() {
    try {
      const session = getUserSession();

      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_session', session)
          .eq('restaurant_id', restaurantId);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_session: session, restaurant_id: restaurantId });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async function submitReview() {
    if (!newReview.userName || !newReview.content) return;

    try {
      await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        user_name: newReview.userName,
        rating: newReview.rating,
        content: newReview.content,
      });

      setNewReview({ userName: '', rating: 5, content: '' });
      setShowReviewForm(false);
      loadRestaurantData();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  }

  if (loading || !restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">返回</span>
          </button>
          <button
            onClick={toggleFavorite}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              isFavorite
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            <span className="font-medium">{isFavorite ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-100">
          <div className="h-64 bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 flex items-center justify-center text-8xl">
            🍽️
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                <p className="text-gray-600 text-lg">{restaurant.description}</p>
              </div>
              <span className="ml-4 px-4 py-2 bg-orange-50 text-orange-600 font-medium rounded-lg">
                {restaurant.cuisine_type}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="text-yellow-500" size={20} fill="currentColor" />
                  <span className="text-sm text-gray-600 font-medium">评分</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{restaurant.rating.toFixed(1)}</div>
                <div className="text-xs text-gray-500">{restaurant.review_count}条评价</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="text-green-500" size={20} />
                  <span className="text-sm text-gray-600 font-medium">人均</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">¥{restaurant.avg_price}</div>
                <div className="text-xs text-gray-500">价格适中</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="text-blue-500" size={20} />
                  <span className="text-sm text-gray-600 font-medium">距离</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{restaurant.distance_km}km</div>
                <div className="text-xs text-gray-500">{restaurant.school}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="text-purple-500" size={20} />
                  <span className="text-sm text-gray-600 font-medium">营业</span>
                </div>
                <div className="text-sm font-bold text-gray-900 mt-2">{restaurant.hours || '全天'}</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin className="text-blue-500" size={20} />
                  <div>
                    <div className="text-sm text-gray-500">地址</div>
                    <div className="font-medium">{restaurant.address}</div>
                  </div>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="text-green-500" size={20} />
                    <div>
                      <div className="text-sm text-gray-500">电话</div>
                      <div className="font-medium">{restaurant.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('menu')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'menu'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                菜单 ({menuItems.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                评价 ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'menu' && (
              <div className="space-y-4">
                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-gray-500">暂无菜单信息</p>
                  </div>
                ) : (
                  menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                          {item.is_recommended && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                              推荐
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        )}
                      </div>
                      <div className="ml-4 text-xl font-bold text-orange-600">
                        ¥{item.price.toFixed(0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">学生评价</h3>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all font-medium"
                  >
                    {showReviewForm ? '取消' : '写评价'}
                  </button>
                </div>

                {showReviewForm && (
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          昵称
                        </label>
                        <input
                          type="text"
                          value={newReview.userName}
                          onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="输入你的昵称"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          评分
                        </label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setNewReview({ ...newReview, rating })}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={32}
                                className={rating <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}
                                fill={rating <= newReview.rating ? 'currentColor' : 'none'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          评价内容
                        </label>
                        <textarea
                          value={newReview.content}
                          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                          rows={4}
                          placeholder="分享你的用餐体验..."
                        />
                      </div>

                      <button
                        onClick={submitReview}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all font-medium"
                      >
                        提交评价
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-500">暂无评价，来写第一条吧</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-6 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bold text-gray-900 mb-1">{review.user_name}</div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}
                                    fill={star <= review.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-orange-600 transition-colors">
                            <ThumbsUp size={16} />
                            <span className="text-sm">{review.helpful_count}</span>
                          </button>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.content}</p>
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
