import { useState, useEffect } from 'react';
import { X, Flame, Leaf, Beef, Fish, Carrot, UtensilsCrossed, Soup, Wheat, Pizza, Croissant, Coffee, Drumstick, Cake, Utensils } from 'lucide-react';

interface TastePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: {
    taste_types: string[];
    cuisine_types: string[];
    budget_preference: string;
  }) => void;
  initialTasteTypes: string[];
  initialCuisineTypes: string[];
  initialBudget: string;
  isLoading: boolean;
}

// 口味偏好选项
interface TasteOption {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const tasteOptions: TasteOption[] = [
  { id: 'spicy', name: '喜辣', icon: Flame, description: '无辣不欢' },
  { id: 'mild', name: '清淡', icon: Leaf, description: '少油少盐' },
  { id: 'meat', name: '肉食', icon: Beef, description: '无肉不欢' },
  { id: 'seafood', name: '海鲜', icon: Fish, description: '海鲜爱好者' },
  { id: 'vegetarian', name: '素食', icon: Carrot, description: '素食主义' },
];

interface CuisineOption {
  id: string;
  name: string;
  icon: React.ElementType;
}

const cuisineOptions: CuisineOption[] = [
  { id: 'sichuan', name: '川菜', icon: Flame },
  { id: 'cantonese', name: '粤菜', icon: Fish },
  { id: 'northern', name: '北方菜', icon: Wheat },
  { id: 'western', name: '西餐', icon: Pizza },
  { id: 'japanese', name: '日料', icon: Utensils },
  { id: 'korean', name: '韩料', icon: Croissant },
  { id: 'southeast', name: '东南亚', icon: Coffee },
  { id: 'hotpot', name: '火锅', icon: Soup },
  { id: 'bbq', name: '烧烤', icon: Drumstick },
  { id: 'dessert', name: '甜品', icon: Cake },
];

interface BudgetOption {
  id: string;
  name: string;
  range: string;
}

const budgetOptions: BudgetOption[] = [
  { id: 'low', name: '经济实惠', range: '¥0-30' },
  { id: 'medium', name: '性价比高', range: '¥30-60' },
  { id: 'high', name: '品质享受', range: '¥60+' },
];

export function TastePreferenceModal({
  isOpen,
  onClose,
  onSave,
  initialTasteTypes,
  initialCuisineTypes,
  initialBudget,
  isLoading,
}: TastePreferenceModalProps) {
  const [tasteTypes, setTasteTypes] = useState<string[]>(initialTasteTypes);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(initialCuisineTypes);
  const [budget, setBudget] = useState<string>(initialBudget);

  // 当弹窗打开时，同步外部传入的初始值
  useEffect(() => {
    if (isOpen) {
      setTasteTypes(initialTasteTypes);
      setCuisineTypes(initialCuisineTypes);
      setBudget(initialBudget);
    }
  }, [isOpen, initialTasteTypes, initialCuisineTypes, initialBudget]);

  // 点击背景关闭
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  }

  // 切换口味类型
  function toggleTaste(id: string) {
    setTasteTypes(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  }

  // 切换菜系
  function toggleCuisine(id: string) {
    setCuisineTypes(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  }

  // 保存
  function handleSave() {
    onSave({
      taste_types: tasteTypes,
      cuisine_types: cuisineTypes,
      budget_preference: budget,
    });
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="text-amber-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">设置口味偏好</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* 口味类型 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                口味类型（可多选）
              </h3>
              <div className="flex flex-wrap gap-3">
                {tasteOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = tasteTypes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleTaste(option.id)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all disabled:opacity-50 min-w-[80px] ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'
                      }`}
                    >
                      <Icon size={24} className={isSelected ? 'text-amber-500' : 'text-gray-400'} />
                      <span className="text-sm font-medium">{option.name}</span>
                      <span className="text-xs opacity-70">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 偏好菜系 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                偏好菜系（可多选）
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {cuisineOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = cuisineTypes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleCuisine(option.id)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <Icon size={20} className={isSelected ? 'text-orange-500' : 'text-gray-400'} />
                      <span className="text-xs font-medium">{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 预算偏好 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                预算偏好（单选）
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {budgetOptions.map((option) => {
                  const isSelected = budget === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setBudget(option.id)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{option.name}</span>
                      <span className="text-xs opacity-70">{option.range}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-amber-100 bg-gray-50">
          <button
            onClick={() => {
              setTasteTypes([]);
              setCuisineTypes([]);
              setBudget('');
            }}
            disabled={isLoading || (tasteTypes.length === 0 && cuisineTypes.length === 0 && !budget)}
            className="px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-30"
          >
            清空全部
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                保存中...
              </>
            ) : (
              '保存偏好'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
