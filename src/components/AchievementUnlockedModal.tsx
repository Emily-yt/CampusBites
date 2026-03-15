import { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { Star, Heart, MapPin } from 'lucide-react';

interface AchievementUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgColor: string;
  };
}

const iconMap: Record<string, React.ElementType> = {
  Star,
  Heart,
  MapPin,
  Trophy,
};

export function AchievementUnlockedModal({ 
  isOpen, 
  onClose, 
  achievement 
}: AchievementUnlockedModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const Icon = iconMap[achievement.icon] || Trophy;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setShowSparkles(true), 300);
      
      const closeTimer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => {
        clearTimeout(closeTimer);
      };
    }
  }, [isOpen]);

  function handleClose() {
    setIsVisible(false);
    setShowSparkles(false);
    setTimeout(() => {
      onClose();
    }, 400);
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`
          bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl border-2 border-amber-200
          transform transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-80'}
        `}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div className="px-6 py-8 text-center relative">
          {showSparkles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-4 left-1/4 animate-ping">
                <Sparkles className="text-amber-400" size={16} />
              </div>
              <div className="absolute top-12 right-1/4 animate-ping" style={{ animationDelay: '0.2s' }}>
                <Sparkles className="text-yellow-400" size={14} />
              </div>
              <div className="absolute bottom-8 left-1/3 animate-ping" style={{ animationDelay: '0.4s' }}>
                <Sparkles className="text-orange-400" size={12} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="text-amber-500 animate-bounce" size={28} />
            <h2 className="text-xl font-bold text-amber-800">成就解锁！</h2>
            <Trophy className="text-amber-500 animate-bounce" size={28} />
          </div>

          <div className={`relative mb-6`}>
            <div className={`w-24 h-24 mx-auto ${achievement.bgColor} rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce`} style={{ animationDuration: '1s' }}>
              <Icon className={achievement.color} size={48} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="text-white" size={12} />
            </div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.3s' }}>
              <Sparkles className="text-white" size={12} />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">{achievement.name}</h3>
          <p className="text-gray-600 text-sm mb-4">恭喜你解锁了新成就！</p>

          <div className="flex items-center justify-center gap-1">
            <Sparkles className="text-amber-400" size={16} />
            <p className="text-amber-700 text-xs font-medium">继续探索，解锁更多成就</p>
            <Sparkles className="text-amber-400" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
