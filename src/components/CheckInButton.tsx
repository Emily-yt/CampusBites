import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { notifyAchievementUnlocked } from '../lib/achievementNotification';
import { userApi } from '../lib/api';

interface CheckInButtonProps {
  restaurantId: string;
  userId: string | null;
}

export function CheckInButton({ restaurantId, userId }: CheckInButtonProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 检查是否已打卡
  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }

    async function checkStatus() {
      try {
        const response = await fetch(
          `http://localhost:3001/api/checkins/status/${userId}/${restaurantId}`
        );
        const data = await response.json();
        if (response.ok) {
          setIsCheckedIn(data.data?.isCheckedIn || false);
        }
      } catch (err) {
        console.error('检查打卡状态失败:', err);
      } finally {
        setChecking(false);
      }
    }

    checkStatus();
  }, [userId, restaurantId]);

  async function fetchCurrentCheckinsCount(userId: string) {
    try {
      const { data } = await userApi.getUserStats(userId);
      return data?.stats?.checkins || 0;
    } catch {
      return 0;
    }
  }

  // 处理打卡/取消打卡
  async function handleCheckIn() {
    if (!userId) {
      alert('请先登录');
      return;
    }

    let currentCount = 0;
    if (!isCheckedIn) {
      currentCount = await fetchCurrentCheckinsCount(userId);
    }

    setLoading(true);
    try {
      if (isCheckedIn) {
        // 取消打卡
        const response = await fetch(
          `http://localhost:3001/api/checkins/${userId}/${restaurantId}`,
          {
            method: 'DELETE',
          }
        );
        if (response.ok) {
          setIsCheckedIn(false);
        }
      } else {
        // 打卡
        const response = await fetch('http://localhost:3001/api/checkins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            restaurant_id: restaurantId,
          }),
        });
        if (response.ok) {
          setIsCheckedIn(true);
          
          // 检查成就解锁
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
              id: '1',
              name: '打卡达人',
              icon: 'Star',
              color: 'text-yellow-500',
              bgColor: 'bg-yellow-100',
            });
          }
        }
      }
    } catch (err) {
      console.error('打卡操作失败:', err);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium"
      >
        <MapPin size={16} />
        加载中...
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isCheckedIn
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      } disabled:opacity-50`}
    >
      <MapPin size={16} className={isCheckedIn ? 'fill-current' : ''} />
      {loading ? '处理中...' : isCheckedIn ? '已打卡' : '打卡'}
    </button>
  );
}
