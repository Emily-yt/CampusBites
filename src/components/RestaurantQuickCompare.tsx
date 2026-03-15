import { useState, useEffect, useRef } from 'react';
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
  const [stage, setStage] = useState<'select' | 'thinking' | 'reveal'>('select');
  const [thinkingText, setThinkingText] = useState('分析中...');
  const timerRef = useRef<number[]>([]);

  useEffect(() => {
    if (showSelectModal) {
      setStage('select');
    }
    return () => {
      timerRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [showSelectModal]);

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
      setStage('thinking');
      startAnimation();
    }
  }

  function startAnimation() {
    timerRef.current.forEach(timer => clearTimeout(timer));
    
    const texts = ['分析餐厅信息...', '比较评分和价格...', '准备为你展示！'];
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
      setStage('reveal');
      setShowCompareModal(true);
    }, 2800);
    
    timerRef.current.push(revealTimer);
  }

  function clearSelection() {
    setSelectedRestaurants([]);
    setStage('select');
  }

  function handleOpenSelectModal() {
    setSelectedRestaurants([]);
    setStage('select');
    setShowSelectModal(true);
  }

  function handleCloseSelectModal() {
    timerRef.current.forEach(timer => clearTimeout(timer));
    setShowSelectModal(false);
    setSelectedRestaurants([]);
    setStage('select');
    setThinkingText('分析中...');
  }

  function handleCloseCompareModal() {
    setShowCompareModal(false);
    setSelectedRestaurants([]);
    setStage('select');
    setThinkingText('分析中...');
  }

  function handleStartCompareFromSelect() {
    startCompare();
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
        onClose={handleCloseCompareModal}
        restaurants={selectedRestaurants}
        onNavigateToRestaurant={onNavigateToRestaurant}
      />

      {/* 思考动画 */}
      {stage === 'thinking' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-lg">
                ⚖️ 正在为你对比
              </h2>
              <button 
                onClick={handleCloseSelectModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center animate-bounce-emoji">
                    <span className="text-4xl">⚖️</span>
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
            </div>

            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
