import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function getUserSession(): string {
  const user = getCurrentUser();
  if (user) {
    return user.id;
  }
  
  let session = localStorage.getItem('user_session');
  if (!session) {
    session = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_session', session);
  }
  return session;
}

// 获取当前登录用户
export function getCurrentUser(): { id: string; name: string; email?: string } | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}
