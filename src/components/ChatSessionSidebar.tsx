import { useState, useEffect } from 'react';
import { X, Plus, Trash2, MessageSquare, Clock } from 'lucide-react';
import type { ChatSession } from '../lib/chatSession';
import { getAllSessions, deleteSession, createSession, setCurrentSessionId } from '../lib/chatSession';

interface ChatSessionSidebarProps {
  currentSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSessionSidebar({ 
  currentSessionId, 
  onSessionChange, 
  onNewSession,
  isOpen,
  onToggle
}: ChatSessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  // 监听会话更新事件
  useEffect(() => {
    const handleStorageChange = () => {
      loadSessions();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadSessions, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  function loadSessions() {
    const allSessions = getAllSessions();
    setSessions(allSessions);
  }

  function handleDeleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    if (confirm('确定要删除这个会话吗？')) {
      deleteSession(sessionId);
      loadSessions();
      
      if (sessionId === currentSessionId) {
        const newSession = createSession();
        onSessionChange(newSession.id);
      }
    }
  }

  function handleNewSession() {
    onNewSession();
    loadSessions();
  }

  function handleSessionClick(sessionId: string) {
    onSessionChange(sessionId);
  }

  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = diff / (1000 * 60 * 60);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 24) {
      return new Date(date).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return '昨天 ' + new Date(date).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days < 7) {
      return `${days}天前 ` + new Date(date).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return new Date(date).toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      }) + ' ' + new Date(date).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="h-full w-64 bg-amber-50/50 border-r border-amber-100 flex-shrink-0">
      <div className="h-full flex flex-col">
        {/* 头部 */}
        <div className="h-14 border-b border-amber-100 flex items-center justify-between px-3">
          <h3 className="font-semibold text-gray-800 text-base">历史会话</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewSession}
              className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
              title="新建会话"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">暂无历史会话</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${
                    session.id === currentSessionId
                      ? 'bg-amber-100 border border-amber-200'
                      : 'hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        session.id === currentSessionId ? 'text-amber-800' : 'text-gray-700'
                      }`}>
                        {session.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock size={9} />
                        <span>{formatTime(session.updatedAt)}</span>
                        <span className="mx-1">·</span>
                        <span>{session.messages.length}条</span>
                      </div>
                    </div>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="删除会话"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="p-2 border-t border-amber-100 text-xs text-gray-400 text-center bg-amber-100/30">
          共 {sessions.length} 个会话
        </div>
      </div>
    </div>
  );
}
