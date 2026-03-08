import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, AlertCircle, CalendarDays } from 'lucide-react';

/**
 * Enhanced Login Component
 * @author Jeff
 */
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!import.meta.env.VITE_GAS_URL) {
      setError('系統設定錯誤：缺少 VITE_GAS_URL，請檢查環境變數。');
      return;
    }
    setError('');
    setIsLoading(true);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.message || '連線失敗，請檢查網路或 GAS 網址是否正確。');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated-gradient p-4 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/20 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/30 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass max-w-md w-full rounded-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CalendarDays className="w-8 h-8 text-blue-600" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">科任排課系統</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">請登入以存取教務排程功能</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50/80 backdrop-blur border border-red-200 text-red-600 p-3 rounded-xl text-sm flex items-start space-x-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 text-slate-700"
                placeholder="教職員統編或帳號"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 text-slate-700"
                placeholder="輸入密碼"
              />
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 font-semibold text-white transition-all
              ${isLoading ? 'bg-blue-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'}`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>登入中...</span>
              </>
            ) : (
              <>
                <span>登入系統</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
