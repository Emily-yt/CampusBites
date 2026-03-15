import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { favoriteApi, userApi } from '../lib/api';
import { getUserSession } from '../lib/supabase';
import { notifyAchievementUnlocked } from '../lib/achievementNotification';

interface FavoriteButtonProps {
  restaurantId: string;
  size?: number;
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ restaurantId, size = 20, className = '', onToggle, userId }: FavoriteButtonProps & { userId?: string | null }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
  }, [restaurantId]);

  async function checkFavoriteStatus() {
    setIsChecking(true);
    try {
      const session = getUserSession();
      const { data } = await favoriteApi.checkFavorite(restaurantId, session);
      setIsFavorite(!!data);
    } catch (error) {
      setIsFavorite(false);
    } finally {
      setIsChecking(false);
    }
  }

  async function fetchCurrentFavoritesCount(userId: string) {
    try {
      const { data } = await userApi.getUserStats(userId);
      return data?.stats?.favorites || 0;
    } catch {
      return 0;
    }
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;

    const newFavoriteState = !isFavorite;
    
    let currentCount = 0;
    if (userId && newFavoriteState) {
      currentCount = await fetchCurrentFavoritesCount(userId);
    }
    
    // 先更新 UI，让用户立即看到反馈
    setIsFavorite(newFavoriteState);
    setLoading(true);
    
    try {
      const session = getUserSession();
      
      if (newFavoriteState) {
        await favoriteApi.addFavorite(restaurantId, session);
        
        // 检查成就解锁
        if (userId) {
          const newCount = currentCount + 1;
          if (newCount === 1) {
            notifyAchievementUnlocked({
              id: '3',
              name: '探店先锋',
              icon: 'MapPin',
              color: 'text-blue-500',
              bgColor: 'bg-blue-100',
            });
          }
          if (newCount === 5) {
            notifyAchievementUnlocked({
              id: '2',
              name: '资深吃货',
              icon: 'Heart',
              color: 'text-red-500',
              bgColor: 'bg-red-100',
            });
          }
        }
      } else {
        await favoriteApi.removeFavorite(restaurantId, session);
      }
      
      onToggle?.(newFavoriteState);
      localStorage.setItem('favorites_updated', Date.now().toString());
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // 如果请求失败，恢复原来的状态
      setIsFavorite(!newFavoriteState);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading || isChecking}
      className={`p-2 rounded-full transition-all duration-200 ${
        isFavorite 
          ? 'text-red-500 hover:bg-red-50' 
          : 'text-gray-400 hover:text-gray-600 hover:bg-amber-50'
      } ${(loading || isChecking) ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      <Heart 
        size={size} 
        fill={isFavorite ? 'currentColor' : 'none'}
        className={loading ? 'animate-pulse' : ''}
      />
    </button>
  );
}
