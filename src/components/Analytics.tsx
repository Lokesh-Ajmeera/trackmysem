import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, TrendingUp, Sparkles, CheckCircle2, AlertOctagon, 
  ChevronRight, RefreshCw, Layers, Edit, Filter, Plus, Clock, Trash2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Subject } from '../types';

interface AnalyticsProps {
  subjects: Subject[];
  onUpdateSubjectStats: (subjectId: string, attended: number, total: number) => void;
  onAddCustomSubject: (code: string, name: string, professor: string, credits: number) => void;
  onDeleteSubject: (subjectId: string) => void;
  darkMode?: boolean;
}

export default function Analytics({ subjects, onUpdateSubjectStats, onAddCustomSubject, onDeleteSubject, darkMode = true }: AnalyticsProps) {
  const [chartMounted, setChartMounted] = useState(false);
  React.useEffect(() => {
    setChartMounted(true);
  }, []);

  // Predictor state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [simUpcomingAttend, setSimUpcomingAttend] = useState<number>(3);
  const [simUpcomingMiss, setSimUpcomingMiss] = useState<number>(0);

  // New subject form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newProf, setNewProf] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Automatically select the first subject once subjects are added or if selected subject becomes unavailable
  React.useEffect(() => {
    if (subjects.length > 0) {
      if (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [subjects, selectedSubjectId]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // Live simulation computations
  const currentAttended = selectedSubject ? selectedSubject.attended : 0;
  const currentTotal = selectedSubject ? selectedSubject.total : 0;
  const currentPercent = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;

  const simAttended = currentAttended + simUpcomingAttend;
  const simTotal = currentTotal + simUpcomingAttend + simUpcomingMiss;
  const simPercent = simTotal > 0 ? (simAttended / simTotal) * 100 : 0;

  // Calculators
  // Classes to attend to reach 75%
  let straightClassesTo75 = 0;
  if (currentPercent < 75 && currentTotal > 0) {
    // Math: (attended + X) / (total + X) = 0.75
    // attended + X = 0.75 * total + 0.75 * X
    // X - 0.75 * X = 0.75 * total - attended
    // 0.25 * X = 0.75 * total - attended
    // X = (0.75 * total - attended) / 0.25
    // X = 3 * total - 4 * attended
    straightClassesTo75 = Math.ceil((0.75 * currentTotal - currentAttended) / 0.25);
    if (straightClassesTo75 < 0) straightClassesTo75 = 0;
  }

  // Maximum classes they can skip while maintaining >= 75%
  let skipSafelyCount = 0;
  if (currentPercent >= 75 && currentTotal > 0) {
    // Math: attended / (total + Y) = 0.75
    // attended = 0.75 * total + 0.75 * Y
    // 0.75 * Y = attended - 0.75 * total
    // Y = (attended - 0.75 * total) / 0.75
    // Y = (4/3) * attended - total
    skipSafelyCount = Math.floor((currentAttended / 0.75) - currentTotal);
    if (skipSafelyCount < 0) skipSafelyCount = 0;
  }

  const handleManualStatUpdate = (subjectId: string, diffAttended: number, diffTotal: number) => {
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const nextAttended = Math.max(0, sub.attended + diffAttended);
    // Total should not be less than attended
    const nextTotal = Math.max(nextAttended, sub.total + diffTotal);
    onUpdateSubjectStats(subjectId, nextAttended, nextTotal);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newProf) return;
    onAddCustomSubject(newCode, newName, newProf, newCredits);
    // Reset
    setNewCode('');
    setNewName('');
    setNewProf('');
    setNewCredits(3);
    setShowAddForm(false);
  };

  // Recharts Radar balance data
  const radarData = subjects.map(s => {
    const pct = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
    return {
      subject: s.code,
      attendance: pct,
      fullMark: 100
    };
  });

  return (
    <div className="space-y-6" id="analytics-tab">
      
      {/* Analytics Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="analytics-header">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500">
            Attendance Simulation Cabin
          </span>
          <h2 className={`text-2xl md:text-3xl font-display font-semibold mt-1 transition-colors ${
            darkMode ? 'text-slate-100' : 'text-slate-850'
          }`}>
            Analytics & Predictions
          </h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Test skip-thresholds, calculate future logs, and view multi-subject balance.
          </p>
        </div>

        <button 
          id="btn-trigger-add-subject"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Course Subject
        </button>
      </div>

      {/* Add Custom Subject Drawer Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.98, height: 0 }}
            transition={{ duration: 0.3 }}
            id="add-subject-panel"
            className={`rounded-3xl p-5 md:p-6 overflow-hidden relative shadow-2xl border transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}
          >
            <h3 className="text-sm font-mono font-bold uppercase text-indigo-550 mb-3">
              Add New Course Subject
            </h3>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Subject Code</label>
                <input 
                  type="text" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. CS308"
                  className={`border text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-550 font-mono transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Subject Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-550 transition-all ${
                    darkMode ? 'bg-slate-100/5 bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Faculty Professor</label>
                <input 
                  type="text" 
                  value={newProf}
                  onChange={(e) => setNewProf(e.target.value)}
                  placeholder="e.g. Dr. K. Radhika"
                  className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-550 transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                  required
                />
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Credits</label>
                  <select 
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className={`border text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-510 font-mono transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  >
                    <option value={1}>1 Credit</option>
                    <option value={2}>2 Credits</option>
                    <option value={3}>3 Credits</option>
                    <option value={4}>4 Credits</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 shadow-md"
                  >
                    Create
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer border transition-all ${
                      darkMode 
                        ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analytics-core-layout">
        
        {/* Column Left: Interactive Predictor Tool */}
        <div className={`lg:col-span-7 rounded-3xl p-6 flex flex-col justify-between shadow-xl border transition-all ${
          darkMode ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/80' : 'bg-white border-slate-200 shadow-slate-100/40'
        }`} id="predictive-sandbox-card">
          <div className="space-y-4">
            <div className={`flex items-center gap-3 border-b pb-3 ${darkMode ? 'border-slate-800/60' : 'border-slate-100'}`} id="predictor-title-header">
              <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-indigo-500/10 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'}`}>
                <Calculator className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className={`text-base font-display font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-850'}`}>
                  Eligibility Simulation Cabin
                </h3>
                <p className="text-slate-500 text-xs">Run predictive skip/attend simulations for any course subject</p>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-12 px-4 flex flex-col items-center justify-center gap-3">
                <div className={`p-3 rounded-full border ${darkMode ? 'bg-indigo-950/40 border-indigo-550/10 text-indigo-400' : 'bg-indigo-50 border-indigo-120 text-indigo-600'}`}>
                  <Calculator className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className={`font-display font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>No Registered Courses to Simulate</h4>
                <p className="text-slate-500 text-xs max-w-sm">Please register a custom course first using the "+ Add Subject" or "Add Course Subject" button to unlock active simulation tools.</p>
              </div>
            ) : (
              <>
                {/* Subject Selector for Simulating */}
                <div className="space-y-1" id="selector-sim-subject">
                  <label htmlFor="sim-subject-select" className={`text-xs font-mono block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Choose Subject to Analyze
                  </label>
                  <select
                    id="sim-subject-select"
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSimUpcomingAttend(3); // Reset values
                      setSimUpcomingMiss(0);
                    }}
                    className={`w-full text-sm p-3 rounded-xl border focus:outline-none transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-800 shadow-sm focus:border-indigo-600'
                    }`}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name} ({s.total > 0 ? ((s.attended / s.total)*100).toFixed(0) : 0}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simulated sliders / counters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" id="sliders-container">
                  
                  <div className={`p-3 rounded-2xl border transition-all ${
                    darkMode ? 'bg-slate-950/45 border-slate-850/60' : 'bg-slate-50 border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Classes to Attend</span>
                      <span className="text-xs font-mono font-bold text-indigo-500">+{simUpcomingAttend} Classes</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simUpcomingAttend}
                      onChange={(e) => setSimUpcomingAttend(parseInt(e.target.value))}
                      className={`w-full h-1.5 rounded-lg cursor-pointer transition-all ${
                        darkMode ? 'accent-indigo-550 bg-slate-850' : 'accent-indigo-600 bg-slate-200'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">Hypothesize attending successive lectures</span>
                  </div>

                  <div className={`p-3 rounded-2xl border transition-all ${
                    darkMode ? 'bg-slate-950/45 border-slate-850/60' : 'bg-slate-50 border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Classes to Skip / Miss</span>
                      <span className="text-xs font-mono font-bold text-rose-500">-{simUpcomingMiss} Classes</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={simUpcomingMiss}
                      onChange={(e) => setSimUpcomingMiss(parseInt(e.target.value))}
                      className={`w-full h-1.5 rounded-lg cursor-pointer transition-all ${
                        darkMode ? 'accent-indigo-550 bg-slate-850' : 'accent-indigo-600 bg-slate-200'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">Hypothesize skipping/missing lectures</span>
                  </div>

                </div>

                {/* Dynamic Recalculated Feedback Panel */}
                {selectedSubject && (
                  <div className={`p-4 rounded-2xl space-y-3 mt-4 border transition-all ${
                    darkMode ? 'bg-indigo-950/15 border-indigo-900/35' : 'bg-indigo-50/60 border-indigo-100/80 shadow-xs'
                  }`} id="simulation-output-display">
                    <h4 className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest">
                      Simulation Outcome
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        darkMode ? 'bg-slate-950/40 border-slate-850/70' : 'bg-white border-indigo-100 shadow-xs'
                      }`}>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">CURRENT</span>
                        <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{currentPercent.toFixed(1)}%</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        darkMode ? 'bg-slate-950/40 border-slate-850/70' : 'bg-white border-indigo-100 shadow-xs'
                      }`}>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">PROJECTED</span>
                        <span className={`text-sm font-semibold ${simPercent >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {simPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        darkMode ? 'bg-slate-950/40 border-slate-850/70' : 'bg-white border-indigo-100 shadow-xs'
                      }`}>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">LOBBY STATUS</span>
                        <span className={`inline-block text-[10px] uppercase font-mono font-bold mt-1 ${simPercent >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {simPercent >= 75 ? 'ELIGIBLE' : 'DEBAR RISK'}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        darkMode ? 'bg-slate-950/40 border-slate-850/70' : 'bg-white border-indigo-100 shadow-xs'
                      }`}>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block font-medium">NEW LEDGER</span>
                        <span className={`text-sm font-semibold font-mono ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{simAttended}/{simTotal}</span>
                      </div>
                    </div>

                    {/* Plain-english advice text blocks */}
                    <div className={`text-xs leading-relaxed pt-2 border-t pl-1 transition-colors ${
                      darkMode ? 'text-indigo-200 border-indigo-900/40' : 'text-slate-850 border-indigo-100'
                    }`}>
                      {simPercent >= 75 ? (
                        <p className={`flex items-start gap-1.5 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-750'}`}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>
                            Under this simulation, your attendance in <strong>{selectedSubject.code}</strong> will be <strong>{simPercent.toFixed(1)}%</strong>. You are completely safe to register for exams!
                          </span>
                        </p>
                      ) : (
                        <p className={`flex items-start gap-1.5 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-750'}`}>
                          <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            Danger! This configuration results in <strong>{simPercent.toFixed(1)}%</strong> in <strong>{selectedSubject.code}</strong>, failing the mandatory 75% cutoff at IIIT Tiruchirappalli.
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick recommendations ledger */}
          {selectedSubject && (
            <div className={`border-t pt-5 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${
              darkMode ? 'border-slate-800/60' : 'border-slate-100'
            }`} id="simulation-micro-evals">
              <div className={`p-3 rounded-2xl border transition-all ${
                darkMode ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                <span className="text-xs font-mono text-slate-400 uppercase block">Cutoff Requirement</span>
                {currentPercent >= 75 ? (
                  <p className={`text-xs mt-1 max-w-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    You can safely skip up to <strong className="text-emerald-500">{skipSafelyCount}</strong> consecutive classes of this subject without dropping below 75%.
                  </p>
                ) : (
                  <p className={`text-xs mt-1 max-w-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    You must attend the next <strong className="text-rose-500">{straightClassesTo75}</strong> classes consecutively to rescue your attendance back to 75%.
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-2xl border transition-all ${
                darkMode ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                <span className="text-xs font-mono text-slate-400 uppercase block">Academics Vibe</span>
                <p className="text-xs text-slate-400 mt-1">
                  Courses carry a weight of <strong>{selectedSubject.credits} credits</strong>. Dropping attendance may trigger immediate grade deterioration under university policies.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Column Right: Balance radar representation */}
        <div className={`lg:col-span-5 rounded-3xl p-6 flex flex-col justify-between shadow-xl border transition-all ${
          darkMode ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/80 shadow-indigo-950/5' : 'bg-white border-slate-200 shadow-slate-150/40'
        }`} id="radar-balance-widget">
          <div>
            <h3 className={`font-display font-semibold text-base flex items-center gap-2 mb-1 ${
              darkMode ? 'text-slate-100' : 'text-slate-850'
            }`}>
              Course Balance Chart
            </h3>
            <p className="text-slate-500 text-xs">A comprehensive view tracking dispersion of subject percentages</p>

            {/* Radar diagram container */}
            <div className="h-64 w-full min-w-0 flex items-center justify-center mt-4" id="analytics-radar-recharts">
              {subjects.length === 0 ? (
                <div className="text-center py-6 px-4 flex flex-col items-center justify-center gap-3">
                  <div className={`p-3 rounded-full border ${darkMode ? 'bg-indigo-950/40 border-indigo-550/10 text-indigo-400' : 'bg-indigo-50 border-indigo-120 text-indigo-600'}`}>
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className={`font-display font-semibold text-xs ${darkMode ? 'text-slate-250' : 'text-slate-800'}`}>No Balance Data Available</h4>
                  <p className="text-slate-500 text-[11px] max-w-sm font-light">Add custom subjects above to populate the radar chart structure.</p>
                </div>
              ) : chartMounted ? (
                <ResponsiveContainer width="100%" height={256}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={darkMode ? "#1e293b" : "#e2e8f0"} />
                    <PolarAngleAxis dataKey="subject" stroke={darkMode ? "#64748b" : "#475569"} fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={darkMode ? "#334155" : "#cbd5e1"} tick={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#020617' : '#ffffff', 
                        borderColor: darkMode ? '#1e293b' : '#cbd5e1', 
                        borderRadius: '10px', 
                        fontSize: '11px',
                        color: darkMode ? '#f8fafc' : '#0f172a' 
                      }}
                      itemStyle={{ color: '#6366f1' }}
                    />
                    <Radar 
                      name="Attendance" 
                      dataKey="attendance" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.2} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 w-full flex items-center justify-center text-xs text-slate-400 font-mono">Loading telemetry radar...</div>
              )}
            </div>
          </div>

          <div className={`p-3 border rounded-2xl text-[11px] leading-relaxed transition-all ${
            darkMode 
              ? 'bg-[#020617]/40 border-slate-800/70 text-slate-400' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-950 shadow-xs'
          }`}>
            A balanced radar chart implies a healthy, consistent learning routine across core B.Tech labs and theories. Maintain overall balances centered above 75%.
          </div>
        </div>

      </div>

      {/* Course Evaluation Tables (Manual tuning available) */}
      <div className={`rounded-3xl p-6 shadow-xl mt-6 border transition-all ${
        darkMode ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/80 shadow-indigo-950/5' : 'bg-white border-slate-205 shadow-slate-100/40'
      }`} id="manual-management-deck">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-4 ${
          darkMode ? 'border-slate-800/60' : 'border-slate-100'
        }`} id="course-management-header">
          <div>
            <h3 className={`font-display font-semibold text-base ${darkMode ? 'text-slate-200' : 'text-slate-850'}`}>
              Course Stat Tuning Deck
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Edit lecture stats manually to match official IIITT university records</p>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1.5 rounded-xl border transition-all ${
            darkMode ? 'text-indigo-400 bg-[#020617]/80 border-slate-800/60' : 'text-indigo-750 bg-indigo-50 border-indigo-150'
          }`}>
            Click +/- triggers to simulate past lectures
          </span>
        </div>

        <div className="overflow-x-auto" id="course-stat-adjuster-table">
          <table className={`w-full text-left text-xs transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead>
              <tr className={`border-b font-mono text-[10px] uppercase tracking-wider transition-colors ${
                darkMode ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-500'
              }`}>
                <th className="pb-3 pl-2 font-bold">Subject / Prof</th>
                <th className="pb-3 text-center font-bold">Current %</th>
                <th className="pb-3 text-center font-bold">Attended</th>
                <th className="pb-3 text-center font-bold">Total Conducted</th>
                <th className="pb-3 text-center font-bold">Tuning Controls</th>
                <th className="pb-3 pr-2 text-right font-bold">Credits Map</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${darkMode ? 'divide-slate-800/40' : 'divide-slate-100'}`}>
              {subjects.map((sub) => {
                const percent = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
                return (
                  <tr key={sub.id} className={`transition-all ${darkMode ? 'hover:bg-slate-950/25' : 'hover:bg-slate-50/50'}`} id={`table-row-${sub.id}`}>
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${sub.color}`} />
                        <div>
                          <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{sub.code}: {sub.name}</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{sub.professor}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`font-mono font-bold ${percent >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-mono">
                      {sub.attended} clases
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold">
                      {sub.total} classes
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5" id={`controls-row-${sub.id}`}>
                        <button
                          title="Mark Class Present (+1 Attended, +1 Total)"
                          onClick={() => handleManualStatUpdate(sub.id, 1, 1)}
                          className="px-2 py-1 bg-emerald-555/10 hover:bg-emerald-600 hover:text-white text-emerald-500 font-medium rounded border border-emerald-500/20 cursor-pointer text-[10px]"
                        >
                          +1 Attended
                        </button>
                        <button
                          title="Mark Class Skipped (+0 Attended, +1 Total)"
                          onClick={() => handleManualStatUpdate(sub.id, 0, 1)}
                          className="px-2 py-1 bg-rose-555/10 hover:bg-rose-600 hover:text-white text-rose-500 font-medium rounded border border-rose-500/20 cursor-pointer text-[10px]"
                        >
                          +1 Skipped
                        </button>
                        <button
                          title="Reduce Total (-1 Conducted)"
                          onClick={() => handleManualStatUpdate(sub.id, 0, -1)}
                          className={`px-1.5 py-1 rounded cursor-pointer text-[10px] border transition-all ${
                            darkMode 
                              ? 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-205' 
                              : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-600 hover:text-slate-900 shadow-sm'
                          }`}
                        >
                          -1 Total
                        </button>
                        {deleteConfirmId === sub.id ? (
                          <div className={`flex items-center gap-1 p-0.5 rounded-lg border text-[10px] sm:text-xs z-10 font-sans tracking-tight animate-fade-in ${
                            darkMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
                          }`}>
                            <span className="text-[10px] font-bold text-rose-500 font-mono px-1">Sure?</span>
                            <button
                              onClick={() => {
                                if (selectedSubjectId === sub.id) {
                                  const remaining = subjects.filter(s => s.id !== sub.id);
                                  if (remaining.length > 0) {
                                    setSelectedSubjectId(remaining[0].id);
                                  } else {
                                    setSelectedSubjectId('');
                                  }
                                }
                                onDeleteSubject(sub.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-750 text-white font-bold rounded cursor-pointer text-[10px] transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className={`px-2 py-0.5 rounded cursor-pointer text-[10px] font-semibold border transition-colors ${
                                darkMode 
                                  ? 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            title="Remove Subject Course"
                            onClick={() => setDeleteConfirmId(sub.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded cursor-pointer text-[10px] transition-all flex items-center justify-center gap-1 border border-rose-700 shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`py-3.5 pr-2 text-right font-mono font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {sub.credits} Credits
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
