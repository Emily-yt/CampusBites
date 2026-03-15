// 聊天会话管理
import type { Restaurant } from './database.types';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  recommendations?: Restaurant[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'ai_chat_sessions';
const CURRENT_SESSION_KEY = 'ai_current_session_id';

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 从localStorage获取所有会话
export function getAllSessions(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    return sessions.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

// 保存所有会话
export function saveAllSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

// 获取当前会话ID
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

// 设置当前会话ID
export function setCurrentSessionId(sessionId: string | null): void {
  try {
    if (sessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (error) {
    console.error('Failed to set current session:', error);
  }
}

// 创建新会话
export function createSession(name: string = '新会话'): ChatSession {
  const session: ChatSession = {
    id: generateId(),
    name,
    messages: [
      {
        id: 'welcome',
        type: 'ai',
        content: '你好！我是你的AI美食助手 🤖\n\n告诉我你想吃什么、预算多少、在哪里，我来帮你推荐最合适的餐厅！',
        timestamp: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const sessions = getAllSessions();
  sessions.unshift(session);
  saveAllSessions(sessions);
  setCurrentSessionId(session.id);
  
  return session;
}

// 获取特定会话
export function getSession(sessionId: string): ChatSession | null {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

// 更新会话
export function updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | null {
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return null;
  
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveAllSessions(sessions);
  return sessions[index];
}

// 删除会话
export function deleteSession(sessionId: string): boolean {
  const sessions = getAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  if (filtered.length === sessions.length) return false;
  
  saveAllSessions(filtered);
  
  // 如果删除的是当前会话，清除当前会话ID
  if (getCurrentSessionId() === sessionId) {
    setCurrentSessionId(null);
  }
  
  return true;
}

// 添加消息到会话
export function addMessageToSession(
  sessionId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): ChatSession | null {
  const session = getSession(sessionId);
  if (!session) return null;
  
  const newMessage: Message = {
    ...message,
    id: generateId(),
    timestamp: new Date(),
  };
  
  session.messages.push(newMessage);
  session.updatedAt = new Date();
  
  // 自动更新会话名称（如果是第一条用户消息）
  const userMessages = session.messages.filter(m => m.type === 'user');
  if (userMessages.length === 1 && message.type === 'user') {
    session.name = generateSessionName(message.content);
  }
  
  updateSession(sessionId, session);
  return session;
}

// 生成会话名称（基于第一条用户消息）
export function generateSessionName(content: string): string {
  // 提取关键词
  const keywords = [];
  
  // 提取预算
  const budgetMatch = content.match(/(\d+)[元块]?/);
  if (budgetMatch) {
    keywords.push(`${budgetMatch[1]}元`);
  }
  
  // 提取菜系
  const cuisines = ['中餐', '西餐', '日料', '韩餐', '火锅', '烧烤', '快餐', '甜品', '奶茶', '咖啡'];
  for (const cuisine of cuisines) {
    if (content.includes(cuisine)) {
      keywords.push(cuisine);
      break;
    }
  }
  
  // 提取场景
  const scenes = [
    { keyword: '约会', name: '约会' },
    { keyword: '聚餐', name: '聚餐' },
    { keyword: '深夜', name: '深夜' },
    { keyword: '夜宵', name: '夜宵' },
    { keyword: '早餐', name: '早餐' },
    { keyword: '午餐', name: '午餐' },
    { keyword: '晚餐', name: '晚餐' },
    { keyword: '一个人', name: '独自' },
    { keyword: '独自', name: '独自' },
  ];
  for (const scene of scenes) {
    if (content.includes(scene.keyword)) {
      keywords.push(scene.name);
      break;
    }
  }
  
  // 提取距离
  if (content.includes('附近') || content.includes('近')) {
    keywords.push('附近');
  }
  
  if (keywords.length > 0) {
    return keywords.slice(0, 3).join('·');
  }
  
  // 如果没有提取到关键词，返回前10个字符
  return content.slice(0, 10) + (content.length > 10 ? '...' : '');
}

// 获取或创建当前会话
export function getOrCreateCurrentSession(): ChatSession {
  const currentId = getCurrentSessionId();
  if (currentId) {
    const session = getSession(currentId);
    if (session) return session;
  }
  
  // 如果没有当前会话，创建新会话
  return createSession();
}
