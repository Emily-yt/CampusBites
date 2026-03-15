import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Store } from 'lucide-react';

interface CheckIn {
  id: string;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    cuisine_type: string;
    image_url?: string;
  };
}

interface CheckInListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onNavigateToRestaurant: (id: string) => void;
}

export function CheckInListModal({ isOpen, onClose, userId, onNavigateToRestaurant }: CheckInListModalProps) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取打卡记录
  useEffect(() => {
    if (isOpen && userId) {
      fetchCheckins();
    }
  }, [isOpen, userId]);

  async function fetchCheckins() {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/checkins/user/${userId}`);
      const result = await response.json();
      console.log('=== 打卡记录API返回 ===');
      console.log('完整响应:', JSON.stringify(result, null, 2));
      
      if (response.ok && result.data?.checkins) {
        console.log('checkins 数组长度:', result.data.checkins.length);
        
        let checkinsData = [...result.data.checkins];
        
        // 对于每个"未知餐厅"，单独查询餐厅信息
        for (let i = 0; i < checkinsData.length; i++) {
          const checkin = checkinsData[i];
          if (checkin.restaurant?.name === '未知餐厅' && checkin.restaurant?.id) {
            console.log(`发现未知餐厅，尝试单独查询: ${checkin.restaurant.id}`);
            try {
              const restaurantResponse = await fetch(`http://localhost:3001/api/restaurants/${checkin.restaurant.id}`);
              const restaurantResult = await restaurantResponse.json();
              
              if (restaurantResponse.ok && restaurantResult.data) {
                console.log('成功获取餐厅信息:', restaurantResult.data.name);
                checkinsData[i] = {
                  ...checkin,
                  restaurant: {
                    id: restaurantResult.data.id,
                    name: restaurantResult.data.name,
                    cuisine_type: restaurantResult.data.cuisine_type,
                    image_url: restaurantResult.data.image_url
                  }
                };
              }
            } catch (err) {
              console.error('单独查询餐厅失败:', err);
            }
          }
        }
        
        // 检查第一个打卡记录的餐厅信息
        if (checkinsData.length > 0) {
          console.log('第一条打卡记录详情:', JSON.stringify(checkinsData[0], null, 2));
          console.log('restaurant 对象:', checkinsData[0].restaurant);
          console.log('restaurant.id:', checkinsData[0].restaurant?.id);
          console.log('restaurant.name:', checkinsData[0].restaurant?.name);
        }
        setCheckins(checkinsData);
      } else {
        console.log('没有找到 checkins 数据');
        setCheckins([]);
      }
    } catch (err) {
      console.error('获取打卡记录失败:', err);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }

  // 格式化日期
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  // 格式化完整日期
  function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 点击背景关闭
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // 点击餐厅跳转
  function handleRestaurantClick(restaurantId: string) {
    onClose();
    onNavigateToRestaurant(restaurantId);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <MapPin className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">我的打卡</h2>
              <p className="text-xs text-gray-500">共打卡 {checkins.length} 家餐厅</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : checkins.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-amber-400" />
              </div>
              <p className="text-gray-500 mb-2">还没有打卡记录</p>
              <p className="text-sm text-gray-400">快去探索美食，打卡你喜欢的餐厅吧！</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {checkins.map((checkin, index) => (
                <div
                  key={checkin.id}
                  onClick={() => handleRestaurantClick(checkin.restaurant.id)}
                  className="p-4 hover:bg-amber-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    {/* 序号 */}
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    
                    {/* 餐厅信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Store size={16} className="text-amber-500 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                          {checkin.restaurant.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(checkin.created_at)}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {checkin.restaurant.cuisine_type}
                        </span>
                      </div>
                      
                      {/* 完整日期（悬停显示） */}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatFullDate(checkin.created_at)}
                      </p>
                    </div>
                    
                    {/* 箭头 */}
                    <div className="flex-shrink-0 text-gray-300 group-hover:text-amber-400 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
