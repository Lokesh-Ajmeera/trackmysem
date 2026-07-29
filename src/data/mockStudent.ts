import { StudentProfile, Subject, TimetableSlot, AttendanceEntry, Notification } from '../types';

export const DEFAULT_STUDENT: StudentProfile = {
  name: "Lokesh Hajmeera",
  rollNo: "2111054", // Typical CSE Roll Number at IIITT (21 = batch, 11 = CSE, 054 = Roll)
  email: "lokeshhajmeera@iiitt.ac.in",
  branch: "CSE",
  semester: 6,
  year: "3rd Year",
  phoneNumber: "+91 98765 43210",
  section: "A",
  batch: "2023-2027",
  gpa: 8.42,
  avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23f9fafb'/><circle cx='50' cy='37' r='18' fill='%239ca3af'/><path d='M50 59c-15 0-27 9-27 20v4h54v-4c0-11-12-20-27-20z' fill='%239ca3af'/></svg>"
};

export const DEFAULT_SUBJECTS_CSE: Subject[] = [
  {
    id: "cs301",
    code: "CS301",
    name: "Database Management Systems",
    professor: "Dr. R. Kamala",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-blue-500 to-indigo-505"
  },
  {
    id: "cs302",
    code: "CS302",
    name: "Computer Networks",
    professor: "Dr. M. Sathyasathy",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-purple-500 to-indigo-505"
  },
  {
    id: "cs303",
    code: "CS303",
    name: "Operating Systems",
    professor: "Dr. G. Devasena",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "cs304",
    code: "CS304",
    name: "Software Engineering",
    professor: "Dr. J. Jasmine",
    credits: 3,
    attended: 0,
    total: 0,
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "cs305",
    code: "CS305",
    name: "Theory of Computation",
    professor: "Dr. S. Senthil",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "cs306",
    code: "CS306",
    name: "Operating Systems Lab",
    professor: "Dr. G. Devasena",
    credits: 2,
    attended: 0,
    total: 0,
    color: "from-pink-500 to-rose-600"
  }
];

export const DEFAULT_SUBJECTS_ECE: Subject[] = [
  {
    id: "ec301",
    code: "EC301",
    name: "Digital Signal Processing",
    professor: "Dr. P. Raja",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-blue-500 to-indigo-505"
  },
  {
    id: "ec302",
    code: "EC302",
    name: "Microprocessors & Microcontrollers",
    professor: "Dr. K. Srinivasan",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-purple-500 to-indigo-505"
  },
  {
    id: "ec303",
    code: "EC303",
    name: "VLSI Design",
    professor: "Dr. B. Venkataramani",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "ec304",
    code: "EC304",
    name: "Analog Communication",
    professor: "Dr. S. S. Rani",
    credits: 3,
    attended: 0,
    total: 0,
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "ec305",
    code: "EC305",
    name: "Antennas & Wave Propagation",
    professor: "Dr. G. Seetharaman",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "ec306",
    code: "EC306",
    name: "DSP/VLSI Lab",
    professor: "Dr. B. Venkataramani",
    credits: 2,
    attended: 0,
    total: 0,
    color: "from-pink-500 to-rose-600"
  }
];

export const DEFAULT_SUBJECTS_CSE_AI_DS: Subject[] = [
  {
    id: "cs301",
    code: "CS301",
    name: "Database Management Systems",
    professor: "Dr. R. Kamala",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-blue-500 to-indigo-505"
  },
  {
    id: "cs302",
    code: "CS302",
    name: "Computer Networks",
    professor: "Dr. M. Sathyasathy",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-purple-500 to-indigo-505"
  },
  {
    id: "cs303",
    code: "CS303",
    name: "Operating Systems",
    professor: "Dr. G. Devasena",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "cs304",
    code: "AI304",
    name: "Artificial Intelligence",
    professor: "Dr. K. Srinivas",
    credits: 3,
    attended: 0,
    total: 0,
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "cs305",
    code: "DS305",
    name: "Data Science Foundations",
    professor: "Dr. V. Prasad",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "cs306",
    code: "AI306",
    name: "AI & DS Lab",
    professor: "Dr. K. Srinivas",
    credits: 2,
    attended: 0,
    total: 0,
    color: "from-pink-500 to-rose-600"
  }
];

export const DEFAULT_SUBJECTS_ECE_VLSI: Subject[] = [
  {
    id: "ec301",
    code: "EC301",
    name: "Digital Signal Processing",
    professor: "Dr. P. Raja",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-blue-500 to-indigo-505"
  },
  {
    id: "ec302",
    code: "EC302",
    name: "Microprocessors & Microcontrollers",
    professor: "Dr. K. Srinivasan",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-purple-500 to-indigo-505"
  },
  {
    id: "ec303",
    code: "VL303",
    name: "Advanced VLSI Design",
    professor: "Dr. B. Venkataramani",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "ec304",
    code: "VL304",
    name: "CMOS Digital VLSI Design",
    professor: "Dr. S. Radhakrishnan",
    credits: 3,
    attended: 0,
    total: 0,
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "ec305",
    code: "EC305",
    name: "Antennas & Wave Propagation",
    professor: "Dr. G. Seetharaman",
    credits: 4,
    attended: 0,
    total: 0,
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "ec306",
    code: "EC306",
    name: "DSP/VLSI Lab",
    professor: "Dr. B. Venkataramani",
    credits: 2,
    attended: 0,
    total: 0,
    color: "from-pink-500 to-rose-600"
  }
];

