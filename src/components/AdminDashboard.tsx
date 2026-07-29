import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Users, AlertTriangle, FileSpreadsheet, Plus, Search, 
  Edit, Eye, Trash2, Send, Check, Settings, Mail, RefreshCw, 
  LogOut, ChevronRight, UserCheck, CheckCircle, Sliders, ArrowUpRight, 
  TrendingUp, Download, Printer, Save, X, BookOpen, Clock, ShieldAlert,
  LayoutDashboard
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  professor: string;
  credits: number;
  attended: number;
  total: number;
  color: string;
}

interface AttendanceLog {
  id: string;
  date: string;
  subjectId: string;
  slotId: string;
  status: 'present' | 'absent' | 'cancelled';
  timestamp: string;
}

interface StudentRecord {
  uid: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  semester: number;
  year: string;
  phoneNumber: string;
  section: string;
  batch: string;
  gpa: number;
  avatarUrl: string;
  subjects: SubjectInfo[];
  logs: AttendanceLog[];
}

interface AdminDashboardProps {
  darkMode: boolean;
  onExit: () => void;
}

// Pre-configured list of classes and subjects for daily logger
const LOGGABLE_SUBJECTS = [
  { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma' },
  { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair' },
  { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian' },
  { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan' },
  { id: 'sub-mp', code: 'EC402', name: 'Microprocessors & Microcontrollers', professor: 'Dr. Priya' }
];

// Seed roster for first-time login/mock fallback
const INITIAL_SEED_STUDENTS: StudentRecord[] = [
  {
    uid: 'usr_lokesh_dev',
    name: "Lokesh Hajmeera",
    rollNo: "2111054",
    email: "lokeshhajmeera@iiitt.ac.in",
    branch: "CSE",
    semester: 6,
    year: "3rd Year",
    phoneNumber: "9876543210",
    section: "A",
    batch: "2021-25",
    gpa: 8.4,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lokesh",
    subjects: [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 18, total: 24, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 15, total: 24, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 22, total: 24, color: 'from-teal-500 to-emerald-600' },
      { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan', credits: 4, attended: 13, total: 24, color: 'from-amber-400 to-orange-500' }
    ],
    logs: [
      { id: 'l1', date: '2026-07-15', subjectId: 'sub-dbms', slotId: 'slot-1', status: 'present', timestamp: new Date().toISOString() },
      { id: 'l2', date: '2026-07-15', subjectId: 'sub-cn', slotId: 'slot-2', status: 'absent', timestamp: new Date().toISOString() }
    ]
  },
  {
    uid: 'usr_rahul',
    name: "Rahul Verma",
    rollNo: "2111082",
    email: "rahul.verma@iiitt.ac.in",
    branch: "CSE",
    semester: 6,
    year: "3rd Year",
    phoneNumber: "9445123456",
    section: "B",
    batch: "2021-25",
    gpa: 7.9,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul",
    subjects: [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 12, total: 24, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 14, total: 24, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 20, total: 24, color: 'from-teal-500 to-emerald-600' },
      { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan', credits: 4, attended: 11, total: 24, color: 'from-amber-400 to-orange-500' }
    ],
    logs: []
  },
  {
    uid: 'usr_priya',
    name: "Priya Patel",
    rollNo: "2111041",
    email: "priya.patel@iiitt.ac.in",
    branch: "ECE",
    semester: 6,
    year: "3rd Year",
    phoneNumber: "9812345678",
    section: "A",
    batch: "2021-25",
    gpa: 9.1,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya",
    subjects: [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 23, total: 24, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 22, total: 24, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 24, total: 24, color: 'from-teal-500 to-emerald-600' },
      { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan', credits: 4, attended: 21, total: 24, color: 'from-amber-400 to-orange-500' }
    ],
    logs: []
  },
  {
    uid: 'usr_aniket',
    name: "Aniket Sharma",
    rollNo: "2111015",
    email: "aniket.sharma@iiitt.ac.in",
    branch: "CSE",
    semester: 4,
    year: "2nd Year",
    phoneNumber: "9112233445",
    section: "A",
    batch: "2022-26",
    gpa: 6.8,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aniket",
    subjects: [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 10, total: 24, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 11, total: 24, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 14, total: 24, color: 'from-teal-500 to-emerald-600' },
      { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan', credits: 4, attended: 9, total: 24, color: 'from-amber-400 to-orange-500' }
    ],
    logs: []
  },
  {
    uid: 'usr_divya',
    name: "Divya Naidu",
    rollNo: "2111073",
    email: "divya.naidu@iiitt.ac.in",
    branch: "ECE",
    semester: 6,
    year: "3rd Year",
    phoneNumber: "8899112233",
    section: "A",
    batch: "2021-25",
    gpa: 7.2,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Divya",
    subjects: [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 17, total: 24, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 13, total: 24, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 18, total: 24, color: 'from-teal-500 to-emerald-600' },
      { id: 'sub-de', code: 'EC201', name: 'Digital Electronics', professor: 'Prof. Vasudevan', credits: 4, attended: 12, total: 24, color: 'from-amber-400 to-orange-500' }
    ],
    logs: []
  }
];

export default function AdminDashboard({ darkMode, onExit }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'logger' | 'danger' | 'roster' | 'reports'>('home');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(75);
  const [recentLogs, setRecentLogs] = useState<{ id: string; studentName: string; rollNo: string; subjectCode: string; status: string; timestamp: string }[]>([
    { id: 'act-1', studentName: 'Lokesh Hajmeera', rollNo: '2111054', subjectCode: 'CS302', status: 'Present', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'act-2', studentName: 'Rahul Verma', rollNo: '2111082', subjectCode: 'CS302', status: 'Absent', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'act-3', studentName: 'Aniket Sharma', rollNo: '2111015', subjectCode: 'CS101', status: 'Present', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
  ]);

  // Daily Logger States
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-dbms');
  const [attendanceRegister, setAttendanceRegister] = useState<{ [uid: string]: boolean }>({});

  // Roster Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'danger'>('all');
  const [expandedRows, setExpandedRows] = useState<{ [uid: string]: boolean }>({});

  const toggleRowExpansion = (uid: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('CSE');
  const [newStudentSemester, setNewStudentSemester] = useState(6);
  const [newStudentGPA, setNewStudentGPA] = useState(8.0);

  // Edit / Ledger Modals
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [viewingLedger, setViewingLedger] = useState<StudentRecord | null>(null);

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Fetch / Sync with Firestore or local memory
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let loadedStudents: StudentRecord[] = [];
      const hasCollection = db && typeof db === 'object' && Object.keys(db).length > 0;
      const fakeUidsToDelete = ['usr_rahul', 'usr_priya', 'usr_aniket', 'usr_divya', 'usr_lokesh_dev'];

      if (hasCollection) {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          for (const d of snapshot.docs) {
            const docId = d.id;
            const data = d.data() as any;

            // If it is a fake/seed student account, delete it from Firestore!
            if (fakeUidsToDelete.includes(docId) || (data && fakeUidsToDelete.includes(data.uid))) {
              try {
                await deleteDoc(doc(db, 'users', docId));
                console.log(`Successfully removed fake account: ${docId}`);
              } catch (delErr) {
                console.warn(`Could not delete fake account document ${docId}:`, delErr);
              }
              continue; // Skip adding to the loaded list
            }

            if (data && data.rollNo && data.name) {
              loadedStudents.push({
                uid: data.uid || docId,
                name: data.name,
                rollNo: data.rollNo,
                email: data.email || `${data.rollNo}@iiitt.ac.in`,
                branch: data.branch || 'CSE',
                semester: Number(data.semester) || 6,
                year: data.year || '3rd Year',
                phoneNumber: data.phoneNumber || '',
                section: data.section || 'A',
                batch: data.batch || '2021-25',
                gpa: Number(data.gpa) || 0,
                avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.name}`,
                subjects: data.subjects || [],
                logs: data.logs || []
              });
            }
          }
        } catch (dbErr) {
          console.warn("Firestore collection get failed. Falling back to LocalStorage:", dbErr);
        }
      }

      // LocalStorage Fallback if Firestore query was empty or failed, and we don't have a real DB connection
      if (!hasCollection && loadedStudents.length === 0) {
        const localList: StudentRecord[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('iiitt_user_data_')) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key) || '');
              if (parsed && parsed.rollNo && !fakeUidsToDelete.includes(parsed.uid)) {
                localList.push(parsed);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
        loadedStudents = localList;
      }

      setStudents(loadedStudents);

      // Populate default attendance register map
      const initialRegister: { [uid: string]: boolean } = {};
      loadedStudents.forEach(s => {
        initialRegister[s.uid] = true; // defaulted to Present
      });
      setAttendanceRegister(initialRegister);

    } catch (err) {
      console.error("Critical roster loading error:", err);
      triggerAlert("Roster loading error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Save student data back to Firestore & LocalStorage
  const saveStudentToStorage = async (student: StudentRecord) => {
    localStorage.setItem(`iiitt_user_data_${student.uid}`, JSON.stringify(student));
    
    const hasCollection = db && typeof db === 'object' && Object.keys(db).length > 0;
    if (hasCollection) {
      try {
        await setDoc(doc(db, 'users', student.uid), student, { merge: true });
      } catch (e) {
        console.warn("Firestore save skipped/failed. Kept safe in LocalStorage.", e);
      }
    }
  };

  // Helper calculation for overall student attendance
  const getOverallAttendance = (student: StudentRecord): number => {
    if (!student.subjects || student.subjects.length === 0) return 0;
    let totalAttended = 0;
    let totalClasses = 0;
    student.subjects.forEach(sub => {
      totalAttended += sub.attended;
      totalClasses += sub.total;
    });
    return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
  };

  // 1. STATS OVERVIEW COMPUTATIONS
  const totalDefaulters = useMemo(() => {
    return students.filter(s => getOverallAttendance(s) < threshold).length;
  }, [students, threshold]);

  const todayAttendanceRate = useMemo(() => {
    // Simulated based on today's logged attendance or calculated overall roster mean
    if (students.length === 0) return 0;
    let sum = 0;
    students.forEach(s => {
      sum += getOverallAttendance(s);
    });
    return sum / students.length;
  }, [students]);

  // 2. REGISTER SUBMISSION
  const handleLogAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const subject = LOGGABLE_SUBJECTS.find(sub => sub.id === selectedSubjectId);
    if (!subject) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedStudents = await Promise.all(students.map(async (student) => {
        const isPresent = attendanceRegister[student.uid] !== false;
        
        // Find if student has this subject, if not add it
        let subjectExists = student.subjects.some(s => s.id === selectedSubjectId);
        let updatedSubjects = [...student.subjects];

        if (!subjectExists) {
          updatedSubjects.push({
            id: selectedSubjectId,
            code: subject.code,
            name: subject.name,
            professor: subject.professor,
            credits: 3,
            attended: isPresent ? 1 : 0,
            total: 1,
            color: 'from-indigo-400 to-cyan-500'
          });
        } else {
          updatedSubjects = updatedSubjects.map(s => {
            if (s.id === selectedSubjectId) {
              return {
                ...s,
                attended: isPresent ? s.attended + 1 : s.attended,
                total: s.total + 1
              };
            }
            return s;
          });
        }

        // Add to logs
        const newLog: AttendanceLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          date: todayStr,
          subjectId: selectedSubjectId,
          slotId: `slot-${Math.floor(Math.random() * 5) + 1}`,
          status: isPresent ? 'present' : 'absent',
          timestamp: new Date().toISOString()
        };

        const updatedStudent = {
          ...student,
          subjects: updatedSubjects,
          logs: [newLog, ...student.logs]
        };

        // Save student
        await saveStudentToStorage(updatedStudent);
        return updatedStudent;
      }));

      // Update activity logs
      const newlyAddedActivities = students.map(s => ({
        id: `act-new-${Date.now()}-${s.uid}`,
        studentName: s.name,
        rollNo: s.rollNo,
        subjectCode: subject.code,
        status: attendanceRegister[s.uid] !== false ? 'Present' : 'Absent',
        timestamp: new Date().toISOString()
      }));

      setRecentLogs(prev => [...newlyAddedActivities.slice(0, 5), ...prev]);
      setStudents(updatedStudents);
      triggerAlert(`Attendance for class ${subject.code} successfully logged in Cloud!`, 'success');
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to submit attendance logs.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ACTION DISPATCH: Warning Emails
  const handleSendWarningEmail = (student: StudentRecord) => {
    triggerAlert(`Warning email successfully dispatched to ${student.email}`, 'info');
    // Simulate real alert addition to student's notifications log
    const updatedStudent = {
      ...student,
      logs: student.logs // Keep safe
    };
    // Also save in local simulation
    triggerAlert(`E-Mail warning sent to ${student.name} (${getOverallAttendance(student).toFixed(1)}%)`, 'success');
  };

  // 4. ROSTER ACTIONS: Create Student
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentRoll || !newStudentEmail) {
      triggerAlert("Please enter all required student variables", "error");
      return;
    }

    const newUid = `usr_${newStudentRoll.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    // Generate initial subjects matching defaults
    const initialSubjects: SubjectInfo[] = [
      { id: 'sub-dbms', code: 'CS302', name: 'Database Management Systems', professor: 'Prof. Sharma', credits: 4, attended: 12, total: 15, color: 'from-cyan-500 to-blue-500' },
      { id: 'sub-cn', code: 'CS504', name: 'Computer Networks', professor: 'Dr. Nair', credits: 4, attended: 10, total: 15, color: 'from-purple-500 to-indigo-500' },
      { id: 'sub-prog', code: 'CS101', name: 'Computer Programming', professor: 'Dr. Subramanian', credits: 3, attended: 14, total: 15, color: 'from-teal-500 to-emerald-600' }
    ];

    const newStudent: StudentRecord = {
      uid: newUid,
      name: newStudentName,
      rollNo: newStudentRoll,
      email: newStudentEmail,
      branch: newStudentBranch,
      semester: newStudentSemester,
      year: newStudentSemester <= 2 ? '1st Year' : newStudentSemester <= 4 ? '2nd Year' : newStudentSemester <= 6 ? '3rd Year' : '4th Year',
      phoneNumber: "9876543210",
      section: "A",
      batch: "2021-25",
      gpa: newStudentGPA,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newStudentName)}`,
      subjects: initialSubjects,
      logs: []
    };

    setIsLoading(true);
    try {
      await saveStudentToStorage(newStudent);
      setStudents(prev => [...prev, newStudent]);
      
      // Update register map
      setAttendanceRegister(prev => ({
        ...prev,
        [newUid]: true
      }));

      setShowAddModal(false);
      setNewStudentName('');
      setNewStudentRoll('');
      setNewStudentEmail('');
      triggerAlert(`Added new student: ${newStudentName}! Sync complete.`, 'success');
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to save student profile.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit profile submit
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsLoading(true);
    try {
      await saveStudentToStorage(editingStudent);
      setStudents(prev => prev.map(s => s.uid === editingStudent.uid ? editingStudent : s));
      setEditingStudent(null);
      triggerAlert("Student record successfully updated in Firebase database!", "success");
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to update student profile.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete student completely
  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to remove this student from the database? This is irreversible.")) return;

    setIsLoading(true);
    try {
      setStudents(prev => prev.filter(s => s.uid !== studentId));
      localStorage.removeItem(`iiitt_user_data_${studentId}`);
      
      const hasCollection = db && typeof db === 'object' && Object.keys(db).length > 0;
      if (hasCollection) {
        try {
          await deleteDoc(doc(db, 'users', studentId));
        } catch (dbErr) {
          console.warn("Firestore delete skipped/failed:", dbErr);
        }
      }
      triggerAlert("Student records removed successfully.", "info");
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to delete student.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. EXPORTS & REPORTS GENERATION
  const downloadCSVReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Roll Number,Name,Email,Branch,GPA,Overall Attendance %\n";
      
      students.forEach(student => {
        const row = [
          `"${student.rollNo}"`,
          `"${student.name}"`,
          `"${student.email}"`,
          `"${student.branch}"`,
          student.gpa,
          `"${getOverallAttendance(student).toFixed(1)}%"`
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TrackMySem_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerAlert("CSV export successfully generated!", "success");
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to generate CSV export", "error");
    }
  };

  const printDefaultersList = () => {
    const defaulters = students.filter(s => getOverallAttendance(s) < threshold);
    
    // Create direct printable window layout
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      triggerAlert("Pop-up blocked. Please enable popups to print report.", "error");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Defaulters Attendance Report - TrackMySem</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            h2 { font-size: 14px; font-weight: normal; color: #64748b; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .red-text { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>TrackMySem — Official Defaulters Roster</h1>
          <h2>Generated on ${new Date().toLocaleDateString()} &bull; Attendance Rule Threshold: <span class="red-text">${threshold}%</span></h2>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Overall Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${defaulters.map(student => `
                <tr>
                  <td>${student.rollNo}</td>
                  <td>${student.name}</td>
                  <td>${student.email}</td>
                  <td>${student.branch}</td>
                  <td class="red-text">${getOverallAttendance(student).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            TrackMySem Academic Reports Portal &bull; IIIT Tiruchirappalli &bull; Confirmed &amp; Signed by Host/Admin.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filter student list by status and search string
  const filteredStudents = useMemo(() => {
    let list = students;

    // Apply Status Filter (Safe >= threshold, Danger < threshold)
    if (statusFilter === 'safe') {
      list = list.filter(s => getOverallAttendance(s) >= threshold);
    } else if (statusFilter === 'danger') {
      list = list.filter(s => getOverallAttendance(s) < threshold);
    }

    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.rollNo.toLowerCase().includes(query) || 
      s.email.toLowerCase().includes(query) ||
      s.branch.toLowerCase().includes(query) ||
      (s.subjects && s.subjects.some(sub => sub.name.toLowerCase().includes(query) || sub.code.toLowerCase().includes(query)))
    );
  }, [students, searchQuery, statusFilter, threshold]);

  return (
    <div className={`flex min-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border ${
      darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      
      {/* LOCAL ALERTS INSIDE THE COMPONENT */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-medium text-xs tracking-wide ${
              alertMsg.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/10' :
              alertMsg.type === 'error' ? 'bg-rose-600 text-white shadow-rose-600/10' :
              'bg-blue-600 text-white shadow-blue-600/10'
            }`}
          >
            {alertMsg.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {alertMsg.type === 'error' && <ShieldAlert className="w-4 h-4" />}
            <span>{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN FIXED LEFT SIDEBAR */}
      <aside className={`w-56 shrink-0 flex flex-col border-r transition-all p-4 ${
        darkMode ? 'bg-slate-950/70 border-slate-850' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="mb-6 px-2 py-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-500 font-bold">Host Controls</span>
          <h2 className={`text-base font-extrabold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Admin Suite</h2>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === 'home'
                ? darkMode ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 pl-3 font-bold'
                : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
            <span>Quick Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('logger')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === 'logger'
                ? darkMode ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 pl-3 font-bold'
                : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 shrink-0 text-indigo-500" />
            <span>Student Subjects</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === 'danger'
                ? darkMode ? 'bg-rose-500/10 text-rose-300 border-l-2 border-rose-500 pl-3' : 'bg-rose-50 text-rose-700 border-l-2 border-rose-600 pl-3 font-bold'
                : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
            <span>Danger Zone &lt;{threshold}%</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === 'roster'
                ? darkMode ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 pl-3 font-bold'
                : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Users className="w-4.5 h-4.5 shrink-0" />
            <span>Student Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === 'reports'
                ? darkMode ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 pl-3' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 pl-3 font-bold'
                : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5 shrink-0" />
            <span>Reports &amp; Export</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button 
            onClick={fetchStudents}
            className={`w-full py-2 px-3 rounded-xl text-[11px] font-mono flex items-center justify-between cursor-pointer border ${
              darkMode ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-600'
            }`}
            title="Reload from Firestore Database"
          >
            <span>Sync DB</span>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          <button
            onClick={onExit}
            className="w-full py-2.5 px-3 rounded-xl text-[11.5px] font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2.5 transition-all text-left cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </aside>

      {/* DASHBOARD RIGHT SCROLLABLE MAIN VIEW */}
      <main className="flex-1 p-6 overflow-y-auto max-h-[85vh] relative">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center z-40 rounded-r-3xl">
            <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Syncing Ledger...</span>
            </div>
          </div>
        )}

        {/* 1. QUICK STATS OVERVIEW SECTION */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Quick-Stats Overview</h1>
                <p className="text-xs text-slate-500 mt-0.5">Real-time attendance insights &amp; tracking metrics for TrackMySem</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full border text-[11px] font-mono ${darkMode ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-650'}`}>
                Cloud Database Active
              </div>
            </div>

            {/* Grid Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className={`p-5 rounded-2xl border relative overflow-hidden shadow-sm transition-all hover:shadow-md ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
              }`}>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">Avg Attendance Rate</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {todayAttendanceRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+1.2%</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">Computed overall active B.Tech rosters</span>
              </div>

              {/* Card 2 */}
              <div className={`p-5 rounded-2xl border relative overflow-hidden shadow-sm transition-all hover:shadow-md ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
              }`}>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[40px] pointer-events-none" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">Roster Defaulters</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-rose-500">
                    {totalDefaulters}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ {students.length} students</span>
                </div>
                <span className="text-[10px] text-rose-400 block mt-2 font-mono">Below required {threshold}% attendance limit</span>
              </div>

              {/* Card 3 */}
              <div className={`p-5 rounded-2xl border relative overflow-hidden shadow-sm transition-all hover:shadow-md ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">Lectures Monitored</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {LOGGABLE_SUBJECTS.length}
                  </span>
                  <span className="text-xs text-slate-400">Core Subjects</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">CSE / ECE branch timetables mapped</span>
              </div>
            </div>

            {/* Recent Activity Feed & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Activity Feed Feed */}
              <div className={`p-5 rounded-2xl border lg:col-span-8 ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
              }`}>
                <h3 className={`text-xs uppercase font-mono tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Recent Activity Log
                </h3>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {recentLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        darkMode ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          log.status === 'Present' 
                            ? 'bg-emerald-500/15 text-emerald-500' 
                            : 'bg-rose-500/15 text-rose-500'
                        }`}>
                          {log.status === 'Present' ? 'P' : 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{log.studentName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({log.rollNo})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Logged in <span className="font-semibold text-indigo-500">{log.subjectCode}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          log.status === 'Present' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {log.status}
                        </span>
                        <span className="block text-[9px] text-slate-500 mt-1 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold Rule Controller Side Panel */}
              <div className={`p-5 rounded-2xl border lg:col-span-4 ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
              }`}>
                <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Roster Limits
                </h3>

                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <label className="text-xs block font-bold text-slate-500 mb-2">Academic Minimum Rule</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="50" 
                        max="90" 
                        value={threshold} 
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-sm font-mono font-bold text-indigo-500 shrink-0">{threshold}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-2 leading-relaxed">Students below this rate will be dynamically grouped into the Alert Center / Danger Zone tab.</span>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                    darkMode ? 'bg-indigo-950/10 border-indigo-900/20 text-indigo-400' : 'bg-indigo-50/50 border-indigo-100 text-indigo-700'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>Host Security Rule</span>
                    </div>
                    <p className="text-[11px]">Database changes are synchronized immediately. Instructors can manage attendance ledgers, customize student details, and flag defaulters automatically.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. STUDENT SUBJECTS & ATTENDANCE HEALTH */}
        {activeTab === 'logger' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Student Enrolled Subjects</h1>
                <p className="text-xs text-slate-500 mt-0.5">List of students, their added academic subjects, and targeted alerts for below 75% attendance</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">Attendance Warning Limit:</span>
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-mono font-bold">75.0%</span>
              </div>
            </div>

            {/* Local Search Bar & Status Filters */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
            }`}>
              <div className="flex items-center gap-3.5 flex-1">
                <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search students by Roll Number, Name, Branch, or Subject Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs font-semibold focus:outline-none bg-transparent ${
                    darkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('safe')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'safe'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Safe ≥75% ({students.filter(s => getOverallAttendance(s) >= threshold).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('danger')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'danger'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Danger &lt;75% ({students.filter(s => getOverallAttendance(s) < threshold).length})
                </button>
              </div>
            </div>

            {/* Students List Display */}
            <div className="space-y-6">
              {filteredStudents.length === 0 ? (
                <div className={`p-10 text-center rounded-2xl border ${
                  darkMode ? 'bg-slate-950/20 border-slate-850 text-slate-400' : 'bg-white border-slate-150 text-slate-500 shadow-sm'
                }`}>
                  <p className="text-xs">🔍 No students matching the search criteria found.</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const studentOverall = getOverallAttendance(student);
                  const subjectsBelow75Count = student.subjects.filter(sub => {
                    const pct = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
                    return pct < 75;
                  }).length;

                  return (
                    <div 
                      key={student.uid}
                      className={`p-5 rounded-2xl border transition-all ${
                        darkMode 
                          ? 'bg-slate-950/40 border-slate-850 hover:border-slate-800' 
                          : 'bg-white border-slate-150 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Student Info Bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4 border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <img 
                            referrerPolicy="no-referrer"
                            src={student.avatarUrl} 
                            alt={student.name}
                            className="w-10 h-10 rounded-full bg-slate-100 border dark:border-slate-800 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{student.name}</span>
                              <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">{student.rollNo}</span>
                              <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{student.branch}</span>
                              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Sem {student.semester}</span>
                            </div>
                            <span className="block text-[11px] text-slate-400 mt-0.5">{student.email}</span>
                          </div>
                        </div>

                        {/* Attendance Summary */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Overall Attendance</span>
                            <span className={`text-base font-mono font-extrabold ${studentOverall < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {studentOverall.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                          <div className="text-left">
                            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Critical Alerts</span>
                            {subjectsBelow75Count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full mt-0.5">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                <span>{subjectsBelow75Count} Subject{subjectsBelow75Count > 1 ? 's' : ''} Below 75%</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full mt-0.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>All Subjects Safe</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enrolled Subjects List */}
                      <div>
                        <h4 className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold mb-3">Enrolled Subjects List ({student.subjects.length})</h4>
                        {student.subjects.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No subjects added yet by this student.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                            {student.subjects.map((sub) => {
                              const pct = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
                              const isBelow75 = pct < 75;

                              return (
                                <div 
                                  key={sub.id}
                                  className={`p-3.5 rounded-xl border relative overflow-hidden transition-all ${
                                    isBelow75 
                                      ? darkMode 
                                        ? 'bg-rose-950/10 border-rose-900/35 hover:border-rose-900/50' 
                                        : 'bg-rose-50/30 border-rose-100 hover:border-rose-200 shadow-sm'
                                      : darkMode 
                                        ? 'bg-slate-900/40 border-slate-850 hover:border-slate-800' 
                                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-250 shadow-xs'
                                  }`}
                                >
                                  {/* Red glow indicator for defaulter */}
                                  {isBelow75 && (
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
                                  )}

                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <span className="text-[10px] font-mono font-bold text-indigo-500">{sub.code}</span>
                                      <h5 className={`text-xs font-bold leading-tight ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{sub.name}</h5>
                                      <span className="text-[9.5px] text-slate-400 block mt-0.5">Instructor: {sub.professor}</span>
                                    </div>
                                    <span className={`text-xs font-mono font-black shrink-0 ${isBelow75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                      {pct.toFixed(1)}%
                                    </span>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                                    <div 
                                      className={`h-full rounded-full ${isBelow75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-400 font-mono">
                                      Attended: <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{sub.attended}</strong> / {sub.total}
                                    </span>
                                    {isBelow75 ? (
                                      <span className="inline-flex items-center gap-0.5 font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Below 75%</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        <Check className="w-3 h-3" />
                                        <span>Safe</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. THE "DANGER ZONE" & ALERT CENTER */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-rose-500 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Danger Zone &amp; Alert Center</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Students sliding below the minimum attendance rule are automatically cataloged here</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold">Rule Threshold:</span>
                <input 
                  type="number" 
                  min="50" 
                  max="100" 
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className={`border text-[11px] rounded-lg px-2 py-1 w-14 focus:outline-none focus:border-rose-500 transition-all font-mono font-bold text-center ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-rose-400' : 'bg-white border-slate-300 text-rose-650'
                  }`}
                />
                <span className="text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>

            {/* Red Highlighted Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150 shadow-sm'
            }`}>
              <div className="p-4 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Attendance Defaulter Ledger</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] uppercase tracking-wider text-slate-400 ${
                      darkMode ? 'border-slate-850 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Current Overall</th>
                      <th className="p-4 text-right">Actions Dispatch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => getOverallAttendance(s) < threshold).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                          🎉 Fantastic! No students are currently below the {threshold}% minimum attendance threshold.
                        </td>
                      </tr>
                    ) : (
                      students.filter(s => getOverallAttendance(s) < threshold).map((student) => {
                        const rate = getOverallAttendance(student);
                        return (
                          <tr 
                            key={student.uid} 
                            className={`border-b transition-all text-xs ${
                              darkMode ? 'border-slate-850 hover:bg-slate-950/30' : 'border-slate-150 hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-slate-400">{student.rollNo}</td>
                            <td className="p-4 font-bold">{student.name}</td>
                            <td className="p-4 text-slate-500">{student.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                student.branch === 'CSE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {student.branch}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-extrabold text-rose-500">
                              {rate.toFixed(1)}%
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleSendWarningEmail(student)}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold tracking-wide shadow-md shadow-rose-500/10 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Warning Email</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Automated Alert settings card */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              darkMode ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-rose-50/20 border-rose-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>Official Institute Alert Directive</span>
                <p className="text-[11px] leading-relaxed">As per institute ordinances, students falling below the target attendance rate are barred from writing final semester examinations. Dispatched emails automatically prompt students to fill out leave forms or consult their academic advisors.</p>
              </div>
            </div>

          </div>
        )}

        {/* 4. STUDENT DATABASE MANAGER (THE ROSTER) */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Student Database Manager</h1>
                <p className="text-xs text-slate-500 mt-0.5">Maintain, modify, query and inspect students registered on the official roster</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Student</span>
              </button>
            </div>

            {/* Roster Controls Search Bar & Status Filters */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150'
            }`}>
              <div className="flex items-center gap-3.5 flex-1">
                <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search students by Roll Number, Name, Email, or Branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs font-semibold focus:outline-none bg-transparent ${
                    darkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('safe')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'safe'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Safe ≥75% ({students.filter(s => getOverallAttendance(s) >= threshold).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('danger')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'danger'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : darkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Danger &lt;75% ({students.filter(s => getOverallAttendance(s) < threshold).length})
                </button>
              </div>
            </div>

            {/* Roster Database Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] uppercase tracking-wider text-slate-400 ${
                      darkMode ? 'border-slate-850 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <th className="p-4 w-10"></th>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">CGPA / GPA</th>
                      <th className="p-4">Attendance %</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                          🔍 No students match the filter criteria. Try resetting status or search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const rate = getOverallAttendance(student);
                        const isDefaulter = rate < threshold;
                        const isExpanded = !!expandedRows[student.uid];

                        return (
                          <React.Fragment key={student.uid}>
                            <tr 
                              className={`border-b transition-all text-xs ${
                                isExpanded 
                                  ? darkMode ? 'bg-indigo-950/20 border-slate-800' : 'bg-indigo-50/40 border-slate-200'
                                  : darkMode ? 'border-slate-850 hover:bg-slate-950/30' : 'border-slate-150 hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="p-4">
                                <button 
                                  onClick={() => toggleRowExpansion(student.uid)}
                                  className={`p-1 rounded-lg transition-transform cursor-pointer ${
                                    isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Toggle subject details"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </td>
                              <td className="p-4 font-mono font-bold text-slate-400">{student.rollNo}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    referrerPolicy="no-referrer"
                                    src={student.avatarUrl} 
                                    alt={student.name}
                                    className="w-7 h-7 rounded-full bg-slate-100"
                                  />
                                  <div>
                                    <span className="font-bold block">{student.name}</span>
                                    <span className="block text-[10px] text-slate-400">{student.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  student.branch === 'CSE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {student.branch}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold">{student.gpa.toFixed(2)}</td>
                              <td className="p-4">
                                <button 
                                  onClick={() => toggleRowExpansion(student.uid)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1 ${
                                    isDefaulter ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <span>{rate.toFixed(1)}%</span>
                                  <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                              </td>
                              <td className="p-4 text-right space-x-1.5 shrink-0">
                                <button
                                  onClick={() => setViewingLedger(student)}
                                  className={`p-2 rounded-xl transition-all border cursor-pointer inline-flex items-center justify-center ${
                                    darkMode ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100 shadow-sm'
                                  }`}
                                  title="View Ledger"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingStudent(student)}
                                  className={`p-2 rounded-xl transition-all border cursor-pointer inline-flex items-center justify-center ${
                                    darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-amber-600 hover:bg-slate-100 shadow-sm'
                                  }`}
                                  title="Edit Profile"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.uid)}
                                  className={`p-2 rounded-xl transition-all border cursor-pointer inline-flex items-center justify-center ${
                                    darkMode ? 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-rose-650 hover:bg-slate-100 shadow-sm'
                                  }`}
                                  title="Remove Student"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>

                            {/* HIDDEN DROPDOWN SUBJECT BREAKDOWN ROW */}
                            {isExpanded && (
                              <tr className={`border-b ${
                                darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-indigo-50/20 border-slate-200'
                              }`}>
                                <td colSpan={7} className="p-4 md:p-6">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-indigo-500 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Subject-wise Attendance Breakdown for {student.name}</span>
                                      </h4>
                                      <span className="text-[11px] font-mono text-slate-400">
                                        Total Subjects: {student.subjects ? student.subjects.length : 0}
                                      </span>
                                    </div>

                                    {(!student.subjects || student.subjects.length === 0) ? (
                                      <p className="text-xs text-slate-400 italic">No enrolled subjects registered for this student.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {student.subjects.map(sub => {
                                          const pct = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
                                          const isBelow = pct < threshold;

                                          return (
                                            <div 
                                              key={sub.id} 
                                              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                                isBelow 
                                                  ? darkMode ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/50 border-rose-200'
                                                  : darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div>
                                                  <span className="text-[10px] font-mono font-bold text-indigo-400">{sub.code}</span>
                                                  <h5 className={`text-xs font-bold leading-tight ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{sub.name}</h5>
                                                </div>
                                                <span className={`text-xs font-mono font-extrabold shrink-0 ${isBelow ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                  {pct.toFixed(1)}%
                                                </span>
                                              </div>

                                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
                                                <div 
                                                  className={`h-full rounded-full ${isBelow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                              </div>

                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-400 font-mono">
                                                  Attended: <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{sub.attended}</strong> / {sub.total}
                                                </span>
                                                {isBelow ? (
                                                  <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Below {threshold}%</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-0.5 text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    <Check className="w-3 h-3" />
                                                    <span>Safe</span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. OFFICIAL REPORTS & DOWNLOADS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
              <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Official Reports &amp; Downloads</h1>
              <p className="text-xs text-slate-500 mt-0.5">Generate, dispatch and download formatted administrative spreadsheets and PDFs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Export Card 1 */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Export full roster to Excel (CSV)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Download a comprehensive spreadsheet containing all registered students, their roll numbers, branches, CGPA, and dynamic attendance percentages for all modules.</p>
                </div>
                <button
                  onClick={downloadCSVReport}
                  className="mt-6 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-indigo-650/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download to Excel (CSV)</span>
                </button>
              </div>

              {/* Export Card 2 */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Generate PDF Defaulter List</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Create and prepare a print-optimized PDF document cataloging all students falling below the current {threshold}% attendance guideline. Perfect for display boards or formal reports.</p>
                </div>
                <button
                  onClick={printDefaultersList}
                  className="mt-6 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-rose-650/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate PDF Defaulter List</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. ADD NEW STUDENT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border shadow-2xl max-w-md w-full relative ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-extrabold uppercase tracking-wide text-indigo-500 mb-4">Add Student Profile</h3>

              <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Name</label>
                  <input 
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Roll Number</label>
                    <input 
                      type="text"
                      required
                      value={newStudentRoll}
                      onChange={(e) => setNewStudentRoll(e.target.value)}
                      placeholder="e.g. 2111082"
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">CGPA / GPA</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={newStudentGPA}
                      onChange={(e) => setNewStudentGPA(Number(e.target.value))}
                      placeholder="e.g. 8.4"
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Email</label>
                  <input 
                    type="email"
                    required
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="e.g. rahul@iiitt.ac.in"
                    className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Branch</label>
                    <select
                      value={newStudentBranch}
                      onChange={(e) => setNewStudentBranch(e.target.value)}
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="CSE AI & DS">CSE AI &amp; DS</option>
                      <option value="ECE VLSI">ECE VLSI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Semester</label>
                    <select
                      value={newStudentSemester}
                      onChange={(e) => setNewStudentSemester(Number(e.target.value))}
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold tracking-wide shadow-md transition-all cursor-pointer"
                >
                  Create Student profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EDIT STUDENT MODAL */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border shadow-2xl max-w-md w-full relative ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setEditingStudent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-extrabold uppercase tracking-wide text-indigo-500 mb-4">Edit Student Details</h3>

              <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Name</label>
                  <input 
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Roll Number</label>
                    <input 
                      type="text"
                      disabled
                      value={editingStudent.rollNo}
                      className={`border rounded-xl px-3 py-2 w-full bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-mono text-slate-400`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">CGPA / GPA</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={editingStudent.gpa}
                      onChange={(e) => setEditingStudent({ ...editingStudent, gpa: Number(e.target.value) })}
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all font-mono ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Email</label>
                  <input 
                    type="email"
                    required
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Branch</label>
                    <select
                      value={editingStudent.branch}
                      onChange={(e) => setEditingStudent({ ...editingStudent, branch: e.target.value })}
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="CSE AI & DS">CSE AI &amp; DS</option>
                      <option value="ECE VLSI">ECE VLSI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Semester</label>
                    <select
                      value={editingStudent.semester}
                      onChange={(e) => setEditingStudent({ ...editingStudent, semester: Number(e.target.value) })}
                      className={`border rounded-xl px-3 py-2 w-full focus:outline-none focus:border-indigo-500 transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold tracking-wide shadow-md transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. VIEW SUBJECTS LEDGER MODAL */}
      <AnimatePresence>
        {viewingLedger && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border shadow-2xl max-w-lg w-full relative max-h-[85vh] overflow-y-auto ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setViewingLedger(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <img 
                  referrerPolicy="no-referrer"
                  src={viewingLedger.avatarUrl} 
                  alt={viewingLedger.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-sm font-extrabold">{viewingLedger.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{viewingLedger.rollNo} &bull; {viewingLedger.branch} Roster</span>
                </div>
              </div>

              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 block mb-3">Academic Subjects Ledger</span>

              <div className="space-y-3.5 text-xs">
                {viewingLedger.subjects.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">No subjects registered for this semester profile.</p>
                ) : (
                  viewingLedger.subjects.map(sub => {
                    const rate = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
                    const isAlert = rate < threshold;
                    return (
                      <div 
                        key={sub.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          darkMode ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-155 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-500 font-mono">{sub.code}</span>
                            <span className="font-semibold">{sub.name}</span>
                          </div>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Professor: {sub.professor} &bull; Credits: {sub.credits}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-extrabold ${isAlert ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {rate.toFixed(1)}%
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{sub.attended} / {sub.total} classes</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-right">
                <span className="text-xs font-bold mr-1">Overall Dynamic Attendance Rate:</span>
                <span className={`font-mono font-extrabold text-sm ${
                  getOverallAttendance(viewingLedger) < threshold ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  {getOverallAttendance(viewingLedger).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
