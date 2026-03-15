import { useState, useRef, useEffect } from 'react';
import { Star, Send, Bot, User, Sparkles, Loader2, MapPin, DollarSign, Clock, Menu, Lightbulb, X, CheckCircle2, Scale } from 'lucide-react';
import { ChatSessionSidebar } from '../components/ChatSessionSidebar';
import { RestaurantCompareModal } from '../components/RestaurantCompareModal';
import { AIAssistantPageSkeleton } from '../components/Skeleton';
import type { Restaurant } from '../lib/database.types';
import type { Message, ChatSession } from '../lib/chatSession';
import { API_BASE_URL } from '../lib/api';
import {
  getOrCreateCurrentSession,
  getSession,
  createSession,
  addMessageToSession,
  setCurrentSessionId,
  generateSessionName,
} from '../lib/chatSession';

interface AIAssistantPageProps {
  onNavigateToRestaurant: (id: string) => void;
}

interface AIRecommendation {
  recommendations: Restaurant[];
  aiAnalysis: string;
  totalFound: number;
  fallback?: boolean;
}

export function AIAssistantPage({ onNavigateToRestaurant }: AIAssistantPageProps) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedRestaurantsForCompare, setSelectedRestaurantsForCompare] = useState<Restaurant[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [currentRecommendations, setCurrentRecommendations] = useState<Restaurant[]>([]);

  // 初始化：每次进入页面都创建新会话
  useEffect(() => {
    const newSession = createSession();
    setCurrentSession(newSession);
    setMessages(newSession.messages);
    setShowQuickOptions(true);
    
    setTimeout(() => {
      setPageLoading(false);
    }, 600);
  }, []);

  // 页面加载时重置滚动位置到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, []);

  // 自动滚动到底部（仅当AI回复消息时）
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'ai' && messages.length > 1) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  const quickOptions = [
    { label: '¥30以内', icon: DollarSign, query: '预算30元以内，推荐便宜好吃的' },
    { label: '深夜食堂', icon: Clock, query: '深夜饿了，推荐还在营业的餐厅' },
    { label: '约会聚餐', icon: Sparkles, query: '约会聚餐，推荐环境好的餐厅' },
    { label: '高评分推荐', icon: Star, query: '推荐评分最高的餐厅' },
  ];

  // 处理会话切换
  function handleSessionChange(sessionId: string) {
    const session = getSession(sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setCurrentSession(session);
      setMessages(session.messages);
      setShowQuickOptions(session.messages.length <= 1);
      setInputMessage('');
    }
  }

  // 处理新建会话
  function handleNewSession() {
    const newSession = createSession();
    setCurrentSession(newSession);
    setMessages(newSession.messages);
    setShowQuickOptions(true);
    setInputMessage('');
  }

  async function sendMessage(content: string, isQuickOption = false) {
    if (!content.trim() || !currentSession) return;

    // 添加用户消息到本地状态
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // 保存到存储
    addMessageToSession(currentSession.id, {
      type: 'user',
      content,
    });
    
    // 更新当前会话
    const updatedSession = getSession(currentSession.id);
    if (updatedSession) {
      setCurrentSession(updatedSession);
    }
    
    setInputMessage('');

    try {
      // 解析用户输入，提取关键信息
      const params = parseUserInput(content);

      // 添加思考阶段1 - 正在理解
      const thinkingId1 = Date.now().toString();
      setMessages((prev) => [...prev, {
        id: thinkingId1,
        type: 'ai',
        content: '让我想想...',
        timestamp: new Date(),
        isThinking: true,
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 添加思考阶段2 - 正在搜索
      setMessages((prev) => prev.map(msg => 
        msg.id === thinkingId1 && msg.type === 'ai' && msg.isThinking
          ? { ...msg, content: '正在为你寻找合适的餐厅...' }
          : msg
      ));
      
      await new Promise(resolve => setTimeout(resolve, 600));

      // 调用 AI 推荐接口
      const response = await fetch(`${API_BASE_URL}/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget: params.budget,
          distance: params.distance,
          cuisinePreference: params.cuisinePreference,
          occasion: params.occasion,
          isGeneralRecommendation: params.isGeneralRecommendation,
          userQuery: content,
        }),
      });

      const data: { data: AIRecommendation } = await response.json();
      
      // 移除思考消息
      setMessages((prev) => prev.filter(msg => msg.id !== thinkingId1));

      // 添加 AI 回复到存储
      const aiMessageData = {
        type: 'ai' as const,
        content: data.data.aiAnalysis,
        recommendations: data.data.recommendations,
      };
      
      addMessageToSession(currentSession.id, aiMessageData);
      
      // 打字机效果 - 先显示空消息
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessageEmpty: Message = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
      };
      
      let messagesWithText = [...updatedMessages, aiMessageEmpty];
      setMessages(messagesWithText);
      
      // 逐字显示文本
      const fullText = data.data.aiAnalysis;
      for (let i = 0; i <= fullText.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        const aiMessageWithPartialText: Message = {
          ...aiMessageEmpty,
          content: fullText.substring(0, i),
        };
        setMessages((prev) => prev.map(msg => 
          msg.id === aiMessageId ? aiMessageWithPartialText : msg
        ));
      }
      
      // 延迟显示推荐卡片
      if (data.data.recommendations && data.data.recommendations.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const aiMessageWithRecs: Message = {
          id: aiMessageId,
          type: 'ai',
          content: fullText,
          recommendations: data.data.recommendations,
          timestamp: aiMessageEmpty.timestamp,
        };
        
        const finalMessages = [...updatedMessages, aiMessageWithRecs];
        setMessages(finalMessages);
        
        // 更新存储
        addMessageToSession(currentSession.id, aiMessageData);
      }
      
      // 更新当前会话
      const finalSession = getSession(currentSession.id);
      if (finalSession) {
        setCurrentSession(finalSession);
      }
    } catch (error) {
      // 移除思考消息（如果存在）
      const thinkingId1 = (Date.now() - 2000).toString();
      setMessages((prev) => prev.filter(msg => !msg.isThinking));
      
      // 添加错误消息
      const errorMessageData = {
        type: 'ai' as const,
        content: '抱歉，我暂时无法连接到服务器。请稍后重试，或者尝试调整搜索条件。',
      };
      
      addMessageToSession(currentSession.id, errorMessageData);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，我暂时无法连接到服务器。请稍后重试，或者尝试调整搜索条件。',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
  }

  function parseUserInput(input: string) {
    // 默认参数
    let budget: number | null = null;
    let distance: number | null = null;
    let cuisinePreference = '';
    let occasion = '';
    let isGeneralRecommendation = false;

    // 检查是否是通用推荐请求
    const generalKeywords = ['评分', '推荐', '最好', '不错', '美食', '餐厅'];
    for (const keyword of generalKeywords) {
      if (input.includes(keyword)) {
        isGeneralRecommendation = true;
        break;
      }
    }

    // 解析预算 - 更精确的匹配，要求有元/块/预算等关键词
    const budgetMatch = input.match(/(?:预算|人均|不超过|以内|控制在)?\s*(\d+)\s*[元块]/);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1]);
    }

    // 解析距离
    const distanceMatch = input.match(/(\d+(?:\.\d+)?)\s*公里/);
    if (distanceMatch) {
      distance = parseFloat(distanceMatch[1]);
    }

    // 解析菜系
    const cuisines = ['中餐', '西餐', '日料', '韩餐', '火锅', '烧烤', '快餐', '甜品'];
    for (const cuisine of cuisines) {
      if (input.includes(cuisine)) {
        cuisinePreference = cuisine;
        break;
      }
    }

    // 解析场景
    if (input.includes('约会') || input.includes('聚餐')) {
      occasion = '约会聚餐';
    } else if (input.includes('深夜') || input.includes('夜宵')) {
      occasion = '深夜加餐';
    } else if (input.includes('朋友')) {
      occasion = '朋友聚会';
    } else if (input.includes('独自') || input.includes('一个人')) {
      occasion = '独自用餐';
    } else if (input.includes('快') || input.includes('赶时间')) {
      occasion = '快速解决';
    }

    return { budget, distance, cuisinePreference, occasion, isGeneralRecommendation };
  }

  function handleQuickOption(query: string, event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    sendMessage(query, true);
  }

  function getCuisineEmoji(cuisineType: string) {
    const map: { [key: string]: string } = {
      中餐: '🥢',
      西餐: '🍽️',
      日料: '🍱',
      韩餐: '🍲',
      火锅: '🥘',
      烧烤: '🍖',
      快餐: '🍔',
      甜品: '🍰',
    };
    return map[cuisineType] || '🍜';
  }

  function toggleRestaurantForCompare(restaurant: Restaurant) {
    setSelectedRestaurantsForCompare((prev) => {
      const isSelected = prev.some((r) => r.id === restaurant.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== restaurant.id);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, restaurant];
      }
    });
  }

  function startCompare() {
    if (selectedRestaurantsForCompare.length >= 2) {
      setShowCompareModal(true);
    }
  }

  function clearCompareSelection() {
    setSelectedRestaurantsForCompare([]);
  }

  if (pageLoading) {
    return <AIAssistantPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI 助手</h1>
          <p className="text-gray-600 text-sm mt-1">智能推荐，懂你所想</p>
        </div>

        {/* 聊天区域 - 包含侧边栏 */}
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden flex relative h-[720px]">
          {/* 历史会话侧边栏 */}
          <ChatSessionSidebar
            currentSessionId={currentSession?.id || null}
            onSessionChange={handleSessionChange}
            onNewSession={handleNewSession}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          
          {/* 汉堡按钮 - 当侧边栏收起时显示 */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-3 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
              title="历史会话"
            >
              <Menu size={20} />
            </button>
          )}
          
          {/* 聊天内容 */}
          <div className="flex-1 flex flex-col">
            {/* 会话标题栏 */}
            <div className="h-14 border-b border-amber-100 flex items-center justify-center px-16 relative">
              <h2 className="font-medium text-gray-800 truncate text-center">
                {currentSession?.name || '新会话'}
              </h2>
            </div>
            
            {/* 消息列表 */}
            <div ref={chatContainerRef} className="h-[660px] overflow-y-auto px-8 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* 头像 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>

                {/* 消息内容 */}
                <div
                  className={`max-w-[80%] ${
                    message.type === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      message.type === 'user'
                        ? 'bg-amber-500 text-white rounded-br-md'
                        : 'bg-amber-50 text-gray-700 rounded-bl-md'
                    }`}
                  >
                    {message.isThinking ? (
                      <div className="flex items-center gap-2">
                        <span>{message.content}</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    ) : (
                      message.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))
                    )}
                  </div>

                  {/* 推荐卡片 */}
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">选择 2-3 家餐厅进行对比：</p>
                        {currentRecommendations.length > 0 && currentRecommendations.some(r => message.recommendations?.some(mr => mr.id === r.id)) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={clearCompareSelection}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              清除选择
                            </button>
                            {selectedRestaurantsForCompare.length >= 2 && (
                              <button
                                onClick={startCompare}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                <Scale size={14} />
                                开始对比 ({selectedRestaurantsForCompare.length})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {message.recommendations.map((restaurant, index) => {
                          const isSelected = selectedRestaurantsForCompare.some(r => r.id === restaurant.id);
                          return (
                            <div
                              key={restaurant.id}
                              className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-amber-400 bg-amber-50 shadow-md' 
                                  : 'border-amber-200 hover:shadow-md hover:border-amber-300'
                              }`}
                            >
                              <div 
                                className="flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRestaurantForCompare(restaurant);
                                  if (!currentRecommendations.some(r => r.id === restaurant.id)) {
                                    setCurrentRecommendations(message.recommendations || []);
                                  }
                                }}
                              >
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected 
                                    ? 'bg-amber-500 border-amber-500' 
                                    : 'border-gray-300 hover:border-amber-400'
                                }`}>
                                  {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                              </div>
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onNavigateToRestaurant(restaurant.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                    {getCuisineEmoji(restaurant.cuisine_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-gray-800 truncate">
                                        {restaurant.name}
                                      </h3>
                                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                                        {restaurant.cuisine_type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span className="flex items-center gap-0.5">
                                        <Star size={10} className="text-yellow-500" />
                                        {restaurant.rating.toFixed(1)}
                                      </span>
                                      <span>¥{restaurant.avg_price}</span>
                                      {restaurant.school && (
                                        <span className="flex items-center gap-0.5">
                                          <MapPin size={10} className="text-blue-500" />
                                          {restaurant.school}
                                        </span>
                                      )}
                                    </div>
                                    {restaurant.hours && (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                        <Clock size={10} />
                                        {restaurant.hours}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 bg-amber-500 text-white rounded-full flex-shrink-0">
                                {index + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 时间戳 */}
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* 猜你想搜 */}
          {showQuickOptions && (
            <div className="px-8 pb-3">
              <p className="text-xs text-gray-400 mb-2">猜你想搜：</p>
              <div className="flex flex-wrap items-center gap-2">
                {quickOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={(e) => handleQuickOption(option.query, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-full hover:bg-amber-100 transition-colors"
                    >
                      <Icon size={14} />
                      {option.label}
                    </button>
                  );
                })}
                {/* 提示按钮 */}
                <button
                  type="button"
                  onClick={() => setShowTipsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-full hover:bg-red-100 transition-colors"
                >
                  <Lightbulb size={14} />
                  点我看看怎么问～
                </button>
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="border-t border-amber-100 px-8 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputMessage);
                  }
                }}
                placeholder="告诉我你想吃什么，比如：预算50元，想吃火锅..."
                className="flex-1 px-4 py-3 bg-amber-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || loading}
                className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              输入预算、菜系、距离等条件，AI会为你推荐最合适的餐厅
            </p>
          </div>
          </div>
        </div>

        {/* 提示弹窗 */}
        {showTipsModal && (
          <div 
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTipsModal(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">使用提示</h3>
                <button
                  onClick={() => setShowTipsModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">预算范围</h4>
                    <p className="text-xs text-gray-500 mt-1">"30元以内"、"人均100左右"</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">距离要求</h4>
                    <p className="text-xs text-gray-500 mt-1">"附近1公里"、"步行可达"</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">用餐场景</h4>
                    <p className="text-xs text-gray-500 mt-1">"约会聚餐"、"深夜食堂"</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowTipsModal(false)}
                className="w-full mt-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                知道了
              </button>
            </div>
          </div>
        )}

        {/* 餐厅对比弹窗 */}
        <RestaurantCompareModal
          isOpen={showCompareModal}
          onClose={() => {
            setShowCompareModal(false);
          }}
          restaurants={selectedRestaurantsForCompare}
          onNavigateToRestaurant={onNavigateToRestaurant}
        />
      </div>
    </div>
  );
}
