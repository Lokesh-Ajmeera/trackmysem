import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Clock, ArrowRight, ArrowLeft, GraduationCap, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { db, verifyAndResetPassword } from '../lib/firebase';
import { doc, setDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { sendOTP, verifyOTP } from '../lib/otpService';

interface ForgotPasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  darkMode?: boolean;
  embedMode?: boolean;
}

export default function ForgotPassword({ onSuccess, onCancel, darkMode = true, embedMode = false }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // STEP 1: Request 6-digit OTP passcode
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your portal email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Verify if the email belongs to a student profile first
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("No student profile found for this email address. Please make sure you are registered.");
      }

      // 2. Trigger otpService to generate, save, and email the passcode
      await sendOTP(email);
      
      setSuccessMsg(`A 6-digit verification code has been dispatched to ${email}. Please check your inbox.`);
      setStep(2);
      setOtpVerified(false);
    } catch (err: any) {
      console.error("OTP send error:", err);
      setErrorMsg(err.message || 'Failed to trigger verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2A: Verify only the 6-digit OTP passcode first
  const handleVerifyOTP = async (e: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit passcode.');
      return;
    }

    setLoading(true);

    try {
      await verifyOTP(email, otpCode);
      setOtpVerified(true);
      setSuccessMsg("✓ Verification code is correct! Please define your new secure password below.");
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setErrorMsg(err.message || 'The entered verification code is incorrect or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2B: Update student's password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpVerified) {
      // If student hasn't verified OTP yet, verify OTP first
      await handleVerifyOTP(e);
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter a new portal password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Your new password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Call standard function which resets passwords in both systems (Firestore and Firebase Auth)
      await verifyAndResetPassword(email, otpCode, newPassword);

      setSuccessMsg("Your portal password has been successfully updated! You can now sign in using your new password.");
      
      // Delay to let the student read the confirmation, then redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (onCancel) {
          onCancel();
        }
      }, 3500);

    } catch (err: any) {
      console.error("Verification and reset error:", err);
      setErrorMsg(err.message || 'OTP verification and reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (embedMode) {
    return (
      <div className="space-y-4 animate-fade-in w-full text-left" id="forgot-password-embedded">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-650'}`}>
            {step === 1 ? 'Step 1: Check Ledger' : 'Step 2: Authenticate Code'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850'} transition-all cursor-pointer underline font-medium`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        </div>

        {/* Messaging Feedback bars */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-950/45 border border-red-500/35 text-red-200 rounded-xl text-xs font-medium animate-fade-in leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-medium animate-fade-in leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          /* SECTION 1: REQUEST OTP */
          <form onSubmit={handleRequestOTP} className="space-y-4" id="request-otp-form">
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Provide your official student email. Our automation will search your profile ledger, generate a secure 6-digit recovery code and dispatch it straight to your email.
            </p>

            <div id="email-field-group">
              <label htmlFor="recovery-email" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                enter mail id
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="recovery-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                    darkMode 
                      ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                  }`}
                  placeholder=""
                  required
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Interrogating profile database...
                </>
              ) : (
                <>
                  Verify Ledger & Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          /* SECTION 2: VERIFY AND RESET */
          <form onSubmit={handleVerifyAndReset} className="space-y-4" id="verify-reset-form">
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
              {!otpVerified 
                ? 'Please input the 6-digit security code received in your student inbox to verify your device identity.'
                : 'Your security code is verified! Please enter your new secure portal password.'}
            </p>

            <div id="otp-code-field-group">
              <label htmlFor="otp-passcode" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {otpVerified ? '✓ 6-Digit Code Verified' : '6-Digit Security Code'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="otp-passcode"
                  disabled={otpVerified}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-center font-mono text-lg tracking-widest transition-colors ${
                    darkMode 
                      ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-indigo-400 font-bold' 
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-indigo-600 font-bold'
                  } ${otpVerified ? 'opacity-65 cursor-not-allowed border-emerald-500/50' : ''}`}
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {otpVerified && (
              <>
                <div id="new-password-field-group" className="animate-fade-in">
                  <label htmlFor="recovery-new-password" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    New Portal Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="recovery-new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                        darkMode 
                          ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                      placeholder="Min 6 characters/digits"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div id="confirm-password-field-group" className="animate-fade-in">
                  <label htmlFor="recovery-confirm-password" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                    Re-type New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="recovery-confirm-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                        darkMode 
                          ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                      placeholder="Verify new password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {!otpVerified ? 'Checking Code...' : 'Updating secure credential registry...'}
                </>
              ) : (
                <>
                  {!otpVerified ? 'Verify Security OTP' : 'Update Password & Return to Login'}
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto" id="forgot-password-screen">
      {/* College Crest details */}
      <div className="flex flex-col items-center mb-6 text-center" id="college-crest-header">
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 p-0.5 shadow-xl mb-4 ${
            darkMode ? 'shadow-indigo-500/15' : 'shadow-indigo-500/5'
          }`}
        >
          <div className={`w-full h-full rounded-[14px] flex items-center justify-center border ${
            darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
          }`}>
            <GraduationCap className={`w-7 h-7 ${darkMode ? 'text-indigo-400' : 'text-indigo-650'}`} />
          </div>
        </motion.div>
        <span className={`text-[9px] uppercase tracking-[0.25em] font-mono font-bold mb-1 ${
          darkMode ? 'text-indigo-400' : 'text-indigo-650'
        }`}>
          IIIT Tiruchirappalli
        </span>
        <h1 className={`text-xl font-display font-bold tracking-tight ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Recover Password
        </h1>
        <p className={`text-xs mt-1.5 max-w-xs ${
          darkMode ? 'text-slate-400' : 'text-slate-650'
        }`}>
          Portal Access Recovery Engine
        </p>
      </div>

      {/* Glass card form */}
      <div className={`relative rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800 shadow-indigo-950/20' 
          : 'bg-white border-slate-200/80 shadow-slate-200/60'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-indigo-500/25' : 'via-indigo-500/40'} to-transparent`} />
        
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-650'}`}>
            {step === 1 ? 'Step 1: Check Ledger' : 'Step 2: Authenticate Code'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850'} transition-all cursor-pointer underline font-medium`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        </div>

        {/* Messaging Feedback bars */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-950/45 border border-red-500/35 text-red-200 rounded-xl text-xs font-medium animate-fade-in leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-medium animate-fade-in leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          /* SECTION 1: REQUEST OTP */
          <form onSubmit={handleRequestOTP} className="space-y-4" id="request-otp-form">
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Provide your official institute student email. Our automation will search your profile ledger, generate a secure 6-digit recovery code and dispatch it straight to your email.
            </p>

            <div id="email-field-group">
              <label htmlFor="recovery-email" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                enter mail id
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="recovery-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                    darkMode 
                      ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                  }`}
                  placeholder=""
                  required
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Interrogating profile database...
                </>
              ) : (
                <>
                  Verify Ledger & Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          /* SECTION 2: VERIFY AND RESET */
          <form onSubmit={handleVerifyAndReset} className="space-y-4" id="verify-reset-form">
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
              {!otpVerified 
                ? 'Please input the 6-digit security code received in your student inbox to verify your device identity.'
                : 'Your security code is verified! Please enter your new secure portal password.'}
            </p>

            <div id="otp-code-field-group">
              <label htmlFor="otp-passcode" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {otpVerified ? '✓ 6-Digit Code Verified' : '6-Digit Security Code'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="otp-passcode"
                  disabled={otpVerified}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-center font-mono text-lg tracking-widest transition-colors ${
                    darkMode 
                      ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-indigo-400 font-bold' 
                      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-indigo-600 font-bold'
                  } ${otpVerified ? 'opacity-65 cursor-not-allowed border-emerald-500/50' : ''}`}
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {otpVerified && (
              <>
                <div id="new-password-field-group" className="animate-fade-in">
                  <label htmlFor="recovery-new-password" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    New Portal Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="recovery-new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                        darkMode 
                          ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                      placeholder="Min 6 characters/digits"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div id="confirm-password-field-group" className="animate-fade-in">
                  <label htmlFor="recovery-confirm-password" className={`text-xs font-mono block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                    Re-type New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="recovery-confirm-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors ${
                        darkMode 
                          ? 'bg-[#030712]/90 border-slate-800 focus:border-indigo-500 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                      placeholder="Verify new password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {!otpVerified ? 'Checking Code...' : 'Updating secure credential registry...'}
                </>
              ) : (
                <>
                  {!otpVerified ? 'Verify Security OTP' : 'Update Password & Return to Login'}
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}
