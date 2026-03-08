import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

/**
 * Authentication Hook for scheduling system
 * @author Jeff
 * @date 2026-03-08
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查 localStorage 是否有登入紀錄
    const storedUser = localStorage.getItem('schedule_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // 若無 GAS URL（未設定 GitHub Secret），進入後端未連接的測試模式
    if (!import.meta.env.VITE_GAS_URL) {
      console.warn('[WARN] VITE_GAS_URL is not set. Entering offline demo mode.');
      const userInfo = { username, demoMode: true };
      setUser(userInfo);
      localStorage.setItem('schedule_user', JSON.stringify(userInfo));
      return { success: true };
    }

    try {
      console.log(`[INFO] Attempting to login user: ${username}`);
      
      const response = await fetch(import.meta.env.VITE_GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          username,
          password
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        }
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const userInfo = { username };
        setUser(userInfo);
        localStorage.setItem('schedule_user', JSON.stringify(userInfo));
        console.log(`[INFO] Login successful for user: ${username}`);
        return { success: true };
      } else {
        console.error(`[ERROR] Login failed: ${data.message}`);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error(`[ERROR] Exception during login: ${error.message}`);
      return { success: false, message: '網路錯誤或 GAS URL 無效，請確認後端設定。' };
    }
  };

  const logout = () => {
    console.log(`[INFO] Logging out user: ${user?.username}`);
    setUser(null);
    localStorage.removeItem('schedule_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
