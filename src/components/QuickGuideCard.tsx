import { useState } from 'react';
import { X, Sparkles, Shuffle, Scale, MapPin, Bot, Trophy, ArrowRight } from 'lucide-react';

interface QuickGuideCardProps {
  onDismiss: () => void;
}

export function QuickGuideCard({ onDismiss }: QuickGuideCardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Sparkles size={24} className="text-amber-500" />,
      title: '欢迎来到校园美食地图！',
      description: '一个帮你找到校园周边好吃餐厅的小助手。',
    },
    {
      icon: <Shuffle size={24} className="text-amber-500" />,
      title: '不知道吃什么？',
      description: '点击"纠结今天吃什么"，让我们随机帮你选一家餐厅！',
    },
    {
      icon: <Scale size={24} className="text-amber-500" />,
      title: '犹豫不决？',
      description: '使用"餐厅对比"功能，同时比较多家餐厅的评分和价格。',
    },
    {
      icon: <MapPin size={24} className="text-amber-500" />,
      title: '探索更多',
      description: '去"探索"页面，在地图上发现更多餐厅，还可以按条件筛选！',
    },
    {
      icon: <Bot size={24} className="text-amber-500" />,
      title: 'AI智能推荐',
      description: '问问AI助手，让它根据你的喜好推荐合适的餐厅！',
    },
    {
      icon: <Trophy size={24} className="text-amber-500" />,
      title: '查看排行榜',
      description: '浏览各类榜单，发现最受欢迎的餐厅！',
    },
  ];

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  function handleNext() {
    if (isLastStep) {
      onDismiss();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">快速入门</h2>
            <button
              onClick={onDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              {steps[currentStep].icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-6 bg-amber-500' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                isLastStep
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {isLastStep ? '开始探索' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
