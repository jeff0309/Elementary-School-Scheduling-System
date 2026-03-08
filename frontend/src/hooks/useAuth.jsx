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
    try {
      console.log(`[INFO] Attempting to login user: ${username}`);
      
      const response = await fetch(import.meta.env.VITE_GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          username,
          password
        }),
        // 跨域請求設定
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
      return { success: false, message: "Network error or invalid GAS URL" };
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
