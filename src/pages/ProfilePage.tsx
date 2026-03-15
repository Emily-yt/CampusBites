import { useState, useEffect } from 'react';
import { User, Settings, Edit3, Camera, MapPin, School, Mail, Phone, ChevronRight, Heart, Star, MapPin as CheckInIcon, Award, LogOut, UtensilsCrossed, Sparkles, MessageSquare } from 'lucide-react';
import { TastePreferenceModal } from '../components/TastePreferenceModal';
import { CheckInListModal } from '../components/CheckInListModal';
import { FavoritesModal } from '../components/FavoritesModal';
import { ProfilePageSkeleton } from '../components/Skeleton';
import { getUserSession } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';

interface ProfilePageProps {
  onNavigateToRestaurant: (id: string) => void;
  onLogout: () => void;
  user: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    school?: string | null;
    bio?: string | null;
    avatar?: string | null;
    created_at?: string;
  } | null;
}

interface UserStats {
  favorites: number;
  checkins: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  icon: string;
  restaurant_id?: string;
}

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

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  Star,
  Heart,
  MapPin,
  CheckInIcon,
  Award,
};

export function ProfilePage({ onNavigateToRestaurant, onLogout, user }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skeletonMinTimePassed, setSkeletonMinTimePassed] = useState(false);
  
  // 用户统计数据
  const [userStats, setUserStats] = useState<UserStats>({
    favorites: 0,
    checkins: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // 口味偏好状态
  const [tastePreferences, setTastePreferences] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [budgetPreference, setBudgetPreference] = useState<string>('');
  const [isEditingTaste, setIsEditingTaste] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // 打卡记录弹窗状态
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  // 收藏弹窗状态
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  // 关闭收藏弹窗
  function handleCloseFavoritesModal() {
    setIsFavoritesModalOpen(false);
  }

  useEffect(() => {
    setEditableUser(user);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSkeletonMinTimePassed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && !loadingStats && !loadingPreferences && skeletonMinTimePassed) {
      setIsLoading(false);
    }
  }, [user, loadingStats, loadingPreferences, skeletonMinTimePassed]);

  // 从后端加载口味偏好
  useEffect(() => {
    if (user?.id) {
      fetchUserPreferences(user.id);
    }
  }, [user?.id]);

  // 获取用户口味偏好
  async function fetchUserPreferences(userId: string) {
    setLoadingPreferences(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`);
      const data = await response.json();

      if (response.ok && data.data?.preferences) {
        const prefs = data.data.preferences;
        setTastePreferences(prefs.taste_types || []);
        setCuisinePreferences(prefs.cuisine_types || []);
        setBudgetPreference(prefs.budget_preference || '');
        
        // 同时更新本地存储
        localStorage.setItem('taste_preferences', JSON.stringify(prefs.taste_types || []));
        localStorage.setItem('cuisine_preferences', JSON.stringify(prefs.cuisine_types || []));
        localStorage.setItem('budget_preference', prefs.budget_preference || '');
      }
    } catch (err) {
      console.error('获取口味偏好失败:', err);
      // 如果后端获取失败，尝试从本地存储加载
      const savedTaste = localStorage.getItem('taste_preferences');
      const savedCuisine = localStorage.getItem('cuisine_preferences');
      const savedBudget = localStorage.getItem('budget_preference');
      
      if (savedTaste) setTastePreferences(JSON.parse(savedTaste));
      if (savedCuisine) setCuisinePreferences(JSON.parse(savedCuisine));
      if (savedBudget) setBudgetPreference(savedBudget);
    } finally {
      setLoadingPreferences(false);
    }
  }

  // 获取用户统计数据
  useEffect(() => {
    if (user?.id) {
      fetchUserStats(user.id);
    }
  }, [user?.id]);

  // 监听收藏状态变化，刷新统计数据
  useEffect(() => {
    if (!user?.id) return;

    let lastUpdated = localStorage.getItem('favorites_updated');

    const checkForUpdates = () => {
      const currentUpdated = localStorage.getItem('favorites_updated');
      if (currentUpdated && currentUpdated !== lastUpdated) {
        console.log('检测到收藏变化，刷新统计数据');
        lastUpdated = currentUpdated;
        fetchUserStats(user.id);
      }
    };

    const interval = setInterval(checkForUpdates, 300);
    return () => clearInterval(interval);
  }, [user?.id]);

  async function fetchUserStats(userId: string) {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
      const data = await response.json();

      if (response.ok && data.data) {
        const { points, ...statsWithoutPoints } = data.data.stats;
        setUserStats(statsWithoutPoints);
        setBadges(data.data.badges || []);
        setRecentActivities(data.data.recentActivities || []);
      }
    } catch (err) {
      console.error('获取用户统计失败:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-amber-100 px-8 py-10 text-center max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">尚未登录</h1>
          <p className="text-gray-500 text-sm">
            请先登录或注册账号后，再查看个人中心信息。
          </p>
        </div>
      </div>
    );
  }

  const displayUser = editableUser ?? user;

  async function handleSaveProfile() {
    if (!displayUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${displayUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: displayUser.name,
          school: displayUser.school,
          bio: displayUser.bio,
          avatar: displayUser.avatar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新失败');
      }

      const updatedUser = data.data?.user ?? displayUser;

      // 更新本地可编辑用户和本地存储
      setEditableUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsEditing(false);
      setSuccess('资料已保存');
      
      // 刷新统计数据（因为用户名可能改变）
      fetchUserStats(displayUser.id);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('无法连接到服务器，请确保后端服务已启动');
      } else {
        setError(err.message || '保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  }

  // 处理弹窗保存
  async function handleModalSave(preferences: {
    taste_types: string[];
    cuisine_types: string[];
    budget_preference: string;
  }) {
    if (!user?.id) {
      setError('请先登录');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '保存失败');
      }

      // 更新本地状态
      setTastePreferences(preferences.taste_types);
      setCuisinePreferences(preferences.cuisine_types);
      setBudgetPreference(preferences.budget_preference);

      // 同时保存到本地存储作为备份
      localStorage.setItem('taste_preferences', JSON.stringify(preferences.taste_types));
      localStorage.setItem('cuisine_preferences', JSON.stringify(preferences.cuisine_types));
      localStorage.setItem('budget_preference', preferences.budget_preference);

      setIsEditingTaste(false);
      setSuccess('口味偏好已保存');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('保存口味偏好失败:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('无法连接到服务器，请确保后端服务已启动');
      } else {
        setError(err.message || '保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        </div>

        {/* 提示信息 */}
        {(error || success) && (
          <div className="mb-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                {success}
              </div>
            )}
          </div>
        )}

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center text-4xl">
                {displayUser.avatar ? (
                  <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="text-amber-600" size={40} />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors">
                  <Camera size={14} />
                </button>
              )}
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayUser.name || ''}
                    onChange={(e) => setEditableUser({ ...displayUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-lg font-semibold"
                    placeholder="昵称"
                  />
                  <textarea
                    value={displayUser.bio || ''}
                    onChange={(e) => setEditableUser({ ...displayUser, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm"
                    rows={2}
                    placeholder="个人简介"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{displayUser.name}</h2>
                      <p className="text-gray-600 text-sm mb-3">{displayUser.bio || '这个人很低调，还没有填写简介～'}</p>
                    </div>
                    {/* 编辑资料按钮 - 放在个人信息框内右上角 */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                    >
                      <Edit3 size={14} />
                      <span>编辑资料</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    {displayUser.school && (
                      <span className="flex items-center gap-1">
                        <School size={14} className="text-amber-500" /> {displayUser.school}
                      </span>
                    )}
                    {displayUser.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} className="text-amber-500" /> {displayUser.email}
                      </span>
                    )}
                    {displayUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} className="text-amber-500" /> {displayUser.phone}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setIsFavoritesModalOpen(true)}
            className="bg-white rounded-xl border border-amber-100 p-4 text-center hover:bg-amber-50 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-amber-600 group-hover:text-amber-700">
              {loadingStats ? '...' : userStats.favorites}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-gray-700">我的收藏</div>
          </button>
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="bg-white rounded-xl border border-amber-100 p-4 text-center hover:bg-amber-50 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-bold text-amber-600 group-hover:text-amber-700">
              {loadingStats ? '...' : userStats.checkins}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-gray-700">已打卡</div>
          </button>
        </div>

        {/* 口味偏好设置 */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="text-amber-500" size={20} />
              <h3 className="text-lg font-bold text-gray-900">口味偏好</h3>
            </div>
            <button
              onClick={() => setIsEditingTaste(true)}
              disabled={loadingPreferences}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings size={14} />
              <span>设置</span>
            </button>
          </div>

          {loadingPreferences ? (
            <div className="text-gray-400 text-sm">加载中...</div>
          ) : tastePreferences.length === 0 && cuisinePreferences.length === 0 && !budgetPreference ? (
            <div className="text-gray-400 text-sm">还没有设置口味偏好，点击"设置"按钮来定制你的美食推荐～</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tastePreferences.map((id) => (
                <span key={id} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  {id === 'spicy' && '喜辣'}
                  {id === 'mild' && '清淡'}
                  {id === 'meat' && '肉食'}
                  {id === 'seafood' && '海鲜'}
                  {id === 'vegetarian' && '素食'}
                </span>
              ))}
              {cuisinePreferences.map((id) => (
                <span key={id} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {id === 'sichuan' && '川菜'}
                  {id === 'cantonese' && '粤菜'}
                  {id === 'northern' && '北方菜'}
                  {id === 'western' && '西餐'}
                  {id === 'japanese' && '日料'}
                  {id === 'korean' && '韩料'}
                  {id === 'southeast' && '东南亚'}
                  {id === 'hotpot' && '火锅'}
                  {id === 'bbq' && '烧烤'}
                  {id === 'dessert' && '甜品'}
                </span>
              ))}
              {budgetPreference && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  {budgetPreference === 'low' && '经济实惠'}
                  {budgetPreference === 'medium' && '性价比高'}
                  {budgetPreference === 'high' && '品质享受'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 口味偏好设置弹窗 */}
        <TastePreferenceModal
          isOpen={isEditingTaste}
          onClose={() => setIsEditingTaste(false)}
          onSave={handleModalSave}
          initialTasteTypes={tastePreferences}
          initialCuisineTypes={cuisinePreferences}
          initialBudget={budgetPreference}
          isLoading={saving}
        />

        {/* 成就徽章 */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">我的成就</h3>
            <span className="text-sm text-amber-600 font-medium">{badges.length}/3 已解锁</span>
          </div>
          
          {loadingStats ? (
            <div className="text-gray-400 text-sm py-8 text-center">加载中...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: '3', name: '探店先锋', icon: 'MapPin', color: 'text-blue-500', bgColor: 'bg-blue-100', unlocked: badges.some(b => b.id === '3'), description: '打卡或收藏1家餐厅' },
                { id: '1', name: '打卡达人', icon: 'Star', color: 'text-yellow-500', bgColor: 'bg-yellow-100', unlocked: badges.some(b => b.id === '1'), description: '打卡5家餐厅' },
                { id: '2', name: '资深吃货', icon: 'Heart', color: 'text-red-500', bgColor: 'bg-red-100', unlocked: badges.some(b => b.id === '2'), description: '收藏5家餐厅' },
              ].map((badge) => {
                const Icon = iconMap[badge.icon] || Star;
                return (
                  <div 
                    key={badge.id} 
                    className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                      badge.unlocked 
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200' 
                        : 'bg-gray-50 border-2 border-gray-100 opacity-50'
                    }`}
                  >
                    <div className={`relative w-16 h-16 ${badge.bgColor} rounded-full flex items-center justify-center mb-3 ${
                      badge.unlocked ? 'shadow-md' : ''
                    }`}>
                      <Icon className={badge.unlocked ? badge.color : 'text-gray-400'} size={28} />
                      {badge.unlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Sparkles className="text-white" size={10} />
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-semibold mb-1 ${
                      badge.unlocked ? 'text-gray-900' : 'text-gray-400'
                    }`}>{badge.name}</span>
                    <span className="text-xs text-gray-500 text-center">{badge.description}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">最近活动</h3>
          {loadingStats ? (
            <div className="text-gray-400 text-sm">加载中...</div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = iconMap[activity.icon] || MessageSquare;
                return (
                  <div 
                    key={activity.id} 
                    onClick={() => activity.restaurant_id && onNavigateToRestaurant(activity.restaurant_id)}
                    className={`flex items-center gap-3 p-3 bg-amber-50 rounded-lg ${activity.restaurant_id ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''}`}
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Icon className="text-amber-500" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.content}</p>
                      <p className="text-xs text-gray-400">{formatFullDate(activity.timestamp)}</p>
                    </div>
                    {activity.restaurant_id && <ChevronRight className="text-gray-300" size={16} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂无活动记录，快去探索美食吧～</div>
          )}
        </div>

        {/* 退出登录按钮 - 放在页面最下方 */}
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
          >
            <LogOut size={18} />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </div>

      {/* 打卡记录弹窗 */}
      <CheckInListModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        userId={user?.id || null}
        onNavigateToRestaurant={onNavigateToRestaurant}
      />

      {/* 收藏弹窗 */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={handleCloseFavoritesModal}
        onNavigateToRestaurant={onNavigateToRestaurant}
      />
    </div>
  );
}
