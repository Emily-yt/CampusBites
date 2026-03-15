import { useState, useMemo } from 'react';
import { X, Search, Check, Star, MapPin, Scale } from 'lucide-react';
import type { Restaurant } from '../lib/database.types';

interface RestaurantSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  selectedRestaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
  onStartCompare: () => void;
}

export function RestaurantSelectModal({
  isOpen,
  onClose,
  restaurants,
  selectedRestaurants,
  onSelect,
  onStartCompare,
}: RestaurantSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    const query = searchQuery.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.cuisine_type.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    );
  }, [restaurants, searchQuery]);

  function isSelected(restaurant: Restaurant) {
    return selectedRestaurants.some((r) => r.id === restaurant.id);
  }

  function getCuisineEmoji(cuisineType: string) {
    const emojiMap: { [key: string]: string } = {
      '中餐': '🥢',
      '西餐': '🍽️',
      '日料': '🍱',
      '韩餐': '🍲',
      '火锅': '🥘',
      '烧烤': '🍖',
      '快餐': '🍔',
      '甜品': '🍰',
    };
    return emojiMap[cuisineType] || '🍜';
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">选择餐厅进行对比</h2>
            <p className="text-sm text-gray-500 mt-1">
              已选择 {selectedRestaurants.length}/3 家餐厅
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索餐厅名称、菜系..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* 已选择的餐厅标签 */}
        {selectedRestaurants.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex flex-wrap gap-2">
              {selectedRestaurants.map((r) => (
                <span
                  key={r.id}
                  className="text-sm px-3 py-1.5 bg-white text-amber-700 rounded-full flex items-center gap-1.5 shadow-sm"
                >
                  {getCuisineEmoji(r.cuisine_type)} {r.name.slice(0, 8)}
                  {r.name.length > 8 && '...'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 餐厅列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500">未找到匹配的餐厅</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRestaurants.map((restaurant) => {
                const selected = isSelected(restaurant);
                const disabled =
                  !selected && selectedRestaurants.length >= 3;

                return (
                  <div
                    key={restaurant.id}
                    onClick={() => !disabled && onSelect(restaurant)}
                    className={`p-4 rounded-xl border transition-all ${
                      selected
                        ? 'border-amber-400 bg-amber-50'
                        : disabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-100 hover:border-amber-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 复选框 */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                          selected
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selected && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>

                      {/* 餐厅图标 */}
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {getCuisineEmoji(restaurant.cuisine_type)}
                      </div>

                      {/* 餐厅信息 */}
                      <div className="flex-1 min-w-0">
                        {/* 第一行：餐厅名称和菜系标签 */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-semibold text-gray-800 text-base truncate">
                            {restaurant.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs flex-shrink-0">
                            {restaurant.cuisine_type}
                          </span>
                        </div>

                        {/* 第二行：评分、价格 */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-gray-700">{restaurant.rating.toFixed(1)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-amber-600 font-medium">¥{restaurant.avg_price}</span>
                            <span className="text-gray-400">/人</span>
                          </span>
                        </div>

                        {/* 第三行：描述 */}
                        {restaurant.description && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-1 text-left">
                            {restaurant.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {selectedRestaurants.length < 2
                ? '请至少选择2家餐厅'
                : `已选择 ${selectedRestaurants.length} 家餐厅`}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={onStartCompare}
                disabled={selectedRestaurants.length < 2}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Scale size={18} />
                开始对比
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
