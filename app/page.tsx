'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Filter,
  Search,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_DATA, STORES, MANAGERS, ScheduleEntry } from '@/lib/mock-data';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const generateMonthDays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const holidays: Record<string, string> = {
    '2026-03-01': '삼일절',
    '2026-03-02': '대체공휴일',
    '2026-03-11': '선거일'
  };

  for (let i = 1; i <= daysInMonth; i++) {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayOfWeek = weekDays[new Date(year, month - 1, i).getDay()];
    
    days.push({
      date: dateString,
      label: `${i}일(${dayOfWeek})`,
      dayOfWeek,
      isHoliday: !!holidays[dateString],
      holidayName: holidays[dateString],
      isSunday: dayOfWeek === '일',
      isSaturday: dayOfWeek === '토'
    });
  }
  return days;
};

const DAYS = generateMonthDays(2026, 3);

const getShiftBgColor = (type?: string) => {
  switch (type) {
    case '오픈': return 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
    case '마감': return 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';
    case '미들': return 'bg-white text-[#1A1A1A] border-gray-200';
    case '오_미단독': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case '마_미단독': return 'bg-orange-100 text-orange-800 border-orange-200';
    case '교육': return 'bg-purple-100 text-purple-800 border-purple-200';
    case '출장': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default: return 'bg-white text-gray-400 border-gray-100';
  }
};

