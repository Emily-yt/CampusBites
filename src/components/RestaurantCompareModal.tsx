import { X, Star, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import type { Restaurant } from '../lib/database.types';

interface RestaurantCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onNavigateToRestaurant: (id: string) => void;
}

export function RestaurantCompareModal({ 
  isOpen, 
  onClose, 
  restaurants, 
  onNavigateToRestaurant 
}: RestaurantCompareModalProps) {
  if (!isOpen || restaurants.length < 2) return null;

  const getCuisineEmoji = (cuisineType: string): string => {
    const map: { [key: string]: string } = {
      '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲',
      '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰',
    };
    return map[cuisineType] || '🍜';
  };

  const getBestValue = (values: number[], higherIsBetter: boolean) => {
    if (higherIsBetter) {
      const max = Math.max(...values);
      return (value: number) => value === max;
    } else {
      const min = Math.min(...values);
      return (value: number) => value === min;
    }
  };

  const prices = restaurants.map(r => r.avg_price);
  const ratings = restaurants.map(r => r.rating);

  const isBestPrice = getBestValue(prices, false);
  const isBestRating = getBestValue(ratings, true);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">餐厅对比</h2>
            <p className="text-sm text-gray-500 mt-1">
              共对比 {restaurants.length} 家餐厅
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] p-6">
            <div className="grid grid-cols-1 gap-6">
              {restaurants.map((restaurant, index) => (
                <div key={restaurant.id} className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    {getCuisineEmoji(restaurant.cuisine_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 
                          className="font-semibold text-gray-800 text-lg cursor-pointer hover:text-amber-600 transition-colors"
                          onClick={() => {
                            onClose();
                            onNavigateToRestaurant(restaurant.id);
                          }}
                        >
                          {restaurant.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                            {restaurant.cuisine_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="relative">
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-1">
                          <DollarSign size={14} />
                          <span>人均价格</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-bold ${isBestPrice(restaurant.avg_price) ? 'text-emerald-600' : 'text-gray-800'}`}>
                            ¥{restaurant.avg_price}
                          </span>
                          {isBestPrice(restaurant.avg_price) && (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-1">
                          <Star size={14} />
                          <span>评分</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-bold ${isBestRating(restaurant.rating) ? 'text-emerald-600' : 'text-gray-800'}`}>
                            {restaurant.rating.toFixed(1)}
                          </span>
                          {isBestRating(restaurant.rating) && (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {restaurant.hours && (
                      <div className="mt-3 flex items-center gap-1.5 text-gray-500 text-sm">
                        <Clock size={14} />
                        <span>{restaurant.hours}</span>
                      </div>
                    )}

                    {restaurant.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 text-left">
                        {restaurant.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">小提示</p>
                  <p className="text-xs text-gray-500 mt-1">
                    绿色标记表示该餐厅在该维度上表现最佳。点击餐厅名称可以查看详情。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
