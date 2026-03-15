import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { RankingsPage } from './pages/RankingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AchievementUnlockedModal } from './components/AchievementUnlockedModal';
import { onAchievementUnlocked, checkPendingAchievementNotification, clearAchievementNotification } from './lib/achievementNotification';

type Page = 'home' | 'explore' | 'rankings' | 'ai-assistant' | 'favorites' | 'profile' | 'login';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);

  // 成就弹窗状态
  const [achievementModal, setAchievementModal] = useState<{
    isOpen: boolean;
    achievement: {
      id: string;
      name: string;
      icon: string;
      color: string;
      bgColor: string;
    } | null;
  }>({
    isOpen: false,
    achievement: null,
  });

  // 页面切换时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 监听成就解锁事件（全局）
  useEffect(() => {
    // 检查是否有待处理的成就通知（页面加载时）
    const pendingAchievement = checkPendingAchievementNotification();
    if (pendingAchievement) {
      setAchievementModal({
        isOpen: true,
        achievement: pendingAchievement,
      });
      clearAchievementNotification();
    }

    // 监听成就解锁事件
    const unsubscribe = onAchievementUnlocked((data) => {
      setAchievementModal({
        isOpen: true,
        achievement: data,
      });
    });

    return unsubscribe;
  }, []);

  function handleNavigateToRestaurant(id: string) {
    setSelectedRestaurantId(id);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedRestaurantId(null);
  }

  function handleLogout() {
    setCurrentUser(null);
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    setCurrentPage('home');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as Page)}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setCurrentPage('login')}
      />

      {currentPage === 'home' && (
        <HomePage 
          onNavigateToRestaurant={handleNavigateToRestaurant}
          onNavigateToRankings={() => setCurrentPage('rankings')}
        />
      )}

      {currentPage === 'explore' && (
        <ExplorePage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'rankings' && (
        <RankingsPage 
          onNavigateToRestaurant={handleNavigateToRestaurant}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'ai-assistant' && (
        <AIAssistantPage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'favorites' && (
        <FavoritesPage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'profile' && (
        <ProfilePage
          user={currentUser}
          onLogout={handleLogout}
          onNavigateToRestaurant={handleNavigateToRestaurant}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage
          onBack={() => setCurrentPage('home')}
          onLoginSuccess={(user) => {
            setIsLoggedIn(true);
            setCurrentUser(user);
            setCurrentPage('home');
          }}
        />
      )}

      {/* 餐厅详情弹窗 */}
      <RestaurantDetailModal
        restaurantId={selectedRestaurantId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* 成就解锁弹窗（全局） */}
      {achievementModal.achievement && (
        <AchievementUnlockedModal
          isOpen={achievementModal.isOpen}
          onClose={() => setAchievementModal({ ...achievementModal, isOpen: false })}
          achievement={achievementModal.achievement}
        />
      )}
    </div>
  );
}

export default App;
