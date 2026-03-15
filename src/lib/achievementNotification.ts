const ACHIEVEMENT_UNLOCKED_EVENT = 'achievement_unlocked';

export interface AchievementData {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  timestamp: number;
}

export function notifyAchievementUnlocked(achievement: Omit<AchievementData, 'timestamp'>) {
  const data: AchievementData = {
    ...achievement,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(ACHIEVEMENT_UNLOCKED_EVENT, JSON.stringify(data));
  
  window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCKED_EVENT, { detail: data }));
}

export function onAchievementUnlocked(callback: (data: AchievementData) => void) {
  const handleEvent = (e: CustomEvent<AchievementData>) => {
    callback(e.detail);
  };
  
  window.addEventListener(ACHIEVEMENT_UNLOCKED_EVENT as any, handleEvent as any);
  
  return () => {
    window.removeEventListener(ACHIEVEMENT_UNLOCKED_EVENT as any, handleEvent as any);
  };
}

export function checkPendingAchievementNotification(): AchievementData | null {
  const data = localStorage.getItem(ACHIEVEMENT_UNLOCKED_EVENT);
  if (data) {
    try {
      const parsed = JSON.parse(data) as AchievementData;
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return parsed;
      }
    } catch {
    }
  }
  return null;
}

export function clearAchievementNotification() {
  localStorage.removeItem(ACHIEVEMENT_UNLOCKED_EVENT);
}