export const DEFAULT_TIMETABLE_CSE: TimetableSlot[] = [
  // Monday
  { id: "m1", day: "Monday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "cs301", room: "LH-04" },
  { id: "m2", day: "Monday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "cs302", room: "LH-04" },
  { id: "m3", day: "Monday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "cs303", room: "LH-04" },
  { id: "m4", day: "Monday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "cs305", room: "LH-04" },
  { id: "m5", day: "Monday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "cs306", room: "Lab-3" },
  { id: "m6", day: "Monday", period: 6, startTime: "03:00 PM", endTime: "03:55 PM", subjectId: "cs306", room: "Lab-3" },

  // Tuesday
  { id: "t1", day: "Tuesday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "cs304", room: "LH-04" },
  { id: "t2", day: "Tuesday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "cs305", room: "LH-04" },
  { id: "t3", day: "Tuesday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "cs301", room: "LH-04" },
  { id: "t4", day: "Tuesday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "cs302", room: "LH-04" },
  { id: "t5", day: "Tuesday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "cs303", room: "LH-04" },

  // Wednesday
  { id: "w1", day: "Wednesday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "cs302", room: "LH-04" },
  { id: "w2", day: "Wednesday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "cs303", room: "LH-04" },
  { id: "w3", day: "Wednesday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "cs304", room: "LH-04" },
  { id: "w4", day: "Wednesday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "cs301", room: "LH-04" },
  { id: "w5", day: "Wednesday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "cs305", room: "LH-04" },

  // Thursday
  { id: "th1", day: "Thursday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "cs303", room: "LH-04" },
  { id: "th2", day: "Thursday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "cs304", room: "LH-04" },
  { id: "th3", day: "Thursday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "cs302", room: "LH-04" },
  { id: "th4", day: "Thursday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "cs305", room: "LH-04" },
  { id: "th5", day: "Thursday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "cs301", room: "LH-04" },

  // Friday
  { id: "f1", day: "Friday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "cs305", room: "LH-04" },
  { id: "f2", day: "Friday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "cs301", room: "LH-04" },
  { id: "f3", day: "Friday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "cs303", room: "LH-04" },
  { id: "f4", day: "Friday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "cs304", room: "LH-04" },
  { id: "f5", day: "Friday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "cs302", room: "LH-04" }
];

export const DEFAULT_TIMETABLE_ECE: TimetableSlot[] = [
  // Monday
  { id: "m1", day: "Monday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "ec301", room: "ECE-LH1" },
  { id: "m2", day: "Monday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "ec302", room: "ECE-LH1" },
  { id: "m3", day: "Monday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "ec303", room: "ECE-LH1" },
  { id: "m4", day: "Monday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "ec304", room: "ECE-LH1" },
  { id: "m5", day: "Monday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "ec306", room: "DSP/VLSI-Lab" },
  { id: "m6", day: "Monday", period: 6, startTime: "03:00 PM", endTime: "03:55 PM", subjectId: "ec306", room: "DSP/VLSI-Lab" },

  // Tuesday
  { id: "t1", day: "Tuesday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "ec305", room: "ECE-LH1" },
  { id: "t2", day: "Tuesday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "ec304", room: "ECE-LH1" },
  { id: "t3", day: "Tuesday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "ec301", room: "ECE-LH1" },
  { id: "t4", day: "Tuesday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "ec302", room: "ECE-LH1" },
  { id: "t5", day: "Tuesday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "ec303", room: "ECE-LH1" },

  // Wednesday
  { id: "w1", day: "Wednesday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "ec302", room: "ECE-LH1" },
  { id: "w2", day: "Wednesday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "ec303", room: "ECE-LH1" },
  { id: "w3", day: "Wednesday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "ec305", room: "ECE-LH1" },
  { id: "w4", day: "Wednesday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "ec301", room: "ECE-LH1" },
  { id: "w5", day: "Wednesday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "ec304", room: "ECE-LH1" },

  // Thursday
  { id: "th1", day: "Thursday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "ec303", room: "ECE-LH1" },
  { id: "th2", day: "Thursday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "ec305", room: "ECE-LH1" },
  { id: "th3", day: "Thursday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "ec302", room: "ECE-LH1" },
  { id: "th4", day: "Thursday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "ec304", room: "ECE-LH1" },
  { id: "th5", day: "Thursday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "ec301", room: "ECE-LH1" },

  // Friday
  { id: "f1", day: "Friday", period: 1, startTime: "09:00 AM", endTime: "09:55 AM", subjectId: "ec304", room: "ECE-LH1" },
  { id: "f2", day: "Friday", period: 2, startTime: "10:00 AM", endTime: "10:55 AM", subjectId: "ec301", room: "ECE-LH1" },
  { id: "f3", day: "Friday", period: 3, startTime: "11:15 AM", endTime: "12:10 PM", subjectId: "ec303", room: "ECE-LH1" },
  { id: "f4", day: "Friday", period: 4, startTime: "12:15 PM", endTime: "01:10 PM", subjectId: "ec305", room: "ECE-LH1" },
  { id: "f5", day: "Friday", period: 5, startTime: "02:00 PM", endTime: "02:55 PM", subjectId: "ec302", room: "ECE-LH1" }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Welcome to IIITT Attendance Portal",
    message: "Welcome back! Your academic logs have been initialized to 0% for the new semester terms. Use the dashboard or timetable tabs to register daily logs.",
    type: "success",
    timestamp: "2026-06-12T10:00:00Z",
    read: false
  },
  {
    id: "notif-2",
    title: "Class Schedule Activated",
    message: "Your standard branch timetables are now active. Feel free to adjust timings or add customized lectures under the Timetable section.",
    type: "info",
    timestamp: "2026-06-11T14:30:00Z",
    read: false
  }
];

export const DEFAULT_LOGS: AttendanceEntry[] = [];

// Helper functions for LocalStorage management
export const loadLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return defaultValue;
  }
};

export const saveLocalData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};


