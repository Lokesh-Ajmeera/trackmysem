import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, CheckCircle, XCircle, AlertTriangle, Calendar, Award, 
  ChevronRight, TrendingUp, RefreshCw, Star, Info, Layers, Activity,
  Clock, Sliders, Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid, ReferenceLine, Legend
} from 'recharts';
import { StudentProfile, Subject, TimetableSlot, AttendanceEntry, Notification, getRomanNumeral } from '../types';

interface DashboardProps {
  profile: StudentProfile;
  subjects: Subject[];
  timetable: TimetableSlot[];
  notifications: Notification[];
  logs?: AttendanceEntry[];
  markTodayAttendance: (subjectId: string, isPresent: boolean, slotId: string) => void;
  onClearNotifications: () => void;
  onReadNotification: (id: string) => void;
  onAddCustomSubject?: (code: string, name: string, professor: string, credits: number) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onClearAllSubjects?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'timetable' | 'analytics' | 'profile') => void;
  darkMode?: boolean;
}

export default function Dashboard({ 
  profile, 
  subjects, 
  timetable, 
  notifications,
  logs = [],
  markTodayAttendance,
  onClearNotifications,
  onReadNotification,
  onAddCustomSubject,
  onDeleteSubject,
  onClearAllSubjects,
  onNavigateTab,
  darkMode = false
}: DashboardProps) {
  const [chartMounted, setChartMounted] = useState(false);
  React.useEffect(() => {
    setChartMounted(true);
  }, []);

  const [selectedDayForTodayClass, setSelectedDayForTodayClass] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(() => {
    // Determine actual day of week in India Time (IST)
    const dayNames: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    if (dayNames.includes(today as any)) {
      return today as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    }
    return 'Monday'; // Default to Monday for easy demo purposes
  });

  // Quick subject add state in dashboard view
  const [showDashboardAddForm, setShowDashboardAddForm] = useState(false);
  const [dashCode, setDashCode] = useState('');
  const [dashName, setDashName] = useState('');
  const [dashProf, setDashProf] = useState('');
  const [dashCredits, setDashCredits] = useState(3);

  const handleDashAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashCode || !dashName || !dashProf) return;
    onAddCustomSubject?.(dashCode, dashName, dashProf, Number(dashCredits));
    setDashCode('');
    setDashName('');
    setDashProf('');
    setDashCredits(3);
    setShowDashboardAddForm(false);
  };

  // --- REAL-TIME COUNTDOWN TIMER STATES (INDIA STANDARD TIME) ---
  const [nowState, setNowState] = useState(() => {
    const kolkataStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    return new Date(kolkataStr);
  });

  // Keep ticking synced with India Standard Time (IST)
  React.useEffect(() => {
    const timer = setInterval(() => {
      const kolkataStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      setNowState(new Date(kolkataStr));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to parse "09:00 AM" into minutes of day
  const parseTimeToMinutes = (timeStr: string): number => {
    const cleanStr = timeStr.trim().toUpperCase();
    const match = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)$/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  // Compute stats
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  // Subject-wise exam eligibility specs (mandatory 75% per course target)
  const totalSubjectsCount = subjects.length;
  const eligibleSubjectsCount = subjects.filter(s => s.total === 0 || (s.attended / s.total) * 100 >= 75).length;
  const eligiblePercentage = totalSubjectsCount > 0 ? (eligibleSubjectsCount / totalSubjectsCount) * 100 : 0;
  const shortageCount = totalSubjectsCount - eligibleSubjectsCount;
  const isEligibleEverywhere = shortageCount === 0;

  // Find subjects with less than 75% attendance (cutoff)
  const lowAttendanceSubjects = subjects.filter(s => s.total > 0 && (s.attended / s.total) * 100 < 75);

  // Get timetable for the selected day
  const todayClasses = timetable
    .filter(slot => slot.day === selectedDayForTodayClass)
    .sort((a, b) => a.period - b.period);

  // Map slot to subject information
  const todayClassCards = todayClasses
    .map(slot => {
      const subject = subjects.find(s => 
        s.id === slot.subjectId || 
        s.code.toLowerCase() === slot.subjectId.toLowerCase() || 
        s.id.toLowerCase() === slot.subjectId.toLowerCase()
      );
      return {
        slot,
        subject
      };
    })
    .filter(item => item.subject !== undefined) as { slot: TimetableSlot; subject: Subject }[];

  // --- CALCULATE 'NEXT CLASS' & COUNTDOWN ---
  const currentMinutesVal = nowState.getHours() * 60 + nowState.getMinutes();

  const secondsOfMinuteVal = nowState.getSeconds();

  // Map today's classes to simple objects with start and end minutes
  const activeClassSlots = todayClassCards
    .filter(c => c.subject)
    .map(({ slot, subject }) => {
      const startMin = parseTimeToMinutes(slot.startTime);
      const endMin = parseTimeToMinutes(slot.endTime);
      return {
        slot,
        subject: subject!,
        startMin,
        endMin
      };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // Check if there is an ongoing class right now
  const ongoingClass = activeClassSlots.find(
    c => currentMinutesVal >= c.startMin && currentMinutesVal < c.endMin
  );

  // Find the next upcoming class starting after currentMinutesVal
  const nextUpcomingClass = activeClassSlots.find(
    c => c.startMin > currentMinutesVal
  );

  // Recharts Bar Data preparation
  const chartData = subjects.map(s => {
    const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
    return {
      name: s.code,
      'Attendance %': pct,
      'Required %': 75,
      fullName: s.name,
      color: s.color.includes('blue') ? '#3b82f6' : s.color.includes('purple') ? '#a855f7' : s.color.includes('teal') ? '#14b8a6' : s.color.includes('red') ? '#ef4444' : '#f59e0b'
    };
  });

  // Recharts Radar Data for subject balance
  const radarData = subjects.map(s => {
    const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
    return {
      subject: s.code,
      attendance: pct,
      fullMark: 100
    };
  });

  // Recharts 7-Day Attendance Trend data preparation (Reverse tracing logs or applying organic drift)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Trace back logs marked after this specific date to reconstruct the past state
    const logsAfterSpecificDate = logs.filter(entry => entry.date > dateStr);
    
    let simAttended = totalAttended;
    let simTotal = totalClasses;
    
    logsAfterSpecificDate.forEach(log => {
      simTotal = Math.max(1, simTotal - 1);
      if (log.status === 'present') {
        simAttended = Math.max(0, simAttended - 1);
      }
    });

    const calculatedPct = simTotal > 0 ? (simAttended / simTotal) * 100 : overallPercentage;
    
    // Smooth baseline fallbacks if no logs are present yet
    const baselineSlope = (i - 6) * 0.45;
    const seedNoise = ((date.getDate() * 19) % 4) - 2; // -2% to 2%
    
    const finalPct = logs.length > 0 
      ? Math.max(0, Math.min(100, Math.round(calculatedPct * 10) / 10))
      : Math.max(0, Math.min(100, Math.round((overallPercentage + baselineSlope + (seedNoise * 0.2)) * 10) / 10));

    return {
      day: dayName,
      dateLabel: formattedDate,
      'Attendance %': finalPct,
      'Cutoff Limit': 75
    };
  });

  // Circular progress math
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (eligiblePercentage / 100) * circumference;

  // Safe tracking class counter
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  // Helper to resolve course names for Recent Classes Table
  const getSubjectName = (subjectId: string): string => {
    const s = subjects.find(sub => sub.id === subjectId || sub.code === subjectId);
    return s ? `${s.name} (${s.code})` : subjectId;
  };

  // Sort logs dynamically to obtain the last 5 registered classes
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* Premium Welcome Card */}
      <div 
        id="welcome-card" 
        className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden shadow-xl ${
          darkMode 
            ? 'bg-slate-900/40 backdrop-blur-xl border-slate-805/85 shadow-indigo-950/10' 
            : 'bg-white border-slate-205 shadow-slate-100/50'
        }`}
      >
        {/* Glow effect background */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                IIITT Student Portal &bull; Sem {getRomanNumeral(profile.semester)}
              </span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-display font-extrabold tracking-tight mt-1 ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Welcome back, {profile.name}
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              B.Tech {profile.branch} &bull; Section {profile.section} &bull; Roll No: {profile.rollNo}
            </p>
          </div>


        </div>
      </div>

      {/* Critical Attendance Warning Banners */}
      <AnimatePresence>
        {lowAttendanceSubjects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id="critical-warning-banner"
            className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm border transition-all ${
              darkMode 
                ? 'bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent border-red-500/20 text-slate-200' 
                : 'bg-red-50 border-red-150/60 text-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className={`text-sm font-semibold ${darkMode ? 'text-rose-225' : 'text-red-900'}`}>
                  Critical Low Attendance Warning
                </h4>
                <p className={`text-xs mt-0.5 max-w-xl md:max-w-2xl leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  You are falling below 75% in <strong className={darkMode ? 'text-rose-300 font-medium' : 'text-red-950/90 font-semibold'}>{lowAttendanceSubjects.map(s => `${s.name} (${s.code})`).join(', ')}</strong>. 
                  Attend upcoming sessions strictly to remain eligible for Semester {getRomanNumeral(profile.semester)} examinations at IIITT.
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs shrink-0 font-mono rounded-xl px-3 py-1 border transition-all ${
              darkMode ? 'bg-red-950/40 border-red-900/30 text-rose-400' : 'bg-red-100/80 border-red-200/50 text-red-700'
            }`}>
              <span>Limit: 75% cutoff</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Interactive Timetable Classes (Full-width top row widget) */}
      <div 
        id="todays-classes-widget"
        className={`p-5 rounded-3xl border shadow-xl transition-all relative overflow-hidden ${
          darkMode 
            ? 'bg-slate-900/40 backdrop-blur-xl border-slate-805/85 shadow-indigo-950/10' 
            : 'bg-white border-slate-205 shadow-slate-100/50'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4 ${
          darkMode ? 'border-slate-800/60' : 'border-slate-100'
        }`} id="todays-classes-header">
          <div>
            <h3 className={`font-display font-semibold text-base flex items-center gap-25 ${
              darkMode ? 'text-slate-200' : 'text-slate-850'
            }`}>
              <Calendar className="w-5 h-5 text-indigo-500" />
              Today's Schedule &amp; Attendance Simulator
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Simulate dynamic logs and check-ins for current periods</p>
          </div>

          {/* Quick weekday simulator selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-550">Simulate Weekday:</span>
            <select
              id="select-simulated-day"
              value={selectedDayForTodayClass}
              onChange={(e) => setSelectedDayForTodayClass(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-550 font-mono border transition-all cursor-pointer ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
              }`}
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>
        </div>

        {/* Classes list displayed in fluid responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" id="todays-classes-list">
          {todayClassCards.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-500 text-sm font-mono">
              No classes scheduled for {selectedDayForTodayClass}.
            </div>
          ) : (
            todayClassCards.map(({ slot, subject }, idx) => {
              if (!subject) return null;
              const percent = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
              const isNowLive = idx === 0; // Highlight first class as active Now Live
              
              return (
                <div 
                  key={slot.id}
                  id={`class-card-${slot.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group relative ${
                    isNowLive 
                      ? darkMode
                        ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500 border-l-4' 
                        : 'bg-indigo-50/40 border-indigo-600 border-l-4 shadow-sm'
                      : darkMode
                        ? 'border-slate-800/60 bg-slate-800/10 hover:bg-slate-800/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      {isNowLive ? (
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                          darkMode 
                            ? 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20' 
                            : 'text-indigo-750 bg-indigo-100 border-indigo-200'
                        }`}>
                          Live
                        </span>
                      ) : (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          darkMode ? 'bg-slate-850 text-slate-400' : 'bg-slate-200 text-slate-600'
                        }`}>
                          P{slot.period}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {slot.startTime}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className={`text-xs font-bold transition-colors line-clamp-1 ${
                        darkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-850 group-hover:text-indigo-955'
                      }`}>
                        {subject.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{slot.room}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-mono px-1.5 rounded border ${
                        percent >= 75 ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                      }`}>
                        {percent.toFixed(0)}%
                      </span>
                      <span className="text-[8.5px] text-slate-500 font-mono">
                        ({subject.attended}/{subject.total})
                      </span>
                    </div>
                  </div>

                  {/* Quick simulated action button indicators */}
                  <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-150/45 dark:border-slate-800/60" id={`quick-controls-slot-${slot.id}`}>
                    <button
                      title="Mark Present"
                      id={`btn-mark-present-${slot.id}`}
                      onClick={() => markTodayAttendance(subject.id, true, slot.id)}
                      className="py-1 px-1.5 text-[9.5px] bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded flex items-center justify-center gap-1 transition-all cursor-pointer font-bold"
                    >
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>Present</span>
                    </button>
                    <button
                      title="Mark Absent"
                      id={`btn-mark-absent-${slot.id}`}
                      onClick={() => markTodayAttendance(subject.id, false, slot.id)}
                      className="py-1 px-1.5 text-[9.5px] bg-red-500/10 hover:bg-red-650 text-red-400 hover:text-white border border-red-500/20 rounded flex items-center justify-center gap-1 transition-all cursor-pointer font-bold"
                    >
                      <XCircle className="w-2.5 h-2.5" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chart/Visual for Week / Weekly Trends integrated directly */}
        <div className={`mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${darkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
           <div>
             <h4 className="text-[9.5px] font-bold uppercase tracking-wider font-mono text-slate-500">Weekly System Ingress Indicator</h4>
             <p className="text-slate-550 text-[9px] font-mono mt-0.5">Simulated activity log patterns across current days</p>
           </div>
           <div className="flex items-end gap-1.5 h-9 w-full sm:w-48">
             <div className={`flex-1 rounded h-[60%] border transition-all ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}></div>
             <div className="flex-1 bg-indigo-500 rounded h-[85%] shadow-lg shadow-indigo-500/20"></div>
             <div className={`flex-1 rounded h-[40%] border transition-all ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}></div>
             <div className={`flex-1 rounded h-[75%] border transition-all ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}></div>
             <div className="flex-1 bg-emerald-500 rounded h-[95%] shadow-lg shadow-emerald-500/20"></div>
             <div className={`flex-1 rounded h-[15%] border transition-all opacity-50 ${darkMode ? 'bg-[#020617] border-slate-800' : 'bg-slate-50 border-slate-200'}`}></div>
             <div className={`flex-1 rounded h-[10%] border transition-all opacity-50 ${darkMode ? 'bg-[#020617] border-slate-800' : 'bg-slate-50 border-slate-200'}`}></div>
           </div>
        </div>
      </div>

      {/* Primary Key Stats Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="dashboard-key-stats-grid">
        
        {/* Left Side: Real-time Next Class Tracker Widget with Time Simulator Controls */}
        <div 
          id="next-class-tracker-widget" 
          className={`lg:col-span-1 rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[300px] transition-all relative overflow-hidden ${
            darkMode 
              ? 'bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-indigo-950/10' 
              : 'bg-white border border-slate-205 shadow-slate-100/50'
          }`}
        >
          {/* Glow effect background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10 flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                ongoingClass 
                  ? 'bg-emerald-500/15 text-emerald-400 animate-pulse' 
                  : nextUpcomingClass 
                    ? 'bg-indigo-500/15 text-indigo-400' 
                    : 'bg-slate-500/15 text-slate-400'
              }`}>
                <Clock className="w-4.5 h-4.5" />
              </div>

              <div>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                  ongoingClass 
                    ? 'text-emerald-500' 
                    : nextUpcomingClass 
                      ? 'text-indigo-400' 
                      : 'text-slate-550'
                }`}>
                  {ongoingClass ? 'Ongoing Lecture' : nextUpcomingClass ? 'Next Scheduled' : 'No More Lectures'}
                </span>
                <h3 className={`text-sm font-bold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {ongoingClass 
                    ? ongoingClass.subject.name 
                    : nextUpcomingClass 
                      ? nextUpcomingClass.subject.name 
                      : 'Schedule Clear!'}
                </h3>
              </div>
            </div>

            {/* Display Instructor and Period */}
            <div className={`p-3 rounded-xl border text-[11px] ${
              darkMode ? 'bg-slate-950/45 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-205 text-slate-600'
            }`}>
              {ongoingClass ? (
                <div className="space-y-1">
                  <p>Prof: <strong className="font-semibold text-slate-800 dark:text-slate-200">{ongoingClass.subject.professor}</strong></p>
                  <p>Room: <strong className="font-mono text-slate-700 dark:text-slate-300">{ongoingClass.slot.room}</strong> &bull; Period {ongoingClass.slot.period}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{ongoingClass.slot.startTime} - {ongoingClass.slot.endTime}</p>
                </div>
              ) : nextUpcomingClass ? (
                <div className="space-y-1">
                  <p>Prof: <strong className="font-semibold text-slate-800 dark:text-slate-200">{nextUpcomingClass.subject.professor}</strong></p>
                  <p>Room: <strong className="font-mono text-slate-700 dark:text-slate-300">{nextUpcomingClass.slot.room}</strong> &bull; Period {nextUpcomingClass.slot.period}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{nextUpcomingClass.slot.startTime} - {nextUpcomingClass.slot.endTime}</p>
                </div>
              ) : (
                <p className="text-slate-505 italic">No remaining scheduled classes for {selectedDayForTodayClass}. Enjoy your day!</p>
              )}
            </div>

            {/* Real-time Countdown Metric */}
            <div className="pt-2">
              {ongoingClass ? (
                <div>
                  <span className="text-[9px] text-slate-550 uppercase font-mono tracking-wider">Ends In</span>
                  <span className="text-2xl font-display font-bold tracking-tight text-emerald-400 font-mono block">
                    {(() => {
                      const totalDiffSeconds = (ongoingClass.endMin - currentMinutesVal) * 60 - secondsOfMinuteVal;
                      if (totalDiffSeconds <= 0) return "Ending now...";
                      const mins = Math.floor(totalDiffSeconds / 60);
                      const secs = totalDiffSeconds % 60;
                      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
                    })()}
                  </span>
                </div>
              ) : nextUpcomingClass ? (
                <div>
                  <span className="text-[9px] text-slate-550 uppercase font-mono tracking-wider">Starts In</span>
                  <span className="text-2xl font-display font-bold tracking-tight text-indigo-400 font-mono block">
                    {(() => {
                      const totalDiffSeconds = (nextUpcomingClass.startMin - currentMinutesVal) * 60 - secondsOfMinuteVal;
                      if (totalDiffSeconds <= 0) return "Starting now...";
                      const hrs = Math.floor(totalDiffSeconds / 3600);
                      const mins = Math.floor((totalDiffSeconds % 3600) / 60);
                      const secs = totalDiffSeconds % 60;
                      let str = "";
                      if (hrs > 0) str += `${hrs}h `;
                      str += `${mins}m ${secs.toString().padStart(2, '0')}s`;
                      return str;
                    })()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* India Standard Time Status indicator */}
          <div className={`mt-4 pt-3 border-t flex justify-between items-center text-[9px] font-mono text-slate-500 ${
            darkMode ? 'border-slate-800/50' : 'border-slate-100'
          }`}>
            <span>Synced timezone:</span>
            <span className="font-bold uppercase tracking-wider text-indigo-500">Asia/Kolkata (IST)</span>
          </div>
        </div>
        
        {/* Core Percentage Gauge Metric */}
        <div className={`lg:col-span-1 rounded-3xl p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-xl min-h-[300px] transition-all ${
          darkMode 
            ? 'bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-indigo-950/10' 
            : 'bg-white border border-slate-205 shadow-slate-100/50'
        }`} id="attendance-gauge-widget">
          {darkMode && <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />}
          
          <h3 className={`font-mono text-xs font-bold uppercase tracking-wider mb-2 text-center ${
            darkMode ? 'text-slate-440' : 'text-slate-600'
          }`}>
            Exam Eligibility
          </h3>

          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background track circle */}
              <circle
                cx="80"
                cy="80"
                r={60}
                className={darkMode ? "stroke-slate-950/80" : "stroke-slate-100"}
                strokeWidth={10}
                fill="transparent"
              />
              {/* Foreground gradient path */}
              <circle
                cx="80"
                cy="80"
                r={60}
                className={`transition-all duration-1000 ease-out`}
                strokeWidth={10}
                fill="transparent"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - (totalSubjectsCount > 0 ? eligibleSubjectsCount / totalSubjectsCount : 0))}
                strokeLinecap="round"
                style={{
                  stroke: isEligibleEverywhere ? "#34d399" : "#f43f5e"
                }}
              />
            </svg>

            {/* Inner text values */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-display font-semibold tracking-tight ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {eligibleSubjectsCount}<span className="text-lg text-indigo-500">/{totalSubjectsCount}</span>
              </span>
              <span className="text-[9px] font-mono text-slate-550 mt-0.5 uppercase tracking-wider">
                Subjects Approved
              </span>
            </div>
          </div>

          <div className={`w-full text-center grid grid-cols-2 gap-4 border-t pt-4 ${
            darkMode ? 'border-slate-800/60' : 'border-slate-100'
          }`}>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">STATUS</span>
              <span className={`text-[10px] font-bold mt-1 inline-block py-0.5 px-2.5 rounded-full ${
                isEligibleEverywhere ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {isEligibleEverywhere ? 'ALL CLEAR' : 'SHORTAGE'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">CRITERION</span>
              <span className={`text-[11px] font-semibold mt-1.5 block ${
                darkMode ? 'text-slate-350' : 'text-slate-705'
              }`}>
                ≥75% per course
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Subject-wise Evaluation Bar Chart Widget */}
        <div className={`lg:col-span-1 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[300px] transition-all ${
          darkMode 
            ? 'bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-indigo-950/5' 
            : 'bg-white border border-slate-205 shadow-slate-100/50'
        }`} id="attendance-chart-widget">
          <div>
            <div id="chart-widget-header" className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-mono text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Subject Evaluation
                </h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Subject stats vs 75% cutoff</p>
              </div>
              <div className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                darkMode ? 'bg-[#020617]/40 border-slate-800 text-indigo-400' : 'bg-indigo-50 border-indigo-120 text-indigo-600'
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Recharts Bar Container */}
            <div className="h-44 w-full min-w-0" id="attendance-recharts-bar">
              {chartMounted ? (
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? "#475569" : "#64748b"} 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke={darkMode ? "#475569" : "#64748b"} 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(99,102,241,0.025)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-2.5 rounded-xl shadow-xl text-xs border ${
                              darkMode ? 'bg-[#020617]/95 border-slate-800/80 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                            }`}>
                              <p className="font-semibold">{data.fullName}</p>
                              <p className="text-indigo-500 font-bold mt-0.5">Current: {payload[0].value}%</p>
                              <p className="text-slate-450 text-[10px]">Min Cutoff: 75%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      y={75} 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="3 3" 
                    />
                    <Bar 
                      dataKey="Attendance %" 
                      radius={[4, 4, 0, 0]}
                      fill="#6366f1"
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 w-full flex items-center justify-center text-xs text-slate-400 font-mono">Loading subject evaluation...</div>
              )}
            </div>
          </div>
          
          <div className={`flex items-center justify-between border-t pt-3 mt-3 gap-2 ${
            darkMode ? 'border-slate-800/50' : 'border-slate-100'
          }`}>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Evaluated Courses
            </span>
            <span className={`text-[11px] font-semibold text-indigo-500 cursor-pointer flex items-center hover:underline`} onClick={() => {
              const el = document.getElementById('subject-cards-hub');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              <span>Detail Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Recent Classes Table Card */}
      <div 
        id="recent-classes-card"
        className={`p-6 rounded-3xl border shadow-xl transition-all mt-8 ${
          darkMode 
            ? 'bg-slate-900/40 backdrop-blur-xl border-slate-805/85 shadow-indigo-950/5' 
            : 'bg-white border-slate-205 shadow-slate-100/50'
        }`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className={`font-display font-semibold text-base flex items-center gap-2 ${
              darkMode ? 'text-slate-200' : 'text-slate-850'
            }`}>
              <Activity className="w-4.5 h-4.5 text-indigo-500" />
              Recent Classes Ledger
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Verify your last 5 attendance entries across courses</p>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-xl border transition-all ${
            darkMode ? 'text-slate-400 bg-slate-900/60 border-slate-800' : 'text-slate-600 bg-white border-slate-200 shadow-sm'
          }`}>
            {logs.length} Total Logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] uppercase font-mono tracking-wider ${
                darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-150 text-slate-500'
              }`}>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-400 font-mono">
                    No recent attendance logs found.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => {
                  const subjectName = getSubjectName(log.subjectId);
                  const isPresent = log.status === 'present';
                  const isAbsent = log.status === 'absent';
                  
                  return (
                    <tr 
                      key={log.id} 
                      className="text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {subjectName}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isPresent 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' 
                            : isAbsent 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15' 
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid of Interactive Daily Schedule & Quick Attendance Action */}
      <div className="mt-8" id="dashboard-schedule-grid">
        
        {/* Right Side: Quick Subject Metrics Overview Grid */}
        <div className="w-full space-y-4" id="subject-cards-hub">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className={`font-display font-semibold text-lg flex items-center gap-2 ${
                darkMode ? 'text-slate-200' : 'text-slate-850'
              }`}>
                <Layers className="w-4.5 h-4.5 text-indigo-500" />
                Subject Ledger Summary
              </h3>
              <p className="text-slate-500 text-xs">Instantly view and manage individual subject status</p>
            </div>
            
            <div className="flex items-center gap-2">
              {subjects.length > 0 && onClearAllSubjects && (
                <button 
                  id="btn-dash-clear-subjects"
                  onClick={onClearAllSubjects}
                  className={`px-3 py-1.5 font-semibold rounded-xl text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-rose-950/15 border-rose-900/30 hover:bg-rose-950/30 text-rose-400' 
                      : 'bg-rose-50 border-rose-150 hover:bg-rose-100/70 text-rose-700'
                  }`}
                >
                  Clear All
                </button>
              )}
              <button 
                id="btn-dash-add-subject"
                onClick={() => setShowDashboardAddForm(!showDashboardAddForm)}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow hover:shadow-indigo-500/20 cursor-pointer transition-all"
              >
                + Add Subject
              </button>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-xl border transition-all ${
                darkMode ? 'text-slate-400 bg-slate-900/60 border-slate-800' : 'text-slate-600 bg-white border-slate-200 shadow-sm'
              }`}>
                {subjects.length} Total Courses
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showDashboardAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-5 rounded-2xl border transition-all overflow-hidden ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'
                }`}
              >
                <form onSubmit={handleDashAddSubmit} className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-indigo-500">Quick Register Course</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold block mb-1 text-slate-500">CODE (e.g. CS302)</label>
                      <input 
                        type="text" 
                        value={dashCode} 
                        onChange={e => setDashCode(e.target.value)} 
                        className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 transition-all ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white font-mono' : 'bg-white border-slate-205 text-slate-800 font-mono'
                        }`}
                        placeholder="CS302"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold block mb-1 text-slate-500">COURSE NAME</label>
                      <input 
                        type="text" 
                        value={dashName} 
                        onChange={e => setDashName(e.target.value)} 
                        className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 transition-all ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-800'
                        }`}
                        placeholder="Database Management Systems"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold block mb-1 text-slate-500">INSTRUCTOR/PROFESSOR</label>
                      <input 
                        type="text" 
                        value={dashProf} 
                        onChange={e => setDashProf(e.target.value)} 
                        className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 transition-all ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-800'
                        }`}
                        placeholder="Dr. G. Devasena"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold block mb-1 text-slate-500">CREDITS</label>
                      <select 
                        value={dashCredits} 
                        onChange={e => setDashCredits(Number(e.target.value))} 
                        className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:border-indigo-500 transition-all ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-800'
                        }`}
                      >
                        <option value="1">1 Credit</option>
                        <option value="2">2 Credits</option>
                        <option value="3">3 Credits</option>
                        <option value="4">4 Credits</option>
                        <option value="5">5 Credits</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button 
                      type="button" 
                      onClick={() => setShowDashboardAddForm(false)}
                      className={`px-3 py-1.5 font-semibold rounded-lg hover:underline cursor-pointer ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 font-semibold bg-indigo-500 hover:bg-indigo-650 text-white rounded-lg shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      Register Course
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="subject-ledger-cards-grid">
            {subjects.length === 0 ? (
              <div className={`col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 px-6 rounded-3xl border transition-all flex flex-col items-center justify-center gap-3 ${
                darkMode 
                  ? 'bg-slate-900/40 border-slate-805/70 shadow-indigo-950/5' 
                  : 'bg-white border-slate-205 shadow-slate-100/50'
              }`}>
                <div className={`p-3 rounded-full border ${
                  darkMode ? 'bg-indigo-950/40 border-indigo-500/10 text-indigo-400' : 'bg-indigo-50 border-indigo-120 text-indigo-600'
                }`}>
                  <Layers className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className={`font-display font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-850'}`}>
                    No Subjects Registered Yet
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm">
                    Your semester scorecard is empty. Click "+ Add Subject" or switch to the Analytics predictions cabin to register custom courses.
                  </p>
                </div>
                <button
                  onClick={() => setShowDashboardAddForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 cursor-pointer transition-all mt-2"
                >
                  Create Your First Subject
                </button>
              </div>
            ) : (
              subjects.map(subject => {
                const currentPercent = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
                const isEligible = currentPercent >= 75;

                return (
                  <div 
                    key={subject.id}
                    id={`subject-card-${subject.id}`}
                    className={`rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group shadow-md border ${
                      darkMode 
                        ? 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80' 
                        : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-slate-100/30'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${subject.color} opacity-[0.03] blur-xl rounded-full pointer-events-none`} />
                    
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                          {subject.code} &bull; CREDITS {subject.credits}
                        </span>
                        <h4 className={`text-sm font-semibold transition-colors mt-0.5 line-clamp-1 ${
                          darkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-indigo-950'
                        }`}>
                          {subject.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`text-xs font-mono font-bold ${isEligible ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {currentPercent.toFixed(1)}%
                        </div>
                        {onDeleteSubject && (
                          <button
                            id={`btn-dash-delete-${subject.id}`}
                            title="Remove Course Subject"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSubject(subject.id);
                            }}
                            className={`p-1 rounded-md border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer ${
                              darkMode 
                                ? 'bg-rose-950/15 border-rose-500/25 hover:bg-rose-950/40 text-rose-450' 
                                : 'bg-rose-50 border-rose-150 hover:bg-rose-100 text-rose-700'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Horizontal visual progress health scale */}
                    <div className={`w-full rounded-full h-1.5 overflow-hidden my-3 ${
                      darkMode ? 'bg-slate-950/85' : 'bg-slate-100'
                    }`}>
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${subject.color}`} 
                        style={{ width: `${Math.min(currentPercent, 100)}%` }}
                      />
                    </div>

                    <div className={`flex items-center justify-between text-[11px] border-t pt-3 mt-3 ${
                      darkMode ? 'border-slate-850/60' : 'border-slate-100'
                    }`}>
                      <span className="text-slate-500">
                        Logged: {subject.attended}/{subject.total} LECTURES
                      </span>

                      {/* Eligibility Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                        isEligible 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                      }`}>
                        {isEligible ? 'Safe' : 'Banned Alert'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>    
    </div>
  );
}
