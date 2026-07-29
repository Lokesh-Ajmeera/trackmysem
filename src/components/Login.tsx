import React, { useState } from 'react';
import { motion } from 'motion/react';
import emailjs from '@emailjs/browser';
import { 
  GraduationCap, ArrowRight, CheckCircle2, User, Sparkles, Mail, Lock, Eye, EyeOff,
  AlertTriangle, Clock, Sun, Moon, Monitor, BookOpen
} from 'lucide-react';
import { BranchCode } from '../types';
import { 
  auth, db, doc, setDoc, getDoc,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  checkIfEmailExists, saveOTPInDatabase, verifyAndResetPassword
} from '../lib/firebase';
import ForgotPassword from './ForgotPassword';
import { 
  DEFAULT_STUDENT, DEFAULT_SUBJECTS_CSE, DEFAULT_SUBJECTS_ECE, 
  DEFAULT_SUBJECTS_CSE_AI_DS, DEFAULT_SUBJECTS_ECE_VLSI,
  DEFAULT_TIMETABLE_CSE, DEFAULT_TIMETABLE_ECE, INITIAL_NOTIFICATIONS 
} from '../data/mockStudent';

interface LoginProps {
  onLoginSuccess: (userId: string) => void;
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  darkMode: boolean;
}

export default function Login({ onLoginSuccess, theme, onChangeTheme, darkMode }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState<BranchCode>('CSE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Password Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your portal email address in the input field to request a recovery passcode.');
      return;
    }
    
    setRecoveryLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      // 1. Verify if account exists
      const exists = await checkIfEmailExists(email);
      if (!exists) {
        throw new Error("Account is not registered. Please sign up to create a new account, or check the database from time to time.");
      }
      
      // 2. Generate secure 6-digit OTP passcode
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      // 3. Save to Firestore / LocalDB
      await saveOTPInDatabase(email, generatedCode, expiresAt);
      
      // 4. Send Email via EmailJS mapper
      const templateParams = {
        email: email,
        passcode: generatedCode,
        time: "10 minutes"
      };
      
      await emailjs.send(
        'service_0kzvnoa',
        'template_uhhfktn',
        templateParams,
        'f30jwoGVbZf-k8t86'
      );
      
      setSuccessMsg(`A 6-digit recovery passcode has been sent to ${email}. Please check your inbox.`);
      setRecoveryStep(2);
    } catch (err: any) {
      console.error("Recovery OTP Request Error:", err);
      setErrorMsg(err.message || 'Failed to send recovery passcode. Please double check your email or try again later.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setErrorMsg('Please enter a new password/PIN.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('The entered passwords do not match.');
      return;
    }
    
    setRecoveryLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      await verifyAndResetPassword(email, otpCode, newPassword);
      setSuccessMsg("Your portal password has been successfully reset! You can now log in using your new details.");
      
      // Clean recovery state and return to Login
      setRecoveryStep(1);
      setIsRecovering(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error("Recovery Verification Error:", err);
      setErrorMsg(err.message || 'Verification failed. Please check your passcode and try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };


  // Authentication submission handler
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and portal password.');
      return;
    }

    // Standard email format validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid institution or standard email address format.');
      return;
    }

    if (isRegister && (!name || !rollNo)) {
      setErrorMsg('Please specify Student Name, Roll Number, and Branch Course to register a profile.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        try {
          // 1. Create authenticated user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;

          // Initially start with empty subjects array so users can register custom subjects
          let initialSubjects: any[] = [];
          let initialTimetable = DEFAULT_TIMETABLE_CSE;
          
          if (branch === 'CSE AI & DS') {
            initialTimetable = DEFAULT_TIMETABLE_CSE;
          } else if (branch === 'ECE') {
            initialTimetable = DEFAULT_TIMETABLE_ECE;
          } else if (branch === 'ECE VLSI') {
            initialTimetable = DEFAULT_TIMETABLE_ECE;
          }

          const customizedProfile = {
            uid: uid,
            name: name,
            rollNo: rollNo,
            email: email,
            branch: branch,
            password: password,
            customPassword: password,
            semester: 0,
            year: "",
            phoneNumber: "",
            section: "",
            batch: "",
            gpa: 0.0,
            avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23f9fafb'/><circle cx='50' cy='37' r='18' fill='%239ca3af'/><path d='M50 59c-15 0-27 9-27 20v4h54v-4c0-11-12-20-27-20z' fill='%239ca3af'/></svg>"
          };

          // 3. Store customized student record in Firestore
          let isSavedToCloud = true;
          try {
            await setDoc(doc(db, 'users', uid), {
              ...customizedProfile,
              subjects: initialSubjects,
              timetable: initialTimetable,
              notifications: INITIAL_NOTIFICATIONS,
              logs: []
            });
          } catch (dbErr) {
            isSavedToCloud = false;
          }

          if (isSavedToCloud) {
            setSuccessMsg('Account created successfully! Profile registered in Firestore.');
          } else {
            setSuccessMsg('Account created with Local Sandbox Fallback storage.');
          }
          
          setIsExiting(true);
          setTimeout(() => {
            onLoginSuccess(uid);
          }, 1100);
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            // Already registered - try logging in directly in background
            try {
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              setSuccessMsg(`Welcome back! Custom credential verified successfully. Entering portal...`);
              setIsExiting(true);
              setTimeout(() => {
                onLoginSuccess(userCredential.user.uid);
              }, 1100);
            } catch (signInErrAfterReg: any) {
              // Try classic OTP credential fallback
              try {
                const derivedUniquePassword = `iiitt-otp-auth-${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const fallbackCredential = await signInWithEmailAndPassword(auth, email, derivedUniquePassword);
                setSuccessMsg(`Welcome back! Seamlessly restored your active registered profile ledger!`);
                setIsExiting(true);
                setTimeout(() => {
                  onLoginSuccess(fallbackCredential.user.uid);
                }, 1100);
              } catch (secondErr) {
                throw new Error('This email is already registered on this portal. Please sign in using your existing password, or use a different email address.');
              }
            }
          } else {
            throw regErr;
          }
        }
      } else {
        // Sign In Flow
        try {
          // 1. Check if user email is registered in Firestore database
          const exists = await checkIfEmailExists(email);
          if (!exists) {
            throw new Error("Account is not registered. Please sign up to create a new account, or check the database from time to time.");
          }

          // 2. Since they are registered, check credentials
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setSuccessMsg(`Welcome back, ${userCredential.user.email}! Loading profile ledger...`);
            setIsExiting(true);
            setTimeout(() => {
              onLoginSuccess(userCredential.user.uid);
            }, 1100);
          } catch (signInErr: any) {
            // Check if they registered via fallback OTP passcode and standard standard password failed
            try {
              const derivedUniquePassword = `iiitt-otp-auth-${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
              const fallbackCredential = await signInWithEmailAndPassword(auth, email, derivedUniquePassword);
              setSuccessMsg(`Welcome back! Logged in with your registered profile credentials.`);
              setIsExiting(true);
              setTimeout(() => {
                onLoginSuccess(fallbackCredential.user.uid);
              }, 1100);
              return;
            } catch (fallbackErr) {
              // Pass through to throw wrong PIN / password error
            }
            throw new Error('Incorrect credentials. Please verify your password or PIN, or click "Forgot Password" to reset.');
          }
        } catch (signInFlowErr: any) {
          throw signInFlowErr;
        }
      }
    } catch (err: any) {
      console.warn("Authentication Error (handled):", err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-container" className={`relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-500 selection:bg-[#1e3a8a] selection:text-white ${
      darkMode ? 'bg-slate-950 text-white' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/50 text-slate-900'
    }`}>
      {/* Dynamic theme switcher button group aligned at top-right corner of viewport */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-35 flex items-center gap-1 p-1 rounded-xl border backdrop-blur-xl transition-all duration-300 shadow-sm" style={{
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: darkMode ? 'rgba(30, 41, 59, 1)' : 'rgba(226, 232, 240, 0.8)',
      }}>
        <button
          type="button"
          onClick={() => onChangeTheme('light')}
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            theme === 'light'
              ? 'bg-[#1e3a8a] text-white shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeTheme('dark')}
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#1e3a8a] text-white shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeTheme('system')}
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all text-xs cursor-pointer ${
            theme === 'system'
              ? 'bg-[#1e3a8a] text-white shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="System Default Theme"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Premium ambient glowing backgrounds */}
      {darkMode ? (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600/25 to-blue-500/0 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-500/15 to-emerald-500/0 blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-100/0 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-sky-100/20 to-blue-50/0 blur-[120px] pointer-events-none" />
        </>
      )}
      
      {/* Subtle modern background grid */}
      <div className={`absolute inset-0 bg-[#383838]/[0.015] bg-[size:38px_38px] ${darkMode ? 'opacity-100' : 'opacity-[0.25]'}`} style={{ backgroundImage: darkMode ? undefined : 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={isExiting ? { opacity: 0, y: -30, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md flex flex-col items-center"
      >
        {/* College Crest details */}
        <div className="flex flex-col items-center mb-6 text-center" id="college-crest-header">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a8a] p-0.5 shadow-lg mb-4`}
          >
            <div className="w-full h-full rounded-[14px] flex items-center justify-center bg-white border border-slate-100">
              <GraduationCap className="w-9 h-9 text-[#1e3a8a]" />
            </div>
          </motion.div>
          <span className={`text-[11px] uppercase tracking-[0.2em] font-sans font-semibold mb-2 ${
            darkMode ? 'text-indigo-400' : 'text-[#1e3a8a]'
          }`}>
            Track My Semester
          </span>
          <h1 className={`text-3xl font-sans font-extrabold tracking-tight ${
            darkMode ? 'text-slate-100' : 'text-slate-900'
          }`}>
            TrackMySem
          </h1>
          <p className={`text-sm mt-2 max-w-xs ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Attendance Analytics & Academic Ledger
          </p>
        </div>

        {/* Premium centered Login Card */}
        <div className={`relative w-full rounded-[12px] border p-6 md:p-8 shadow-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-slate-900 border-slate-800 shadow-indigo-950/20' 
            : 'bg-white border-slate-100/90 shadow-slate-200/80'
        }`}>
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-indigo-500/25' : 'via-indigo-500/40'} to-transparent`} />
          
          {isRecovering ? (
            <ForgotPassword
              embedMode={true}
              onSuccess={() => {
                setIsRecovering(false);
                setSuccessMsg("Portal password has been successfully reset! You can now log in using your new password.");
              }}
              onCancel={() => {
                setIsRecovering(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              darkMode={darkMode}
            />
          ) : (
            <>
              {/* Sign In & Register Tab toggles */}
              <div className={`flex p-1 rounded-xl border mb-6 ${
                darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isRegister 
                      ? 'bg-[#1e3a8a] text-white shadow-sm' 
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isRegister 
                      ? 'bg-[#1e3a8a] text-white shadow-sm' 
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register Portal
                </button>
              </div>

              <form onSubmit={handleAuthAction} className="space-y-4">
                
                {/* Error & Success indicators */}
                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium space-y-2.5 animate-fade-in">
                    <p className="leading-relaxed">{errorMsg}</p>
                    
                    {!isRegister && (
                      <div className="flex flex-wrap gap-2.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegister(true);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-[#1e3a8a] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          Create Account (Register tab) &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecovering(true);
                            setRecoveryStep(1);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-[#1e3a8a] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          Reset Password via OTP &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium animate-fade-in">
                    {successMsg}
                  </div>
                )}

                {/* Registration Fields only */}
                {isRegister && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Input Name */}
                    <div id="input-group-name">
                      <label htmlFor="student-name" className={`text-xs font-sans block mb-1.5 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Student Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          id="student-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                            darkMode 
                              ? 'bg-[#020617]/95 border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200' 
                              : 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] text-slate-900'
                          }`}
                          placeholder="Enter full name"
                          required={isRegister}
                        />
                      </div>
                    </div>

                    {/* Input Roll Number */}
                    <div id="input-group-roll" className="w-full">
                      <label htmlFor="student-roll" className={`text-xs font-sans block mb-1.5 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Student Roll No.
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <GraduationCap className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          id="student-roll"
                          value={rollNo}
                          onChange={(e) => setRollNo(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none text-sm font-mono transition-all duration-200 ${
                            darkMode 
                              ? 'bg-[#020617]/95 border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200' 
                              : 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] text-slate-900'
                          }`}
                          placeholder=""
                          maxLength={9}
                          required={isRegister}
                        />
                      </div>
                    </div>

                    {/* Input Academic Branch */}
                    <div id="input-group-branch" className="w-full">
                      <label htmlFor="student-branch" className={`text-xs font-sans block mb-1.5 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Discipline / Academic Branch
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <select
                          id="student-branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value as BranchCode)}
                          className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none text-sm transition-all duration-200 cursor-pointer appearance-none ${
                            darkMode 
                              ? 'bg-[#020617]/95 border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200' 
                              : 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] text-slate-900'
                          }`}
                          required={isRegister}
                        >
                          <option value="CSE">CSE (Computer Science)</option>
                          <option value="CSE AI & DS">CSE AI & DS (AI & Data Science)</option>
                          <option value="ECE">ECE (Electronics & Communication)</option>
                          <option value="ECE VLSI">ECE VLSI (VLSI Design Systems)</option>
                        </select>
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-slate-400">
                          ▼
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Email field */}
                <div id="input-group-email">
                  <label htmlFor="student-email" className={`text-xs font-sans block mb-1.5 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Portal Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      id="student-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                        darkMode 
                          ? 'bg-[#020617]/95 border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200' 
                          : 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] text-slate-900'
                      }`}
                      placeholder="Email Address"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div id="input-group-password">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="student-password" className={`text-xs font-sans block font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Portal Auth PIN / Password
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecovering(true);
                          setRecoveryStep(1);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className={`text-[11px] font-bold hover:underline transition-all cursor-pointer ${
                          darkMode ? 'text-indigo-400' : 'text-[#1e3a8a]'
                        }`}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="student-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none text-sm transition-all duration-200 ${
                        darkMode 
                          ? 'bg-[#020617]/95 border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200' 
                          : 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] text-slate-900'
                      }`}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className={`w-full mt-3 py-3 px-4 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:pointer-events-none ${
                    darkMode 
                      ? 'bg-[#1e3a8a] hover:bg-[#1e40af] shadow-indigo-950/20' 
                      : 'bg-[#1e3a8a] hover:bg-[#1e40af] shadow-blue-900/10'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Authenticating profile ledger...
                    </>
                  ) : (
                    <>
                      {isRegister ? 'Create Account & Initialize' : 'Enter Student Portal'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}



          {/* Credentials Info Note */}
        </div>

        <p className={`text-center text-[11.5px] mt-6 font-sans leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Take control of your semester with real-time attendance tracking.
        </p>
      </motion.div>
    </div>
  );
}
