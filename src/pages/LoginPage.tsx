import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';
type LoginType = 'email' | 'phone';

const API_BASE_URL = 'http://localhost:3001/api';

export function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 验证密码匹配（注册时）
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // 登录请求
        const response = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginType === 'email' ? formData.email : undefined,
            phone: loginType === 'phone' ? formData.phone : undefined,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '登录失败');
        }

        // 保存用户信息到 localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onLoginSuccess(data.data.user);
      } else {
        // 注册请求
        const response = await fetch(`${API_BASE_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginType === 'email' ? formData.email : undefined,
            phone: loginType === 'phone' ? formData.phone : undefined,
            name: formData.name,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '注册失败');
        }

        // 保存用户信息到 localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onLoginSuccess(data.data.user);
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('无法连接到服务器，请确保后端服务已启动 (npm run dev in server folder)');
      } else {
        setError(err.message || '操作失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white flex">
      {/* 左侧装饰区域 - 仅在桌面端显示 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-amber-300 to-orange-400 items-center justify-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full"></div>
        </div>
        
        {/* 内容 */}
        <div className="relative z-10 text-white text-center px-12">
          <img src="/favicon.png" alt="CampusBites" className="w-24 h-24 mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-4">CampusBites</h2>
          <p className="text-xl text-white/90 mb-8">发现校园周边的美味餐厅</p>
          <div className="flex justify-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              精选餐厅
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              真实评价
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              便捷导航
            </span>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col relative">
        {/* 返回按钮 - 右上角 */}
        <div className="absolute top-6 right-6 lg:right-12 z-10">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="返回"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* 表单容器 */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="w-full max-w-md">
            {/* 移动端显示的标题 */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <img src="/favicon.png" alt="CampusBites" className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h1>
              <p className="text-gray-500">
                {mode === 'login' ? '登录以继续探索美食' : '注册开始你的美食之旅'}
              </p>
            </div>

            {/* 桌面端显示的标题 */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h1>
              <p className="text-gray-500">
                {mode === 'login' ? '登录以继续探索美食' : '注册开始你的美食之旅'}
              </p>
            </div>

            {/* 登录/注册方式切换 */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  loginType === 'email'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'login' ? '邮箱登录' : '邮箱注册'}
              </button>
              <button
                type="button"
                onClick={() => setLoginType('phone')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  loginType === 'phone'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'login' ? '手机号登录' : '手机号注册'}
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 注册时显示姓名 */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    昵称
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="请输入昵称"
                    />
                  </div>
                </div>
              )}

              {/* 邮箱或手机号 */}
              {loginType === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    手机号
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>
              )}

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 注册时显示确认密码 */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="请再次输入密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    处理中...
                  </span>
                ) : (
                  mode === 'login' ? '登录' : '注册'
                )}
              </button>
            </form>

            {/* 切换模式 */}
            <div className="mt-6 text-center">
              <p className="text-gray-500">
                {mode === 'login' ? '还没有账号？' : '已有账号？'}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-1 text-amber-600 font-medium hover:text-amber-700 transition-colors"
                >
                  {mode === 'login' ? '立即注册' : '立即登录'}
                </button>
              </p>
            </div>

            {/* 其他登录方式 */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-b from-amber-50 to-white text-gray-500">
                    其他登录方式
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                </button>
                <button className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.21 0 6.287.257 6.287-.43 0-.687-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
