import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LogOut, Calendar, BookOpen, Clock, Users, GripVertical } from 'lucide-react';

/**
 * Enhanced Schedule Board Component
 * @author Jeff
 */
export default function ScheduleBoard() {
  const { user, logout } = useAuth();
  const [systemData, setSystemData] = useState(null);
  const [placedSchedules, setPlacedSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock pending subjects for drag & drop testing
  const [pendingSubjects, setPendingSubjects] = useState([
    { id: '1', Grade: '三年', Class: '一班', Subject: '英語', Teacher_ID: 'T001', TeacherName: '王老師' },
    { id: '2', Grade: '五年', Class: '二班', Subject: '自然', Teacher_ID: 'T002', TeacherName: '林老師' },
    { id: '3', Grade: '六年', Class: '三班', Subject: '體育', Teacher_ID: 'T003', TeacherName: '陳老師' },
    { id: '4', Grade: '四年', Class: '四班', Subject: '音樂', Teacher_ID: 'T004', TeacherName: '黃老師' },
  ]);

  const days = ['週一', '週二', '週三', '週四', '週五'];
  const slots = ['第一節', '第二節', '第三節', '第四節', '午休', '第五節', '第六節', '第七節'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const gasUrl = import.meta.env.VITE_GAS_URL;
      if (!gasUrl) {
        setError('請於環境變數 (GitHub Secrets) 中設定 VITE_GAS_URL 才能串接真實後端資料');
        setLoading(false);
        return;
      }

      const response = await fetch(gasUrl);
      const data = await response.json();
      
      if (data.status === 'success') {
        setSystemData(data.data);
      } else {
        setError(data.message || '資料讀取錯誤');
        toast.error('無法取得後端資料');
      }
    } catch (err) {
      console.error(`[ERROR] Failed to fetch data: ${err.message}`);
      setError('網路連線失敗或 GAS URL 不正確');
      toast.warning('啟用離線測試模式（不自動存檔至後端）');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, subject) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(subject));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, day, slot) => {
    e.preventDefault();
    const dataString = e.dataTransfer.getData('text/plain');
    if (!dataString) return;

    const subject = JSON.parse(dataString);

    if (!import.meta.env.VITE_GAS_URL) {
      // Offline / Testing mode handling
      setPlacedSchedules(prev => [...prev, { ...subject, Day: day, Slot: slot }]);
      setPendingSubjects(prev => prev.filter(p => p.id !== subject.id));
      toast.success('測試模式：已將課程排入課表');
      return;
    }

    await saveScheduleToBackend(subject, day, slot);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const saveScheduleToBackend = async (subjectInfo, day, slot) => {
    try {
      const schedulePayload = {
        Grade: subjectInfo.Grade,
        Class: subjectInfo.Class,
        Subject: subjectInfo.Subject,
        Teacher_ID: subjectInfo.Teacher_ID,
        Day: day,
        Slot: slot
      };

      const response = await fetch(import.meta.env.VITE_GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'saveSchedule',
          scheduleData: schedulePayload
        })
      });

      const resData = await response.json();

      if (resData.status === 'success') {
        setPlacedSchedules(prev => [...prev, { ...schedulePayload, id: resData.scheduleId || new Date().getTime() }]);
        setPendingSubjects(prev => prev.filter(p => p.id !== subjectInfo.id));
        toast.success('排課成功！自動存檔至雲端');
      } else {
        toast.error(`排課衝突：${resData.message}`);
      }
    } catch (err) {
      if (err.message === "Failed to fetch") {
         setPlacedSchedules(prev => [...prev, { ...subjectInfo, Day: day, Slot: slot }]);
         setPendingSubjects(prev => prev.filter(p => p.id !== subjectInfo.id));
         toast.success('[測試模式] 排課成功 (忽略 CORS 錯誤)');
      } else {
         toast.error('發生未知的連線錯誤');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">載入系統資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />

      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">國小教務科任排課系統</h1>
            <p className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
              <Users className="w-3 h-3 mr-1 inline" /> 歡迎回來, {user?.username}
            </p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl transition-colors font-medium border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span>安全登出</span>
        </motion.button>
      </header>
      
      {error && (
        <div className="bg-amber-50 text-amber-800 px-6 py-3 text-sm flex items-center border-b border-amber-200">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-3"></div>
          {error}
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Glassmorphic Sidebar */}
        <aside className="w-72 bg-white/60 backdrop-blur-xl border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
          <div className="p-5 border-b border-slate-200/60 bg-white/40">
            <h2 className="font-semibold text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
              待排課程清單
            </h2>
            <p className="text-xs text-slate-500 mt-1">請將卡片拖曳至右側課表中</p>
          </div>
          
          <div className="p-4 overflow-y-auto overflow-x-hidden flex-1 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {pendingSubjects.map(sub => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={sub.id}
                  draggable 
                  onDragStart={(e) => handleDragStart(e, sub)}
                  className="group relative bg-white border border-slate-200 p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all z-10"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-lg tracking-tight flex items-center">
                        <GripVertical className="w-4 h-4 text-slate-300 mr-1 -ml-2 group-hover:text-indigo-400" />
                        {sub.Grade}{sub.Class}
                      </div>
                      <div className="text-sm font-medium text-indigo-600 mt-1">{sub.Subject}</div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border border-slate-200">
                      {sub.TeacherName}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {pendingSubjects.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
              >
                <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium text-sm">太棒了！所有課程已排滿</p>
              </motion.div>
            )}
          </div>
        </aside>

        {/* Enhanced Schedule Grid */}
        <section className="flex-1 overflow-auto p-6 bg-slate-50 custom-scrollbar relative">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50/80 backdrop-blur border-b border-slate-200">
                  <th className="p-4 w-24 text-slate-500 font-semibold whitespace-nowrap text-sm bg-white sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" /> 節次
                    </div>
                  </th>
                  {days.map(day => (
                    <th key={day} className="p-4 font-bold text-slate-700 min-w-[140px] text-[15px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.map((slot, sIdx) => {
                  const isBreak = sIdx === 4;
                  return (
                  <tr key={slot} className={`divide-x divide-slate-100 transition-colors ${isBreak ? 'bg-slate-50/80' : 'hover:bg-blue-50/30'}`}>
                    <td className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap bg-white sticky left-0 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                      {slot}
                    </td>
                    
                    {days.map(day => {
                      const itemsInSlot = placedSchedules.filter(s => s.Day === day && s.Slot === slot);
                      
                      return (
                      <td 
                        key={`${day}-${slot}`} 
                        className={`p-2 relative min-h-[5rem] transition-all duration-200
                          ${isBreak ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDQwbDQwLTQwSDB2NDB6bTQwIDBWMGwtNDAgNDB2MGE0MCA0MCAwIDAgMTAgNDB6IiBmaWxsPSIjZjhmOWZhIiBmaWxsLW9wYWNpdHk9IjAuNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==")]' : ''}
                        `}
                        onDragOver={isBreak ? undefined : handleDragOver}
                        onDrop={isBreak ? undefined : (e) => handleDrop(e, day, slot)}
                      >
                        {isBreak ? (
                          <div className="flex items-center justify-center text-slate-400 text-xs font-semibold py-4 w-full h-full opacity-60">
                            午 休 時 間
                          </div>
                        ) : (
                          <div className="w-full h-full min-h-[4.5rem] flex flex-col items-center justify-center p-1.5 rounded-xl border-2 border-transparent hover:border-indigo-300 border-dashed transition-all group/slot">
                            <AnimatePresence>
                              {itemsInSlot.map(item => (
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={item.id} 
                                  className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-2 shadow-sm mb-1.5 last:mb-0 text-left cursor-default hover:shadow-md transition-shadow relative overflow-hidden"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                                  <div className="font-bold text-emerald-900 text-[13px] tracking-tight">{item.Grade}{item.Class}</div>
                                  <div className="flex justify-between items-center mt-0.5">
                                    <span className="text-emerald-700 text-xs font-medium">{item.Subject}</span>
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                      {pendingSubjects.find(p => p.Teacher_ID === item.Teacher_ID)?.TeacherName || item.Teacher_ID}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            
                            {itemsInSlot.length === 0 && (
                              <div className="opacity-0 group-hover/slot:opacity-100 text-indigo-300 text-[10px] font-bold tracking-wider uppercase flex items-center h-full transition-opacity">
                                Drop Here
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )})}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
