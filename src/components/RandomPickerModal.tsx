import { useState, useEffect, useRef } from 'react';
import { X, Star, MapPin, RefreshCw } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import type { Restaurant } from '../lib/database.types';

interface RandomPickerModalProps {
  isOpen: boolean;
  allRestaurants: Restaurant[];
  onClose: () => void;
  onSelectRestaurant: (id: string) => void;
}

export function RandomPickerModal({ isOpen, allRestaurants, onClose, onSelectRestaurant }: RandomPickerModalProps) {
  const [stage, setStage] = useState<'thinking' | 'reveal'>('thinking');
  const [thinkingText, setThinkingText] = useState('思考中...');
  const [displayedRestaurants, setDisplayedRestaurants] = useState<Restaurant[]>([]);
  const timerRef = useRef<number[]>([]);

  useEffect(() => {
    if (isOpen && allRestaurants.length > 0) {
      startAnimation();
    }
    
    return () => {
      timerRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [isOpen]);

  function startAnimation() {
    timerRef.current.forEach(timer => clearTimeout(timer));
    setStage('thinking');
    setDisplayedRestaurants([]);
    
    const texts = ['分析你的口味偏好...', '筛选附近热门餐厅...', '准备为你推荐！'];
    let textIndex = 0;
    
    const textTimer = setInterval(() => {
      if (textIndex < texts.length) {
        setThinkingText(texts[textIndex]);
        textIndex++;
      } else {
        clearInterval(textTimer);
      }
    }, 800);
    
    timerRef.current.push(textTimer as unknown as number);
    
    const revealTimer = setTimeout(() => {
      const shuffled = [...allRestaurants].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      setDisplayedRestaurants(selected);
      setStage('reveal');
    }, 2800);
    
    timerRef.current.push(revealTimer);
  }

  function handleClose() {
    timerRef.current.forEach(timer => clearTimeout(timer));
    setStage('thinking');
    setDisplayedRestaurants([]);
    setThinkingText('思考中...');
    onClose();
  }

  function handleReroll() {
    startAnimation();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">
            {stage === 'thinking' ? '🤔 正在为你随机挑选' : '🎉 为你随机挑选'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {stage === 'thinking' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center animate-bounce-emoji">
                  <span className="text-4xl">🤔</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-gray-200 rounded-full blur-md"></div>
                <div className="absolute -right-36 top-0 bg-gray-800 text-white px-4 py-2 rounded-2xl text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 text-lg mb-6">{thinkingText}</p>
                <div className="flex items-center justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i}
                      className="w-3 h-3 bg-amber-400 rounded-full"
                      style={{
                        animation: 'bounce 1s infinite',
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-24 h-32 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-center text-gray-500 mb-6">这三家餐厅都不错，快来决定吧！</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedRestaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    onClick={() => onSelectRestaurant(restaurant.id)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-amber-200 transition-all group"
                    style={{ animation: 'fadeIn 0.3s ease-out', animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                      {getCuisineEmoji(restaurant.cuisine_type)}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">
                          {restaurant.name}
                        </h3>
                        <FavoriteButton restaurantId={restaurant.id} size={16} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500" fill="currentColor" />
                          {restaurant.rating.toFixed(1)}
                        </span>
                        <span className="text-amber-600 font-medium">¥{restaurant.avg_price}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <MapPin size={10} />
                        <span className="truncate">{restaurant.school}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <button 
                  onClick={handleReroll}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw size={18} />
                  重新随机
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function getCuisineEmoji(cuisineType: string) {
  const emojiMap: { [key: string]: string } = {
    '中餐': '🥢', '西餐': '🍽️', '日料': '🍱', '韩餐': '🍲',
    '火锅': '🥘', '烧烤': '🍖', '快餐': '🍔', '甜品': '🍰',
  };
  return emojiMap[cuisineType] || '🍜';
}
