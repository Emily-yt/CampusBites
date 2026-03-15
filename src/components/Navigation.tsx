import { Home, Map, Sparkles, User } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}

export function Navigation({ currentPage, onNavigate, isLoggedIn, onLoginClick }: NavigationProps) {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'explore', label: '探索', icon: Map },
    { id: 'ai-assistant', label: 'AI助手', icon: Sparkles },
  ];

  return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <img src="/favicon.png" alt="CampusBites" className="w-10 h-10" />
            <span className="text-xl font-bold text-gray-900">CampusBites</span>
          </button>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* 登录/个人中心 按钮 */}
            {isLoggedIn ? (
              <button
                onClick={() => onNavigate('profile')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'profile'
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <User size={16} />
                <span>个人中心</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                登录/注册
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
