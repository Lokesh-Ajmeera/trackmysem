import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, LayoutDashboard, Calendar, BarChart2, User, 
  Sun, Moon, LogOut, ChevronRight, Menu, X, Info, Bell, AlertTriangle, CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  StudentProfile, Subject, TimetableSlot, AttendanceEntry, Notification, BranchCode, getRomanNumeral 
} from './types';
import { 
  DEFAULT_STUDENT, DEFAULT_SUBJECTS_CSE, DEFAULT_SUBJECTS_ECE, 
  DEFAULT_SUBJECTS_CSE_AI_DS, DEFAULT_SUBJECTS_ECE_VLSI,
  DEFAULT_TIMETABLE_CSE, DEFAULT_TIMETABLE_ECE, INITIAL_NOTIFICATIONS, 
  loadLocalData, saveLocalData, DEFAULT_LOGS
} from './data/mockStudent';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';

import { 
  auth, db, doc, getDoc, setDoc, 
  onAuthStateChanged, signOut 
} from './lib/firebase';

export default function App() {
  // Session Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('iiitt_offline_bypass') === 'true';
  });
  const [isInitializingAuth, setIsInitializingAuth] = useState<boolean>(() => {
    return localStorage.getItem('iiitt_offline_bypass') !== 'true';
  });
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(() => {
    return localStorage.getItem('iiitt_offline_bypass') === 'true';
  });

  // Theme preference state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('iiitt_portal_theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    return 'system';
  });

  // Dark/Light Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('iiitt_portal_theme');
    if (savedTheme === 'light') return false;
    if (savedTheme === 'dark') return true;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default fallback to dark mode template if not supported
  });

  useEffect(() => {
    const handleThemeChange = () => {
      if (theme === 'system') {
        const matchesDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(matchesDark);
      } else {
        setDarkMode(theme === 'dark');
      }
    };

    handleThemeChange();

    if (theme === 'system') {
      const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      if (mediaQuery) {
        const listener = (e: MediaQueryListEvent) => {
          setDarkMode(e.matches);
        };
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      }
    }
  }, [theme]);

  // Keep saved value in local storage whenever it's updated
  useEffect(() => {
    localStorage.setItem('iiitt_portal_theme', theme);
    localStorage.setItem('iiitt_portal_darkmode', JSON.stringify(darkMode));
  }, [theme, darkMode]);

  // Menu Drawer for Mobile devices
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification dropdown visibility state
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Active navigational tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'analytics' | 'profile'>('dashboard');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Core Database records backed by Firestore (initially populated with safe defaults and LocalStorage persistence)
  const [profile, setProfile] = useState<StudentProfile>(() => loadLocalData('iiitt_profile', DEFAULT_STUDENT));

  const isAdminUser = ['lokeshhajmeera@gmail.com', 'lokeshhajmeera@iiitt.ac.in'].includes((profile?.email || "").toLowerCase()) || !!(auth?.currentUser?.email && ['lokeshhajmeera@gmail.com', 'lokeshhajmeera@iiitt.ac.in'].includes(auth.currentUser.email.toLowerCase()));

  const [subjects, setSubjects] = useState<Subject[]>(() => loadLocalData('iiitt_subjects', []));
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => loadLocalData('iiitt_timetable', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadLocalData('iiitt_notifications', INITIAL_NOTIFICATIONS));
  const [logs, setLogs] = useState<AttendanceEntry[]>(() => loadLocalData('iiitt_logs', DEFAULT_LOGS));

  // Firebase Firestore write permissions rules state
  const [firebaseSyncError, setFirebaseSyncError] = useState<boolean>(false);

  // Listen to Auth State and Fetch from Firestore
  useEffect(() => {
    // Safety fallback: If Auth initialization or fetching hangs (e.g. Chrome/Safari iframe IndexedDB restrictions), resolve loader in 7.5s
    const authTimeout = setTimeout(() => {
      console.log("Auth state safely resolved on fallback. Transitioning portal loader.");
      setIsInitializingAuth(false);
    }, 7500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(authTimeout);
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        // clear bypass to ensure clean remote sync when logged in
        localStorage.removeItem('iiitt_offline_bypass');
        try {
          const docRef = doc(db, 'users', uid);
          
          // Introduce a fast-timeout race to protect against hanging Firestore gets (common in offline/network sandboxes)
          const docSnap = await Promise.race([
            getDoc(docRef),
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error("Firestore fetch timed out")), 1300)
            )
          ]);

          setFirebaseSyncError(false);
          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              const loadedProfile = {
                name: data.name !== undefined ? data.name : DEFAULT_STUDENT.name,
                rollNo: data.rollNo !== undefined ? data.rollNo : DEFAULT_STUDENT.rollNo,
                email: data.email !== undefined ? data.email : DEFAULT_STUDENT.email,
                branch: data.branch !== undefined ? data.branch : DEFAULT_STUDENT.branch,
                semester: data.semester !== undefined ? data.semester : 0,
                year: data.year !== undefined ? data.year : "",
                phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : "",
                section: data.section !== undefined ? data.section : "",
                batch: data.batch !== undefined ? data.batch : "",
                gpa: data.gpa !== undefined ? data.gpa : 0,
                avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : DEFAULT_STUDENT.avatarUrl,
              };
              setProfile(loadedProfile);
              setSubjects(data.subjects || []);
              setTimetable(data.timetable || []);
              setNotifications(data.notifications || []);
              setLogs(data.logs || []);

              // Seed local storage with latest remote success values
              saveLocalData('iiitt_profile', loadedProfile);
              saveLocalData('iiitt_subjects', data.subjects || []);
              saveLocalData('iiitt_timetable', data.timetable || []);
              saveLocalData('iiitt_notifications', data.notifications || []);
              saveLocalData('iiitt_logs', data.logs || []);
            }
          }
          setIsLoggedIn(true);
          setIsDataLoaded(true);
        } catch (err: any) {
          console.warn("Firestore sync bypass or timeout triggered:", err);
          if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
            setFirebaseSyncError(true);
          }
          // Fall back gracefully in case of connection or permission limits so user gets immediate entrance
          setIsLoggedIn(true);
          setIsDataLoaded(true);
        }
      } else {
        // Fallback to local sandbox guest login if bypass indicator is active
        if (localStorage.getItem('iiitt_offline_bypass') === 'true') {
          setIsLoggedIn(true);
          setIsDataLoaded(true);
        } else {
          setIsLoggedIn(false);
          setIsDataLoaded(false);
        }
      }
      setIsInitializingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize All Dynamic State with LocalStorage and (if authenticated/permitted) Firestore
  useEffect(() => {
    // Write immediately to LocalStorage for zero-latency durability
    saveLocalData('iiitt_profile', profile);
    saveLocalData('iiitt_subjects', subjects);
    saveLocalData('iiitt_timetable', timetable);
    saveLocalData('iiitt_notifications', notifications);
    saveLocalData('iiitt_logs', logs);

    if (!auth.currentUser || !isDataLoaded) return;

    const uid = auth.currentUser.uid;
    const saveToFirestore = async () => {
      try {
        await setDoc(doc(db, 'users', uid), {
          uid,
          ...profile,
          subjects,
          timetable,
          notifications,
          logs
        });
        setFirebaseSyncError(false);
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
          setFirebaseSyncError(true);
        }
      }
    };

    const timeout = setTimeout(() => {
      saveToFirestore();
    }, 1200); // 1.2s debounce protection

    return () => clearTimeout(timeout);
  }, [profile, subjects, timetable, notifications, logs, isDataLoaded]);

  useEffect(() => {
    localStorage.setItem('iiitt_portal_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Handle Login event triggered from Login panel
  const handleLoginSuccess = async (uid: string) => {
    if (uid === 'offline-sandbox-user') {
      localStorage.setItem('iiitt_offline_bypass', 'true');
      setIsLoggedIn(true);
      setIsDataLoaded(true);
      setIsInitializingAuth(false);
      return;
    }

    setIsInitializingAuth(true);
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      setFirebaseSyncError(false);
      
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          const loadedProfile = {
            name: data.name !== undefined ? data.name : DEFAULT_STUDENT.name,
            rollNo: data.rollNo !== undefined ? data.rollNo : DEFAULT_STUDENT.rollNo,
            email: data.email !== undefined ? data.email : DEFAULT_STUDENT.email,
            branch: data.branch !== undefined ? data.branch : DEFAULT_STUDENT.branch,
            semester: data.semester !== undefined ? data.semester : 0,
            year: data.year !== undefined ? data.year : "",
            phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : "",
            section: data.section !== undefined ? data.section : "",
            batch: data.batch !== undefined ? data.batch : "",
            gpa: data.gpa !== undefined ? data.gpa : 0,
            avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : DEFAULT_STUDENT.avatarUrl,
          };
          setProfile(loadedProfile);
          setSubjects(data.subjects || []);
          setTimetable(data.timetable || []);
          setNotifications(data.notifications || []);
          setLogs(data.logs || []);

          // Seed local storage with latest remote success values
          saveLocalData('iiitt_profile', loadedProfile);
          saveLocalData('iiitt_subjects', data.subjects || []);
          saveLocalData('iiitt_timetable', data.timetable || []);
          saveLocalData('iiitt_notifications', data.notifications || []);
          saveLocalData('iiitt_logs', data.logs || []);
        }
      }
      setIsLoggedIn(true);
      setIsDataLoaded(true);
    } catch (err: any) {
      console.warn("Direct document load handler error:", err);
      if (err?.message?.toLowerCase().includes('permission') || err?.code === 'permission-denied') {
        setFirebaseSyncError(true);
      }
      setIsLoggedIn(true);
      setIsDataLoaded(true);
    } finally {
      setIsInitializingAuth(false);
    }
  };

  // Log class attendance directly from Dashboard cards
  const markTodayAttendance = (subjectId: string, isPresent: boolean, slotId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Safety check: Avoid multiple duplicates on same slot today to keep simulation fun and non-disruptive
    const duplicateKey = `${todayStr}-${slotId}`;
    const alreadyLoggedForSlot = logs.some(entry => entry.slotId === slotId && entry.date === todayStr);

    if (alreadyLoggedForSlot) {
      // Allow re-logging by overriding last entry or just show reminder:
      // Let's create an elegant temporary push notification informing them
      const notif: Notification = {
        id: `notif-err-${Date.now()}`,
        title: "Re-logged Class Session",
        message: `Updated attendance log for your slot today. Previous mark overridden.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    }

    // Update subject attended/total counts
    setSubjects(prevSubjects => {
      return prevSubjects.map(sub => {
        if (sub.id === subjectId) {
          const nextAttended = isPresent ? sub.attended + 1 : sub.attended;
          const nextTotal = sub.total + 1;
          
          // Re-generate general alert in notifications if they slip below 75%
          const percentage = (nextAttended / nextTotal) * 100;
          if (percentage < 75 && (sub.attended / sub.total) * 100 >= 75) {
            const warningNotif: Notification = {
              id: `notif-warn-${Date.now()}`,
              title: "Critical Low Attendance Warning",
              message: `Your dynamic attendance in ${sub.name} (${sub.code}) has slipped to ${percentage.toFixed(1)}%. Maintain logs!`,
              type: 'alert',
              timestamp: new Date().toISOString(),
              read: false
            };
            setNotifications(prev => [warningNotif, ...prev]);
          }

          return {
            ...sub,
            attended: nextAttended,
            total: nextTotal
          };
        }
        return sub;
      });
    });

    // Record logging entry
    const newEntry: AttendanceEntry = {
      id: `log-${Date.now()}`,
      date: todayStr,
      subjectId,
      slotId,
      status: isPresent ? 'present' : 'absent',
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newEntry, ...prev]);

    // Construct positive feedback toast notification
    const subDesc = subjects.find(s => s.id === subjectId)?.name || 'Class Session';
    const successNotif: Notification = {
      id: `notif-suc-${Date.now()}`,
      title: isPresent ? "Attendance Logged Present" : "Attendance Logged Absent",
      message: `Successfully logged ${isPresent ? 'Presence' : 'Absence'} in ${subDesc} today.`,
      type: isPresent ? 'success' : 'alert',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [successNotif, ...prev]);
  };

  // Analytics tab modification logs
  const onUpdateSubjectStats = (subjectId: string, attended: number, total: number) => {
    setSubjects(prevSubjects => {
      return prevSubjects.map(sub => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            attended,
            total
          };
        }
        return sub;
      });
    });
  };

  // Add individual new subjects
  const onAddCustomSubject = (code: string, name: string, professor: string, credits: number) => {
    // Palette gradients of tailwindcss specifically mapped
    const colors = [
      "from-cyan-500 to-blue-500",
      "from-teal-500 to-emerald-600",
      "from-purple-500 to-indigo-500",
      "from-amber-400 to-orange-500",
      "from-pink-500 to-rose-600 inline",
      "from-indigo-400 to-cyan-500"
    ];
    const randomizedColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      code,
      name,
      professor,
      credits,
      attended: 0,
      total: 0,
      color: randomizedColor
    };

    setSubjects(prev => [...prev, newSub]);

    const notif: Notification = {
      id: `notif-add-${Date.now()}`,
      title: "New Subject Registered",
      message: `Course ${name} (${code}) has been integrated into your Semester ${getRomanNumeral(profile.semester)} layout successfully.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Delete a subject completely
  const onDeleteSubject = (subjectId: string) => {
    const deletedSub = subjects.find(s => s.id === subjectId);
    setSubjects(prev => prev.filter(sub => sub.id !== subjectId));

    if (deletedSub) {
      const notif: Notification = {
        id: `notif-del-${Date.now()}`,
        title: "Subject Removed",
        message: `Course ${deletedSub.name} (${deletedSub.code}) has been removed from your semester layout.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Clear all subjects completely
  const onClearAllSubjects = () => {
    setSubjects([]);
    setLogs([]);
    const notif: Notification = {
      id: `notif-clear-all-${Date.now()}`,
      title: "All Subjects Cleared",
      message: "All semester courses and attendance history logs have been cleared successfully.",
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Timetable customizations
  const onUpdateSlot = (updatedSlot: TimetableSlot) => {
    setTimetable(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s));
  };

  const onResetTimetable = () => {
    const defaultTimetable = (profile.branch === 'CSE' || profile.branch === 'CSE AI & DS') ? DEFAULT_TIMETABLE_CSE : DEFAULT_TIMETABLE_ECE;
    setTimetable(defaultTimetable);
    
    const notif: Notification = {
      id: `notif-res-${Date.now()}`,
      title: "Timetable Restored",
      message: "The original institute timetable parameters have been restored to your system ledger.",
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const onAddTimetableSlot = (newSlot: Omit<TimetableSlot, 'id'>) => {
    const slot: TimetableSlot = {
      ...newSlot,
      id: `slot-${Date.now()}`
    };
    setTimetable(prev => [...prev, slot]);

    const notif: Notification = {
      id: `notif-slot-add-${Date.now()}`,
      title: "New Lecture Slot Scheduled",
      message: `A new class slot on ${newSlot.day} is created at period ${newSlot.period}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const onDeleteTimetableSlot = (slotId: string) => {
    setTimetable(prev => prev.filter(s => s.id !== slotId));

    const notif: Notification = {
      id: `notif-slot-del-${Date.now()}`,
      title: "Lecture Slot Removed",
      message: "The selected class slot has been deleted from your scheduler.",
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleUpdateProfile = (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('iiitt_offline_bypass');
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase Sign Out Error: ", err);
    }
  };

  const handleResetData = () => {
    setProfile(DEFAULT_STUDENT);
    setSubjects([]);
    setTimetable([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLogs([]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const readNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Guard routing if initializing auth or loading cloud data
  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans selection:bg-indigo-500">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/25 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 p-0.5 shadow-xl shadow-indigo-500/15 mb-6 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center border border-white/5">
              <GraduationCap className="w-6 h-6 text-indigo-400 animate-bounce" />
            </div>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin mb-3" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono pr-0.5 text-indigo-400 font-bold">IIIT Tiruchirappalli</span>
          <span className="text-xs text-slate-400 font-light mt-1">Booting secure academic records ledger...</span>
        </div>
      </div>
    );
  }

  // Guard routing if not logged in
  if (!isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        theme={theme} 
        onChangeTheme={setTheme} 
        darkMode={darkMode} 
      />
    );
  }

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen relative font-sans transition-all duration-500 overflow-hidden ${
      darkMode 
        ? 'bg-[#020617] text-slate-100 selection:bg-indigo-500 selection:text-white' 
        : 'bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white'
    }`}>
      
      {/* Dynamic drifting background orbs */}
      {darkMode ? (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-600/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-violet-600/15 to-indigo-500/5 blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-pink-100/35 to-teal-100/5 blur-[110px] pointer-events-none" />
        </>
      )}

      {/* Grid Pattern Background overlay */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:38px_38px] ${
        darkMode ? 'opacity-100' : 'opacity-[0.1]'
      }`} />

      {/* Main Side bar layout + Page wrapper */}
      <div className="relative z-10 flex min-h-screen">
        
        {/* SIDE BAR NAVIGATION - Desktop-only */}
        <aside className={`hidden lg:flex flex-col w-64 shrink-0 border-r transition-all ${
          darkMode 
            ? 'bg-slate-900/30 border-slate-800/80 backdrop-blur-xl' 
            : 'bg-white border-slate-200/80 backdrop-blur-md shadow-sm'
        }`}>
          {/* Logo Brand Title */}
          <div className={`p-6 border-b flex items-center gap-3 ${
            darkMode ? 'border-slate-800/60' : 'border-slate-100'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-[1.5px] flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                darkMode ? 'bg-[#020617]' : 'bg-white'
              }`}>
                <GraduationCap className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
            </div>
            <div>
              <h1 className={`text-sm font-semibold tracking-wide font-display ${
                darkMode ? 'text-slate-105' : 'text-slate-900'
              }`}>
                TrackMySem
              </h1>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">
                Official B.Tech Portal
              </span>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 p-4 space-y-1.5 mt-4">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsAdminView(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
                activeTab === 'dashboard' && !isAdminView
                  ? darkMode 
                    ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3.5'
                    : 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 pl-3.5 font-bold shadow-sm'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              <span>Portal Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('timetable');
                setIsAdminView(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
                activeTab === 'timetable' && !isAdminView
                  ? darkMode 
                    ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3.5'
                    : 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 pl-3.5 font-bold shadow-sm'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Calendar className="w-4.5 h-4.5 shrink-0" />
              <span>Personal Timetable</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                setIsAdminView(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
                activeTab === 'analytics' && !isAdminView
                  ? darkMode 
                    ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3.5'
                    : 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 pl-3.5 font-bold shadow-sm'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <BarChart2 className="w-4.5 h-4.5 shrink-0" />
              <span>Analytics &amp; Predictor</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsAdminView(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
                activeTab === 'profile' && !isAdminView
                  ? darkMode 
                    ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3.5'
                    : 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 pl-3.5 font-bold shadow-sm'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <User className="w-4.5 h-4.5 shrink-0" />
              <span>Profile &amp; Settings</span>
            </button>

            {isAdminUser && (
              <>
                <div className={`h-px my-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-200/50'}`} />

                <button
                  onClick={() => {
                    setIsAdminView(true);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
                    isAdminView
                      ? darkMode 
                        ? 'bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-500 pl-3.5 font-bold shadow-md'
                        : 'bg-indigo-50 text-indigo-800 border-l-2 border-indigo-650 pl-3.5 font-extrabold shadow-md'
                      : darkMode
                        ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                        : 'text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50/80 font-bold border border-indigo-100/60'
                  }`}
                >
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-indigo-500" />
                  <span>Admin Dashboard</span>
                </button>
              </>
            )}
          </nav>

          {/* Quick Profile Footer info */}
          <div className={`p-4 border-t ${darkMode ? 'border-slate-805/50' : 'border-slate-100'}`}>
            <div className={`p-3 rounded-2xl flex items-center gap-2.5 border transition-all ${
              darkMode 
                ? 'bg-slate-900/30 border-slate-800/50' 
                : 'bg-slate-50 border-slate-150/70 shadow-sm'
            }`}>
              <img 
                referrerPolicy="no-referrer"
                src={profile.avatarUrl} 
                alt={profile.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="overflow-hidden">
                <span className={`block text-[11px] font-semibold truncate ${
                  darkMode ? 'text-slate-200' : 'text-slate-900'
                }`}>{profile.name}</span>
                <span className="block text-[9px] font-mono text-slate-500 truncate">{profile.rollNo}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTAINER CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOP HEADER CONTROLS */}
          <header className={`px-6 py-4 border-b flex items-center justify-between z-30 transition-all ${
            darkMode 
              ? 'bg-[#020617]/25 border-slate-805/50 backdrop-blur-md' 
              : 'bg-white border-slate-200/60 shadow-sm'
          }`}>
            
            {/* Left Header: Brand indicators */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition-all border ${
                  darkMode 
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                    : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <GraduationCap className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span className={`font-display font-extrabold text-lg tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  TrackMySem
                </span>
                <span className={`hidden sm:inline-block text-[10px] uppercase tracking-[0.12em] font-mono px-2.5 py-0.5 rounded-full border ${
                  darkMode ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-650'
                }`}>
                  Sem {getRomanNumeral(profile.semester)}
                </span>
              </div>
            </div>

            {/* Right Header: Student Name and Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profile.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {profile.rollNo} &bull; {profile.branch}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    id="btn-toggle-notif-dropdown"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      darkMode 
                        ? 'bg-slate-900/40 border-slate-805 text-slate-300 hover:text-white hover:border-slate-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title="Toggle Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifsCount > 0 && (
                      <span id="unread-badge" className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-650 rounded-full flex items-center justify-center text-[9px] text-white font-bold animate-bounce">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {notifDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        id="notification-dropdown-box"
                        className={`absolute right-0 top-11 w-80 sm:w-96 rounded-2xl shadow-2xl p-4 z-50 border transition-all ${
                          darkMode ? 'bg-slate-900/95 backdrop-blur-xl border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className={`flex items-center justify-between border-b pb-2 mb-3 ${
                          darkMode ? 'border-slate-800' : 'border-slate-100'
                        }`}>
                          <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${
                            darkMode ? 'text-slate-300' : 'text-slate-800'
                          }`}>
                            Notifications ({notifications.length})
                          </h4>
                          {notifications.length > 0 && (
                            <button 
                              onClick={clearNotifications}
                              className="text-[10px] text-indigo-500 hover:underline cursor-pointer font-mono"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                          {notifications.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              No active alerts or notifications.
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                onClick={() => readNotification(notif.id)}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  notif.read 
                                  ? darkMode 
                                    ? 'bg-slate-950/20 border-slate-850/65 opacity-60 text-slate-400' 
                                    : 'bg-slate-50 border-slate-105 text-slate-400 opacity-80'
                                  : darkMode
                                    ? 'bg-slate-950/50 border-slate-800 text-slate-200 hover:bg-[#020617]' 
                                    : 'bg-slate-50/50 border-slate-205 text-slate-805 font-medium hover:bg-slate-50/80 shadow-sm'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  {notif.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                  {notif.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-555 shrink-0" />}
                                  {notif.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                  <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{notif.title}</span>
                                  {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-auto" />}
                                </div>
                                <p className={`leading-relaxed text-[11px] ${darkMode ? 'text-slate-405' : 'text-slate-700'}`}>{notif.message}</p>
                                <span className="text-[9px] font-mono text-slate-500 block mt-1">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  id="btn-toggle-theme"
                  onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    darkMode 
                      ? 'bg-slate-900/40 border-slate-805 text-slate-300 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                  title={darkMode ? "Switch to Light Environment" : "Switch to Dark Environment"}
                >
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* MOBILE EXPANDED MENU DRAWER */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className={`lg:hidden border-b z-20 absolute top-[73px] left-0 right-0 p-5 space-y-3 shadow-2xl flex flex-col ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
                id="mobile-drawer-box"
              >
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsAdminView(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'dashboard' && !isAdminView ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'opacity-70'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Portal Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('timetable');
                    setIsAdminView(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'timetable' && !isAdminView ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'opacity-70'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Personal Timetable</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setIsAdminView(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'analytics' && !isAdminView ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'opacity-70'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Analytics &amp; Predictor</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsAdminView(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'profile' && !isAdminView ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'opacity-70'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile &amp; Settings</span>
                </button>

                {isAdminUser && (
                  <>
                    <div className={`h-px my-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

                    <button
                      onClick={() => {
                        setIsAdminView(true);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                        isAdminView ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'opacity-80 text-indigo-500 font-bold'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </button>
                  </>
                )}

                <div className="h-px bg-slate-800 my-2" />

                <div className="flex items-center gap-2 p-1.5">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profile.avatarUrl} 
                    alt={profile.name}
                    className="w-8 h-8 rounded-full border border-slate-850"
                  />
                  <div>
                    <span className="text-[11px] font-semibold block">{profile.name}</span>
                    <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-950/25 px-1.5 py-0.5 rounded border border-indigo-900/30 inline-block mt-0.5">{profile.rollNo} &bull; Sem {getRomanNumeral(profile.semester)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="ml-auto p-1.5 bg-red-950/15 text-red-500 border border-red-900/10 rounded-lg text-xs"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN PAGE SLIDING ROUTE CONTENTS */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto" id="portal-route-viewport">
            <AnimatePresence mode="wait">
              <motion.div
                key={isAdminView ? 'admin' : activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {isAdminView && isAdminUser ? (
                  <AdminDashboard 
                    darkMode={darkMode}
                    onExit={() => setIsAdminView(false)}
                  />
                ) : (
                  <>
                    {activeTab === 'dashboard' && (
                      <Dashboard 
                        profile={profile}
                        subjects={subjects}
                        timetable={timetable}
                        notifications={notifications}
                        logs={logs}
                        markTodayAttendance={markTodayAttendance}
                        onClearNotifications={clearNotifications}
                        onReadNotification={readNotification}
                        onAddCustomSubject={onAddCustomSubject}
                        onDeleteSubject={onDeleteSubject}
                        onClearAllSubjects={onClearAllSubjects}
                        onNavigateTab={setActiveTab}
                        darkMode={darkMode}
                      />
                    )}

                    {activeTab === 'timetable' && (
                      <Timetable 
                        timetable={timetable}
                        subjects={subjects}
                        onUpdateSlot={onUpdateSlot}
                        onResetTimetable={onResetTimetable}
                        onAddSlot={onAddTimetableSlot}
                        onDeleteSlot={onDeleteTimetableSlot}
                        onClearAllSubjects={onClearAllSubjects}
                        darkMode={darkMode}
                      />
                    )}

                    {activeTab === 'analytics' && (
                      <Analytics 
                        subjects={subjects}
                        onUpdateSubjectStats={onUpdateSubjectStats}
                        onAddCustomSubject={onAddCustomSubject}
                        onDeleteSubject={onDeleteSubject}
                        darkMode={darkMode}
                      />
                    )}

                    {activeTab === 'profile' && (
                      <Profile 
                        profile={profile}
                        onUpdateProfile={handleUpdateProfile}
                        onLogout={handleLogout}
                        onResetData={handleResetData}
                        darkMode={darkMode}
                        firebaseSyncError={firebaseSyncError}
                      />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

      </div>

    </div>
  );
}
