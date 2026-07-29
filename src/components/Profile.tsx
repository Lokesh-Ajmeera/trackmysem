import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Mail, MapPin, Settings, 
  LogOut, Check, Edit, RefreshCw, Camera, Upload, Trash2,
  AlertTriangle, Copy
} from 'lucide-react';
import { StudentProfile, BranchCode } from '../types';

interface ProfileProps {
  profile: StudentProfile;
  onUpdateProfile: (updatedProfile: StudentProfile) => void;
  onLogout: () => void;
  onResetData: () => void;
  darkMode?: boolean;
  firebaseSyncError?: boolean;
}

export default function Profile({ 
  profile, 
  onUpdateProfile, 
  onLogout, 
  onResetData, 
  darkMode = true,
  firebaseSyncError = false 
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [gpa, setGpa] = useState<number | string>(profile.gpa);
  const [section, setSection] = useState(profile.section || '');
  const [batch, setBatch] = useState(profile.batch || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [rollNo, setRollNo] = useState(profile.rollNo || '');
  const [year, setYear] = useState(profile.year || '');
  const [semester, setSemester] = useState<number>(profile.semester);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [branch, setBranch] = useState<BranchCode>(profile.branch || 'CSE');
  
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [resetConfirm, setResetConfirm] = useState(false);

  // Sync state if profile prop changes
  React.useEffect(() => {
    setName(profile.name);
    setEmail(profile.email || '');
    setGpa(profile.gpa);
    setSection(profile.section || '');
    setBatch(profile.batch || '');
    setPhoneNumber(profile.phoneNumber || '');
    setRollNo(profile.rollNo || '');
    setYear(profile.year || '');
    setSemester(profile.semester);
    setAvatarUrl(profile.avatarUrl || '');
    setBranch(profile.branch || 'CSE');
  }, [profile]);

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      name,
      email,
      gpa: isNaN(Number(gpa)) ? 0 : Number(gpa),
      section,
      batch,
      phoneNumber,
      rollNo,
      year,
      semester: Number(semester),
      avatarUrl,
      branch
    });
    setIsEditing(false);
  };

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
    // Persist immediately on instant update to make it seamless
    onUpdateProfile({
      ...profile,
      name,
      email,
      gpa: isNaN(Number(gpa)) ? 0 : Number(gpa),
      section,
      batch,
      phoneNumber,
      rollNo,
      year,
      semester: Number(semester),
      avatarUrl: url,
      branch
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please upload an image smaller than 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleAvatarSelect(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG/JPEG/WEBP) only!");
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Please upload an image smaller than 1.5 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleAvatarSelect(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="profile-tab">
      
      {/* Profile Header */}
      <div id="profile-header">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-550">
          STUDENT INGRESS PREFERENCES
        </span>
        <h2 className={`text-2xl md:text-3xl font-display font-semibold mt-1 transition-colors ${
          darkMode ? 'text-slate-100' : 'text-slate-850'
        }`}>
          Profile & Preferences
        </h2>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Review credentials, calibrate semester GPAs, and access IIITT administrative links.
        </p>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="profile-body-grid">
        
        {/* Left Card: Avatars & Core metadata info */}
        <div className={`lg:col-span-1 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl relative overflow-hidden border transition-all ${
          darkMode ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800' : 'bg-white border-slate-200 shadow-slate-100/40'
        }`} id="student-avatar-badge-card">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Avatar Container with interactive Camera Overlay */}
          <div 
            id="avatar-frame-container"
            onClick={() => setShowPhotoSelector(!showPhotoSelector)}
            className="group relative w-28 h-28 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl mb-4 cursor-pointer overflow-hidden"
            title="Click to edit profile photo"
          >
            <img 
              referrerPolicy="no-referrer"
              src={avatarUrl} 
              alt={profile.name}
              className={`w-full h-full object-cover rounded-full border-4 transition-all group-hover:scale-105 duration-300 ${
                darkMode ? 'border-[#020617]' : 'border-white'
              }`}
            />
            
            {/* Camera Overlay HUD */}
            <div className="absolute inset-1 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
              <Camera className="w-5 h-5 text-white animate-bounce" />
              <span className="text-[9px] font-semibold tracking-wider font-mono text-white mt-1 uppercase">Change</span>
            </div>

            <span className={`absolute bottom-1 right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-600 border-2 rounded-full flex items-center justify-center shadow-md animate-pulse ${
              darkMode ? 'border-slate-950' : 'border-white'
            }`} title="Active Session Indicator animate-pulse">
              <Check className="w-3 h-3 text-white" />
            </span>
          </div>

          {/* Quick Photo Selector Panel */}
          {showPhotoSelector && (
            <div 
              id="photo-selector-panel"
              className={`w-full rounded-2xl p-4.5 mb-4 border text-left space-y-3.5 transition-all ${
                darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Update Profile Picture
                </span>
                <button 
                  onClick={() => setShowPhotoSelector(false)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Drag and Drop / Manual Trigger File Upload */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('avatar-file-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : darkMode 
                      ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/30' 
                      : 'border-slate-305 hover:border-slate-400 hover:bg-slate-100/50'
                }`}
              >
                <input 
                  type="file"
                  id="avatar-file-input"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                />
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <p className="text-[11px] font-semibold text-slate-400">
                  {dragActive ? "Drop picture here!" : "Drag & Drop or click to upload JPEG/PNG"}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">Max size: 1.5MB (optimized compression)</p>
              </div>
            </div>
          )}

          <span className={`text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full uppercase font-bold mb-2 border transition-all ${
            darkMode ? 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30' : 'text-indigo-700 bg-indigo-50 border-indigo-150'
          }`}>
            B.Tech Candidate
          </span>

          <h3 className={`text-xl font-display font-semibold transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-850'}`}>{profile.name}</h3>
          
          <p className="text-slate-500 text-xs font-mono mt-1">
            Roll: {profile.rollNo}{profile.section ? ` • Section ${profile.section}` : ''}
          </p>

          <div className={`mt-6 w-full border-t pt-5 space-y-3 text-left text-xs ${
            darkMode ? 'border-slate-805/60' : 'border-slate-100'
          }`} id="side-metadata-deck">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">DepartmentBranch</span>
              <span className={`font-semibold ${darkMode ? 'text-slate-205' : 'text-slate-800'}`}>{profile.branch}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Year of Study</span>
              <span className={`font-medium ${darkMode ? 'text-slate-205' : 'text-slate-750'}`}>{profile.year || 'Not Specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Current Semester</span>
              <span className={`font-medium ${darkMode ? 'text-slate-205' : 'text-slate-750'}`}>
                {profile.semester > 0 ? `Semester ${profile.semester}` : 'Not Specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Phone Number</span>
              <span className={`font-mono ${darkMode ? 'text-slate-205' : 'text-slate-650'}`}>{profile.phoneNumber || 'Not Specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Current GPA Grade</span>
              <span className="text-indigo-500 font-mono font-bold">
                {profile.gpa > 0 ? `${profile.gpa.toFixed(2)} CGPA` : 'Not Specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Academic Batch</span>
              <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-650'}`}>{profile.batch || 'Not Specified'}</span>
            </div>
          </div>

          {/* Logout Trigger button */}
          <button 
            id="btn-logout"
            onClick={onLogout}
            className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              darkMode 
                ? 'bg-[#020617]/50 hover:bg-rose-950/20 text-slate-400 hover:text-rose-450 border-slate-800 hover:border-rose-900/25' 
                : 'bg-slate-100/80 hover:bg-rose-50 border-slate-205 hover:border-rose-200 text-slate-650 hover:text-rose-600 shadow-sm'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Portal
          </button>
        </div>

        {/* Right Card: Profile editing form & Preference toggles */}
        <div className={`lg:col-span-2 rounded-3xl p-6 flex flex-col justify-between shadow-xl border transition-all ${
          darkMode ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800' : 'bg-white border-slate-200 shadow-slate-100/40'
        }`} id="profile-management-card">
          <div className="space-y-5">
            <div className={`flex items-center justify-between border-b pb-3 ${
              darkMode ? 'border-slate-800/60' : 'border-slate-100'
            }`} id="profile-edit-header">
              <h3 className={`font-display font-semibold text-base flex items-center gap-2 ${
                darkMode ? 'text-slate-200' : 'text-slate-850'
              }`}>
                <Settings className="w-4.5 h-4.5 text-indigo-500" />
                Preferences
              </h3>
              
              {!isEditing ? (
                <button
                  id="btn-trigger-edit-profile"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-750 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile Fields
                </button>
              ) : (
                <button
                  id="btn-trigger-save-profile"
                  onClick={handleSave}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Submit Changes
                </button>
              )}
            </div>

            {/* Editable Profile Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="editable-fields-grid">
              
              <div>
                <label htmlFor="edit-name" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Full Student Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={name}
                  disabled={!isEditing}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="edit-email" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Academic Email Id (College Mail)
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={email}
                  disabled={!isEditing}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed font-mono transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="edit-rollno" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Roll Number (ID)
                </label>
                <input
                  type="text"
                  id="edit-rollno"
                  value={rollNo}
                  disabled={!isEditing}
                  onChange={(e) => setRollNo(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed font-mono transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Phone Number
                </label>
                <input
                  type="text"
                  id="edit-phone"
                  value={phoneNumber}
                  disabled={!isEditing}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed font-mono transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="edit-year" className={`text-[11px] font-mono uppercase block mb-1 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Year of Study
                  </label>
                  <select
                    id="edit-year"
                    value={year}
                    disabled={!isEditing}
                    onChange={(e) => setYear(e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all ${
                      darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                    }`}
                  >
                    <option value="">Not Specified</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-semester" className={`text-[11px] font-mono uppercase block mb-1 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Current Sem
                  </label>
                  <select
                    id="edit-semester"
                    value={semester}
                    disabled={!isEditing}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all ${
                      darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                    }`}
                  >
                    <option value={0}>Not Specified</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="edit-section" className={`text-[11px] font-mono uppercase block mb-1 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Section
                  </label>
                  <input
                    type="text"
                    id="edit-section"
                    value={section}
                    disabled={!isEditing}
                    onChange={(e) => setSection(e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all ${
                      darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="edit-batch" className={`text-[11px] font-mono uppercase block mb-1 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Year Batch
                  </label>
                  <input
                    type="text"
                    id="edit-batch"
                    value={batch}
                    disabled={!isEditing}
                    onChange={(e) => setBatch(e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed font-mono transition-all ${
                      darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-gpa" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Cumulative GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  id="edit-gpa"
                  value={gpa}
                  disabled={!isEditing}
                  onChange={(e) => setGpa(parseFloat(e.target.value) || 0)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed font-mono transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="edit-branch" className={`text-[11px] font-mono uppercase block mb-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Discipline / Academic Branch
                </label>
                <select
                  id="edit-branch"
                  value={branch}
                  disabled={!isEditing}
                  onChange={(e) => setBranch(e.target.value as BranchCode)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all ${
                    darkMode ? 'bg-[#020617]/95 border-slate-800 text-slate-250 font-medium' : 'bg-white border-slate-200 text-slate-850 font-medium shadow-xs'
                  }`}
                >
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="CSE AI & DS">CSE AI & DS (AI & Data Science)</option>
                  <option value="ECE">ECE (Electronics & Communication)</option>
                  <option value="ECE VLSI">ECE VLSI (VLSI Design Systems)</option>
                </select>
              </div>

            </div>

            {firebaseSyncError && (
              <div 
                id="firestore-permissions-advisory-card" 
                className={`p-5 rounded-2xl border text-xs space-y-4 animate-fade-in transition-all ${
                  darkMode 
                    ? 'bg-slate-950/90 border-amber-500/35 text-slate-300 shadow-2xl shadow-indigo-950/20' 
                    : 'bg-amber-50/75 border-amber-300 text-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className={`font-display font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      Firestore Write Blocked (Rules Restriction)
                    </h4>
                    <p className={`text-[11px] mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      The portal failed to sync records with cloud Firestore because the project security rules are configured in locked mode or rejecting write accesses.
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl p-3 border space-y-2.5 ${
                  darkMode ? 'bg-[#020617] border-slate-800' : 'bg-white border-amber-200'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Copy Secure Security Rule:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{uid} {\n      allow read, write: if request.auth != null && request.auth.uid == uid;\n    }\n  }\n}`;
                        navigator.clipboard.writeText(rulesText);
                        alert("Firestore Security Rules copied! Paste them in the Rules tab of your Firebase Database Console.");
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-all select-none"
                    >
                      Copy Firestore Rules
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <pre className="font-mono text-[10px] text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto whitespace-pre leading-relaxed font-semibold">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}`}
                  </pre>
                </div>

                <div className={`space-y-1.5 text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
                  <p className="font-bold text-slate-200">Deploy in 3 simple steps:</p>
                  <ol className="list-decimal pl-4.5 space-y-1">
                    <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 font-semibold hover:underline">Firebase Console</a> and open your configured project.</li>
                    <li>Click <strong className={`${darkMode ? 'text-slate-205' : 'text-slate-800'}`}>Firestore Database</strong> in the build menu &gt; click the <strong className={`${darkMode ? 'text-slate-205' : 'text-slate-800'}`}>Rules</strong> tab at the top.</li>
                    <li>Clear the default text, paste the copied secure rules, and click <strong className={`${darkMode ? 'text-slate-205' : 'text-slate-800'}`}>Publish</strong>.</li>
                  </ol>
                  <p className="mt-2 text-[10px] italic">While unauthorized, all student metrics are still fully preserved offline secure in local browser storage memory.</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
