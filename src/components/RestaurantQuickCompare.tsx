import { useState } from 'react';
import { Scale, X, Shuffle } from 'lucide-react';
import { RestaurantCompareModal } from './RestaurantCompareModal';
import { RestaurantSelectModal } from './RestaurantSelectModal';
import type { Restaurant } from '../lib/database.types';

interface RestaurantQuickCompareProps {
  restaurants: Restaurant[];
  onNavigateToRestaurant: (id: string) => void;
}

export function RestaurantQuickCompare({ restaurants, onNavigateToRestaurant }: RestaurantQuickCompareProps) {
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);

  function toggleRestaurant(restaurant: Restaurant) {
    setSelectedRestaurants((prev) => {
      const isSelected = prev.some((r) => r.id === restaurant.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== restaurant.id);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, restaurant];
      }
    });
  }

  function isSelected(restaurant: Restaurant) {
    return selectedRestaurants.some((r) => r.id === restaurant.id);
  }

  function startCompare() {
    if (selectedRestaurants.length >= 2) {
      setShowCompareModal(true);
    }
  }

  function clearSelection() {
    setSelectedRestaurants([]);
  }

  function handleOpenSelectModal() {
    setShowSelectModal(true);
  }

  function handleCloseSelectModal() {
    setShowSelectModal(false);
  }

  function handleStartCompareFromSelect() {
    setShowSelectModal(false);
    setShowCompareModal(true);
  }

  function getCuisineEmoji(cuisineType: string) {
    const emojiMap: { [key: string]: string } = {
      '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲',
      '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰',
    };
    return emojiMap[cuisineType] || '🍜';
  }

  return (
    <div className="bg-white border-2 border-dashed border-amber-200 rounded-2xl p-6 text-center hover:border-amber-300 hover:bg-amber-50/30 transition-all">
      <div className="text-6xl mb-3">⚖️</div>
      <h2 className="text-lg font-bold text-gray-700 mb-1">对比餐厅</h2>
      <p className="text-gray-500 text-sm mb-3">选择2-3家餐厅进行对比</p>
      
      <button
        onClick={handleOpenSelectModal}
        className="bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto cursor-pointer"
      >
        <Scale size={16} />
        开始对比
      </button>

      {/* 餐厅选择弹窗 */}
      <RestaurantSelectModal
        isOpen={showSelectModal}
        onClose={handleCloseSelectModal}
        restaurants={restaurants}
        selectedRestaurants={selectedRestaurants}
        onSelect={toggleRestaurant}
        onStartCompare={handleStartCompareFromSelect}
      />

      {/* 对比弹窗 */}
      <RestaurantCompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        restaurants={selectedRestaurants}
        onNavigateToRestaurant={onNavigateToRestaurant}
      />
    </div>
  );
}