const getStatusBgColor = (type?: string) => {
  switch (type) {
    case '겸직': return 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]';
    case '주휴': 
    case '휴무': return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    case '대휴': return 'bg-gray-200 text-gray-700 border-gray-300';
    case '연차': 
    case '휴가': return 'bg-pink-100 text-pink-800 border-pink-200';
    case '경조': return 'bg-rose-100 text-rose-800 border-rose-200';
    case '반차': 
    case '반반차': return 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]';
    default: return 'bg-white text-gray-400 border-gray-100';
  }
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats' | 'management'>('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleData, setScheduleData] = useState(MOCK_DATA);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ store: '', name: '' });
  const [newForm, setNewForm] = useState({ store: '', name: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const hasLoaded = React.useRef(false);

  // Load data from Firebase on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'schedules', 'team4');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setScheduleData(docSnap.data().scheduleData || MOCK_DATA);
        }
        setIsConnected(true);
        hasLoaded.current = true;
      } catch (error) {
        console.error("Error loading schedule data:", error);
        setIsConnected(false);
      }
    };
    loadData();
  }, []);

  // Auto-sync when scheduleData changes
  React.useEffect(() => {
    if (!hasLoaded.current) return;

    const timeoutId = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const docRef = doc(db, 'schedules', 'team4');
        await setDoc(docRef, { scheduleData });
        setIsConnected(true);
      } catch (error) {
        console.error("Error auto-syncing data:", error);
        setIsConnected(false);
      } finally {
        setIsSyncing(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [scheduleData]);

  const filteredData = scheduleData.filter(item => 
    item.name.includes(searchQuery) || item.store.includes(searchQuery)
  );

  const handleCellChange = (managerId: string, date: string, field: 'time' | 'shiftType' | 'statusType', value: string) => {
    setScheduleData(prev => prev.map(m => {
      if (m.id === managerId) {
        const currentEntry = m.schedule[date] || { time: '', shiftType: '', statusType: '' };
        return {
          ...m,
          schedule: {
            ...m.schedule,
            [date]: { ...currentEntry, [field]: value }
          }
        };
      }
      return m;
    }));
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>, managerId: string, date: string) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    
    let formatted = val;
    if (val.length >= 3) {
      formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
    }
    handleCellChange(managerId, date, 'time', formatted);
  };

  const handleAddPerson = () => {
    if (!newForm.store || !newForm.name) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setScheduleData([...scheduleData, { id: newId, store: newForm.store, name: newForm.name, schedule: {} }]);
    setNewForm({ store: '', name: '' });
  };

  const handleDeletePerson = (id: string) => {
    if(confirm('정말 삭제하시겠습니까?')) {
      setScheduleData(scheduleData.filter(m => m.id !== id));
    }
  };

  const handleEditStart = (manager: any) => {
    setEditingId(manager.id);
    setEditForm({ store: manager.store, name: manager.name });
  };

  const handleEditSave = () => {
    setScheduleData(scheduleData.map(m => m.id === editingId ? { ...m, store: editForm.store, name: editForm.name } : m));
    setEditingId(null);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 bg-black rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight whitespace-nowrap">지역4팀 점장 근무 스케줄</h1>
          </div>
          <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('schedule'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">근무 스케줄</span>
          </button>
          <button 
            onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">통계 분석</span>
          </button>
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Management</p>
          </div>
          <button 
            onClick={() => { setActiveTab('management'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">인원 관리</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-auto min-h-20 bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
              <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-2 md:px-4 font-bold text-sm">2026년 3월</span>
              <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <div className="relative flex-1 md:flex-none hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="지점 또는 이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-full md:w-64 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : isConnected === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : isConnected === false ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-gray-300'}`} />
              <span className="text-xs font-bold text-gray-600">
                {isSyncing ? '저장 중...' : isConnected === true ? 'DB 연결됨' : isConnected === false ? '연결 끊김' : '연결 중...'}
              </span>
            </div>
          </div>
          
          {/* Mobile Search - visible only on very small screens */}
          <div className="relative w-full sm:hidden mt-4 md:mt-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="지점 또는 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-full transition-all"
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'schedule' ? (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">점장 근무 스케줄</h2>
                    <p className="text-gray-500 text-sm mt-1">지역4팀 점장님들의 주간 근무 현황입니다.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['오픈', '마감', '미들', '휴무', '겸직'].map((type) => {
                      const isStatus = ['휴무', '겸직'].includes(type);
                      const styles = isStatus ? getStatusBgColor(type) : getShiftBgColor(type);
                      return (
                        <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                          <div className={`w-3 h-3 rounded-full ${styles.split(' ')[0]}`} />
                          <span className="text-xs font-medium text-gray-600">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                          <th className="sticky left-0 z-20 bg-gray-50/50 p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 min-w-[160px]">지점 / 이름</th>
                          {DAYS.map((day) => {
                            let colorClass = "text-gray-900";
                            let bgClass = "";
                            if (day.isHoliday || day.isSunday) {
                              colorClass = "text-red-500";
                              bgClass = "bg-red-50/50";
                            } else if (day.isSaturday) {
                              colorClass = "text-blue-500";
                              bgClass = "bg-blue-50/50";
                            }
                            
                            return (
                              <th key={day.date} className={`p-3 text-center border-r border-gray-200 min-w-[100px] ${bgClass}`}>
                                <p className={`text-sm font-bold ${colorClass}`}>{day.label}</p>
                                {day.holidayName && <p className="text-[10px] text-red-400 mt-0.5">{day.holidayName}</p>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((manager) => (
                          <tr key={manager.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                            <td className="sticky left-0 z-10 bg-white p-4 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col items-center justify-center text-center gap-1">
                                <p className="text-sm font-bold text-gray-900">{manager.store}</p>
                                <p className="text-[11px] font-medium text-gray-500">{manager.name}</p>
                              </div>
                            </td>
                            {DAYS.map((day) => {
                              const entry = manager.schedule[day.date] || { time: '', shiftType: '', statusType: '' };
                              
                              let cellBgClass = "bg-white";
                              if (day.isHoliday || day.isSunday) cellBgClass = "bg-red-50/10";
                              else if (day.isSaturday) cellBgClass = "bg-blue-50/10";

                              return (
                                <td key={day.date} className={`p-1.5 border-r border-gray-100 align-top ${cellBgClass}`}>
                                  <div className="flex flex-col gap-1.5 w-[88px] mx-auto">
                                    <input 
                                      type="text" 
                                      placeholder="00:00"
                                      value={entry.time}
                                      onChange={(e) => handleTimeInput(e, manager.id, day.date)}
                                      className="w-full text-center text-xs font-bold py-1.5 border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
                                    />
                                    <select 
                                      value={entry.shiftType}
                                      onChange={(e) => handleCellChange(manager.id, day.date, 'shiftType', e.target.value)}
                                      className={`w-full text-center text-[11px] font-bold py-1.5 border rounded-md appearance-none cursor-pointer outline-none transition-all ${getShiftBgColor(entry.shiftType)} ${!entry.shiftType ? 'opacity-50' : ''}`}
                                    >
                                      <option value="" className="text-gray-400 bg-white">근무</option>
                                      {['오픈', '마감', '미들', '오_미단독', '마_미단독', '교육', '출장'].map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900 bg-white">{opt}</option>
                                      ))}
                                    </select>
                                    <select 
                                      value={entry.statusType}
                                      onChange={(e) => handleCellChange(manager.id, day.date, 'statusType', e.target.value)}
                                      className={`w-full text-center text-[11px] font-bold py-1.5 border rounded-md appearance-none cursor-pointer outline-none transition-all ${getStatusBgColor(entry.statusType)} ${!entry.statusType ? 'opacity-50' : ''}`}
                                    >
                                      <option value="" className="text-gray-400 bg-white">상태</option>
                                      {['겸직', '주휴', '휴무', '대휴', '연차', '휴가', '경조', '반차', '반반차'].map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900 bg-white">{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'stats' ? (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg">점장별 근무 통계 (26년 3월)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="p-4 text-center">점장명</th>
                          <th className="p-4 text-center">마감횟수</th>
                          <th className="p-4 text-center">마감비율</th>
                          <th className="p-4 text-center">오픈횟수</th>
                          <th className="p-4 text-center">오픈비율</th>
                          <th className="p-4 text-center">오픈+마감</th>
                          <th className="p-4 text-center">겸직일수</th>
                          <th className="p-4 text-center">근무일수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredData.map((manager) => {
                          // Simple mock calculation for stats
                          const closingCount = Object.values(manager.schedule).filter(s => s.shiftType === '마감').length;
                          const openingCount = Object.values(manager.schedule).filter(s => s.shiftType === '오픈').length;
                          const totalWork = Object.values(manager.schedule).filter(s => s.shiftType !== '').length;
                          
                          return (
                            <tr key={manager.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                                    {manager.name[0]}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-bold">{manager.name}</p>
                                    <p className="text-[10px] text-gray-500">{manager.store}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center font-bold text-sm">{closingCount}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-400" style={{ width: `${(closingCount/totalWork)*100}%` }} />
                                  </div>
                                  <span className="text-xs font-bold">{Math.round((closingCount/totalWork)*100) || 0}%</span>
                                </div>
                              </td>
                              <td className="p-4 text-center font-bold text-sm">{openingCount}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400" style={{ width: `${(openingCount/totalWork)*100}%` }} />
                                  </div>
                                  <span className="text-xs font-bold">{Math.round((openingCount/totalWork)*100) || 0}%</span>
                                </div>
                              </td>
                              <td className="p-4 text-center font-bold text-sm">{openingCount + closingCount}</td>
                              <td className="p-4 text-center font-bold text-sm text-blue-600">
                                {Object.values(manager.schedule).filter(s => s.statusType === '겸직').length}
                              </td>
                              <td className="p-4 text-center font-bold text-sm">{totalWork}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'management' ? (
              <motion.div 
                key="management"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">인원 관리</h2>
                    <p className="text-gray-500 text-sm mt-1">지점 및 점장 정보를 추가, 수정, 삭제할 수 있습니다.</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" placeholder="새 지점명 (예: 강남점)" 
                        value={newForm.store} onChange={e => setNewForm({...newForm, store: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" placeholder="새 이름 (예: 홍길동)" 
                        value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAddPerson} 
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/90 transition-all shadow-lg shadow-black/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>추가하기</span>
                    </button>
                  </div>
                  
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="p-4 text-center w-1/3">지점명</th>
                        <th className="p-4 text-center w-1/3">이름</th>
                        <th className="p-4 text-center w-1/3">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scheduleData.map(manager => (
                        <tr key={manager.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 text-center">
                            {editingId === manager.id ? (
                              <input 
                                type="text" 
                                value={editForm.store} 
                                onChange={e => setEditForm({...editForm, store: e.target.value})} 
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-black/5" 
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-900">{manager.store}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {editingId === manager.id ? (
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-black/5" 
                              />
                            ) : (
                              <span className="text-sm text-gray-600">{manager.name}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {editingId === manager.id ? (
                              <div className="flex gap-2 justify-center">
                                <button onClick={handleEditSave} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">저장</button>
                                <button onClick={() => setEditingId(null)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors">취소</button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => handleEditStart(manager)} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                                  <Edit2 className="w-3 h-3" /> 수정
                                </button>
                                <button onClick={() => handleDeletePerson(manager.id)} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors">
                                  <Trash2 className="w-3 h-3" /> 삭제
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {scheduleData.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-400 text-sm">등록된 인원이 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
