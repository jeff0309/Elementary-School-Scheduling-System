import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Main Schedule Board Component for scheduling system
 * Handling Drag & Drop API integration.
 * @author Jeff
 * @date 2026-03-08
 */
export default function ScheduleBoard() {
  const { user, logout } = useAuth();
  
  // 從後端拉回來的系統設定（老師名單、鎖定等）
  const [systemData, setSystemData] = useState(null);
  
  // 記錄已經排入課表的項目 Matrix[Day][Slot]
  const [placedSchedules, setPlacedSchedules] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // 待排課程 Mock Data (之後可由 Backend Subject_Demand 取出)
  const [pendingSubjects, setPendingSubjects] = useState([
    { id: '1', Grade: '三年', Class: '一班', Subject: '英語', Teacher_ID: 'T001', TeacherName: '王老師' },
    { id: '2', Grade: '五年', Class: '二班', Subject: '自然', Teacher_ID: 'T002', TeacherName: '林老師' },
    { id: '3', Grade: '六年', Class: '三班', Subject: '體育', Teacher_ID: 'T003', TeacherName: '陳老師' },
  ]);

  // 5x8 Matrix
  const days = ['週一', '週二', '週三', '週四', '週五'];
  const slots = ['第一節', '第二節', '第三節', '第四節', '午休', '第五節', '第六節', '第七節'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log("[INFO] Fetching initial data from GAS");
      const response = await fetch(import.meta.env.VITE_GAS_URL);
      const data = await response.json();
      
      if (data.status === 'success') {
        setSystemData(data.data);
      } else {
        setError(data.message || '資料讀取錯誤');
      }
    } catch (err) {
      console.error(`[ERROR] Failed to fetch data: ${err.message}`);
      // 本地開發或無網路時，顯示錯誤，但不阻擋 Mock 操作
      setError('網路連線失敗或 GAS 未設定完成');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(''), 3000);
  };

  /**
   * HTML5 Drag Start Event
   */
  const handleDragStart = (e, subject) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(subject));
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * HTML5 Drop Event
   */
  const handleDrop = async (e, day, slot) => {
    e.preventDefault();
    const dataString = e.dataTransfer.getData('text/plain');
    if (!dataString) return;

    const subject = JSON.parse(dataString);
    console.log(`[INFO] Dropped ${subject.Subject} to ${day} ${slot}`);

    // Call Backend API to save and verify conflict
    await saveScheduleToBackend(subject, day, slot);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * 發送 REST POST 請求進行排課與衝突驗證
   */
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

      console.log(`[INFO] Requesting backend to save schedule slot`);
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
        // 更新本地 State
        setPlacedSchedules(prev => [...prev, { ...schedulePayload, id: resData.scheduleId || new Date().getTime() }]);
        // 移除待排項目
        setPendingSubjects(prev => prev.filter(p => p.id !== subjectInfo.id));
        showToast('排課成功！', false);
        console.log(`[INFO] Schedule validated and saved: ${resData.scheduleId}`);
      } else {
        showToast(`排課失敗: ${resData.message}`, true);
        console.warn(`[WARN] Schedule conflict: ${resData.message}`);
      }

    } catch (err) {
      console.error(`[ERROR] API Exception: ${err.message}`);
      // 為了測試，如果是 CORS 錯誤，直接允許塞入 UI（模擬成功）
      if (err.message === "Failed to fetch") {
         setPlacedSchedules(prev => [...prev, { ...subjectInfo, Day: day, Slot: slot }]);
         setPendingSubjects(prev => prev.filter(p => p.id !== subjectInfo.id));
         showToast('[測試模式] 排課成功 (忽略 GAS CORS 錯誤)', false);
      } else {
         showToast('發生未知的連線錯誤', true);
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Toast Notifier */}
      {toastMsg && (
        <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-medium transition-all ${toastMsg.isError ? 'bg-red-500' : 'bg-green-500'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-blue-800 text-white shadow-md p-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold">國小科任排課系統 - 歡迎, {user?.username}</h1>
        <button 
          onClick={logout}
          className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-sm transition font-medium"
        >
          登出 (Logout)
        </button>
      </header>
      
      {error && <div className="bg-red-50 text-red-600 p-2 text-sm text-center border-b border-red-200">{error}</div>}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Sidebar - Subject Demand */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
          <div className="bg-gray-100 p-3 font-semibold text-gray-700 border-b border-gray-200">
            待排課程清單
          </div>
          <div className="p-4 overflow-auto flex-1 h-full">
            <p className="text-xs text-gray-500 mb-4">拖曳卡片至右側網格中</p>
            <div className="space-y-3">
              {pendingSubjects.map(sub => (
                <div 
                  key={sub.id}
                  draggable 
                  onDragStart={(e) => handleDragStart(e, sub)}
                  className="bg-blue-50 border border-blue-200 p-3 rounded shadow-sm cursor-move hover:bg-blue-100 hover:shadow-md transition"
                >
                  <div className="font-bold text-blue-800">{sub.Grade}{sub.Class}</div>
                  <div className="text-sm text-blue-700 flex justify-between mt-1">
                    <span>{sub.Subject}</span>
                    <span className="bg-blue-200 px-1 rounded text-xs">{sub.TeacherName}</span>
                  </div>
                </div>
              ))}
              {pendingSubjects.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded">
                  無待排課程
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Schedule Grid */}
        <section className="flex-1 overflow-auto p-6 relative">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 inline-block min-w-full">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-gray-100 divide-x divide-gray-200 border-b border-gray-200">
                  <th className="p-3 w-20 text-gray-600 font-medium whitespace-nowrap">節次 \ 星期</th>
                  {days.map(day => (
                    <th key={day} className="p-3 font-medium text-gray-800 min-w-[120px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map((slot, sIdx) => {
                  const isBreak = sIdx === 4;
                  return (
                  <tr key={slot} className={`divide-x divide-gray-200 ${isBreak ? 'bg-gray-50' : 'hover:bg-blue-50 transition'}`}>
                    <td className="p-3 font-medium text-gray-600 whitespace-nowrap">{slot}</td>
                    {days.map(day => {
                      // 尋找此格子的排課資料
                      const itemsInSlot = placedSchedules.filter(s => s.Day === day && s.Slot === slot);
                      
                      return (
                      <td 
                        key={`${day}-${slot}`} 
                        className={`p-2 relative min-h-[60px] 
                          ${isBreak ? 'text-gray-400 text-sm bg-gray-100' : ''}
                        `}
                        onDragOver={isBreak ? undefined : handleDragOver}
                        onDrop={isBreak ? undefined : (e) => handleDrop(e, day, slot)}
                      >
                        {isBreak ? (
                          '休息時間 / 午休'
                        ) : (
                          <div className="w-full h-full min-h-[4rem] flex flex-col items-center justify-center p-1 rounded border-2 border-transparent hover:border-blue-400 border-dashed transition">
                            {itemsInSlot.map(item => (
                              <div key={item.id} className="w-full bg-green-100 border border-green-300 rounded p-1 shadow-sm mb-1 last:mb-0 text-left text-xs">
                                <span className="font-bold text-green-800">{item.Grade}{item.Class}</span>
                                <div className="text-green-700 flex justify-between">
                                  <span>{item.Subject}</span>
                                  <span>{item.Teacher_ID}</span>
                                </div>
                              </div>
                            ))}
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
