import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Edit3, Save, X, Info, Plus, Trash2, Clock, MapPin, GraduationCap } from 'lucide-react';
import { TimetableSlot, Subject } from '../types';

interface TimetableProps {
  timetable: TimetableSlot[];
  subjects: Subject[];
  onUpdateSlot: (updatedSlot: TimetableSlot) => void;
  onResetTimetable: () => void;
  onAddSlot?: (newSlot: Omit<TimetableSlot, 'id'>) => void;
  onDeleteSlot?: (slotId: string) => void;
  onClearAllSubjects?: () => void;
  darkMode?: boolean;
}

export default function Timetable({ 
  timetable, 
  subjects, 
  onUpdateSlot, 
  onResetTimetable, 
  onAddSlot,
  onDeleteSlot,
  onClearAllSubjects,
  darkMode = true 
}: TimetableProps) {
  const [activeDay, setActiveDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Edit fields
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editRoom, setEditRoom] = useState('');

  // Add timing slot form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newDay, setNewDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [newPeriod, setNewPeriod] = useState(1);
  const [newStartTimeHHMM, setNewStartTimeHHMM] = useState('09:00');
  const [newStartTimeAmPm, setNewStartTimeAmPm] = useState<'AM' | 'PM'>('AM');
  const [newEndTimeHHMM, setNewEndTimeHHMM] = useState('09:55');
  const [newEndTimeAmPm, setNewEndTimeAmPm] = useState<'AM' | 'PM'>('AM');
  const [newRoom, setNewRoom] = useState('');

  const handleTimeChange = (val: string, setter: (v: string) => void) => {
    let clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + ':' + clean.slice(2);
    }
    setter(clean);
  };

  // Pre-fill subject on mount or when subjects update
  React.useEffect(() => {
    if (subjects.length > 0 && !newSubjectId) {
      setNewSubjectId(subjects[0].id);
    }
  }, [subjects, newSubjectId]);

  // Sync newDay with activeDay
  React.useEffect(() => {
    setNewDay(activeDay);
  }, [activeDay]);

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  // Filter slots for active day and order by period, matching only registered subjects
  const daySlots = timetable
    .filter(slot => slot.day === activeDay && subjects.some(s => 
      s.id === slot.subjectId || 
      s.code.toLowerCase() === slot.subjectId.toLowerCase() || 
      s.id.toLowerCase() === slot.subjectId.toLowerCase()
    ))
    .sort((a, b) => a.period - b.period);

  const startEdit = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setEditSubjectId(slot.subjectId);
    setEditRoom(slot.room);
  };

  const saveEdit = (slot: TimetableSlot) => {
    onUpdateSlot({
      ...slot,
      subjectId: editSubjectId,
      room: editRoom
    });
    setEditingSlotId(null);
  };

  return (
    <div className="space-y-6" id="timetable-tab">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="timetable-header">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500">
            PERSONALIZED SCHEDULE
          </span>
          <h2 className={`text-2xl md:text-3xl font-display font-semibold mt-1 transition-colors ${
            darkMode ? 'text-slate-100' : 'text-slate-850'
          }`}>
            College Timetable
          </h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Modify or schedule classes. Tracks dynamically with simulated attendance triggers.
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          {subjects.length > 0 && onClearAllSubjects && (
            <button 
              id="btn-timetable-clear-subjects"
              onClick={onClearAllSubjects}
              className={`px-4 py-2 font-semibold rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-rose-950/15 border-rose-900/30 hover:bg-rose-950/30 text-rose-400 font-medium' 
                  : 'bg-rose-50 border-rose-200 hover:bg-rose-100/70 text-rose-700 font-medium'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove All Subjects
            </button>
          )}
          {onAddSlot && (
            <button 
              id="btn-trigger-add-slot"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Class Timing
            </button>
          )}
        </div>
      </div>

      {/* Add Custom Class Timing Drawer Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.98, height: 0 }}
            transition={{ duration: 0.3 }}
            id="add-slot-panel"
            className={`rounded-3xl p-5 md:p-6 overflow-hidden relative shadow-2xl border transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}
          >
            <h3 className="text-sm font-mono font-bold uppercase text-indigo-500 mb-4">
              Add New Class Timing Slot
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newSubjectId) return;
              onAddSlot?.({
                day: newDay,
                period: Number(newPeriod),
                startTime: `${newStartTimeHHMM} ${newStartTimeAmPm}`,
                endTime: `${newEndTimeHHMM} ${newEndTimeAmPm}`,
                subjectId: newSubjectId,
                room: newRoom
              });
              setShowAddForm(false);
            }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Select Subject</label>
                <select 
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-550 transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Day of Week</label>
                <select 
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value as any)}
                  className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-550 transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                  required
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Period (1-6)</label>
                  <input 
                    type="number"
                    min="1"
                    max="6"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(Number(e.target.value))}
                    className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Room (Optional)</label>
                  <input 
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Room 101"
                    className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Start Time</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      value={newStartTimeHHMM}
                      onChange={(e) => handleTimeChange(e.target.value, setNewStartTimeHHMM)}
                      placeholder="00:00"
                      maxLength={5}
                      className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all text-center font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                      }`}
                      required
                    />
                    <select
                      value={newStartTimeAmPm}
                      onChange={(e) => setNewStartTimeAmPm(e.target.value as 'AM' | 'PM')}
                      className={`border text-[13px] rounded-xl px-2 py-2 focus:outline-none focus:border-indigo-500 transition-all font-mono font-bold cursor-pointer ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-white border-slate-300 text-indigo-650'
                      }`}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-xs block mb-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>End Time</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      value={newEndTimeHHMM}
                      onChange={(e) => handleTimeChange(e.target.value, setNewEndTimeHHMM)}
                      placeholder="00:00"
                      maxLength={5}
                      className={`border text-[13px] rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all text-center font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                      }`}
                      required
                    />
                    <select
                      value={newEndTimeAmPm}
                      onChange={(e) => setNewEndTimeAmPm(e.target.value as 'AM' | 'PM')}
                      className={`border text-[13px] rounded-xl px-2 py-2 focus:outline-none focus:border-indigo-505 transition-all font-mono font-bold cursor-pointer ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-white border-slate-300 text-indigo-650'
                      }`}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-505 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                >
                  Confirm Timing Slot
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 rounded-xl text-xs cursor-pointer border transition-all ${
                    darkMode 
                      ? 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white' 
                      : 'bg-white hover:bg-slate-205 border-slate-200 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekday Switcher tabs */}
      <div className={`flex space-x-1 p-1 rounded-2xl border overflow-x-auto transition-all ${
        darkMode ? 'bg-[#020617]/80 border-slate-800/80 shadow-indigo-950/20' : 'bg-slate-100 border-slate-200/80 shadow-inner'
      }`} id="timetable-days-navigation">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => {
              setActiveDay(day);
              setEditingSlotId(null); // Close active edit
            }}
            className={`flex-1 min-w-[90px] text-center py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
              activeDay === day
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/15'
                : darkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white shadow-xs'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Grid Schedule */}
      <div className="grid grid-cols-1 gap-4" id="timetable-slots-list">
        {daySlots.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center text-slate-500 text-sm transition-all ${
            darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-205 bg-slate-50'
          }`}>
            No classes scheduled for {activeDay}. Add a class using template editor.
          </div>
        ) : (
          daySlots.map((slot) => {
            const subject = subjects.find(s => 
              s.id === slot.subjectId || 
              s.code.toLowerCase() === slot.subjectId.toLowerCase() || 
              s.id.toLowerCase() === slot.subjectId.toLowerCase()
            );
            const isEditing = editingSlotId === slot.id;

            return (
              <div 
                key={slot.id}
                id={`slot-row-${slot.id}`}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                  isEditing 
                    ? darkMode
                      ? 'bg-slate-900/80 border-indigo-500/80 shadow-lg shadow-indigo-500/10' 
                      : 'bg-indigo-50/20 border-indigo-500 shadow-md shadow-slate-100/30'
                    : darkMode
                      ? 'bg-slate-900/40 hover:bg-slate-900/60 border-slate-800/80'
                      : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-xs'
                }`}
              >
                {/* Visual strip indicating subject identity */}
                {!isEditing && subject && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${subject.color}`} />
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Period Badge and Timings */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className={`px-4 py-3 rounded-xl border text-center min-w-[90px] transition-all ${
                      darkMode ? 'bg-[#020617]/60 border-slate-805/70' : 'bg-slate-50 border-slate-200 shadow-inner'
                    }`}>
                      <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Period
                      </span>
                      <span className={`block text-xl font-display font-bold ${
                        darkMode ? 'text-slate-100' : 'text-slate-850'
                      }`}>
                        0{slot.period}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium font-mono">
                        <MapPin className="w-3.5 h-3.5" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRoom}
                            onChange={(e) => setEditRoom(e.target.value)}
                            className={`border text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-550 w-24 transition-all ${
                              darkMode ? 'bg-[#020617]/90 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                            }`}
                            placeholder="Room"
                          />
                        ) : (
                          <span>Room {slot.room}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Subject details */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2 max-w-sm">
                        <label className="text-[10px] font-mono text-slate-450 block uppercase">
                          Select Course Subject
                        </label>
                        <select
                          value={editSubjectId}
                          onChange={(e) => setEditSubjectId(e.target.value)}
                          className={`w-full text-xs rounded-xl p-2.5 focus:outline-none focus:border-indigo-550 border transition-all ${
                            darkMode ? 'bg-[#020617]/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                          }`}
                        >
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                            darkMode ? 'bg-slate-950/50 text-indigo-400 border-slate-800' : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                          }`}>
                            {subject?.code || 'NILL'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {subject?.credits !== undefined ? `${subject.credits} Credits` : 'NILL'}
                          </span>
                        </div>
                        <h4 className={`text-base font-semibold mt-1 line-clamp-1 transition-colors ${
                          darkMode ? 'text-slate-100' : 'text-slate-850'
                        }`}>
                          {subject?.name || 'NILL'}
                        </h4>
                        <p className="text-slate-450 text-xs flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                          <span>{subject?.professor || 'NILL'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                   {/* Right Column: Edit/Save Controls */}
                  <div className="flex items-center justify-end shrink-0" id={`controls-slot-${slot.id}`}>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-save-slot-${slot.id}`}
                          onClick={() => saveEdit(slot)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-slate-700 hover:text-indigo-405 border border-indigo-500 text-white text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          Save Class
                        </button>
                        <button
                          id={`btn-cancel-slot-${slot.id}`}
                          onClick={() => setEditingSlotId(null)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            darkMode 
                              ? 'bg-[#020617]/90 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800' 
                              : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-250 shadow-sm'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-edit-slot-${slot.id}`}
                          onClick={() => startEdit(slot)}
                          className={`px-3.5 py-2 border text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                            darkMode 
                              ? 'bg-[#020617]/80 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-indigo-400' 
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-650 shadow-sm'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Adjust Schedule
                        </button>
                        {onDeleteSlot && (
                          <button
                            id={`btn-delete-slot-${slot.id}`}
                            title="Delete Schedule Timing Slot"
                            onClick={() => onDeleteSlot(slot.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              darkMode 
                                ? 'bg-[#020617]/80 hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 border-slate-800 hover:border-rose-900/40' 
                                : 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-300 shadow-sm'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Helpful Info Tip */}
      <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 max-w-4xl border transition-all ${
        darkMode 
          ? 'bg-indigo-950/15 border-indigo-900/25 text-indigo-200' 
          : 'bg-indigo-50/60 border-indigo-100 text-indigo-950 shadow-xs'
      }`} id="timetable-info-box">
        <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tip on Personal Timetables:</strong> Adjusting class assignments here updates the default lecture trigger configurations on your Dashboard. Changing slots also syncs with the overall attendance logs and calculations.
        </p>
      </div>

    </div>
  );
}
