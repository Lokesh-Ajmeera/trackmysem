/**
 * Types and Interfaces for the IIITT Student Attendance Portal
 */

export type BranchCode = 'CSE' | 'CSE AI & DS' | 'ECE' | 'ECE VLSI';

export interface StudentProfile {
  name: string;
  rollNo: string;
  email: string;
  branch: BranchCode;
  semester: number;
  year: string;
  phoneNumber: string;
  section: string;
  batch: string;
  gpa: number;
  avatarUrl: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  professor: string;
  credits: number;
  attended: number;
  total: number;
  color: string; // Tailwind gradient or accent border color e.g., 'blue', 'purple', 'emerald', 'orange', 'indigo', 'cyan'
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number; // 1 to 6
  startTime: string; // e.g., "09:00 AM"
  endTime: string; // e.g., "09:55 AM"
  subjectId: string;
  room: string;
}

export interface AttendanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  slotId: string;
  status: 'present' | 'absent' | 'cancelled';
  timestamp: string; // ISO string when marked
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success';
  timestamp: string;
  read: boolean;
}

export interface PredictionResult {
  nextClassesToAttend: number;
  projectedPercentage: number;
  meetsRequirement: boolean;
  requiredToReach75: number;
}

export const getRomanNumeral = (num: number): string => {
  const mapping: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"
  };
  return mapping[num] || (num > 0 ? String(num) : "N/A");
};


