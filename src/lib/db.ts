// Mock Database for Tutoring Center Manager
// Uses localStorage to persist data client-side.
// Safe for Next.js SSR (returns default values on server side).

export interface Student {
  id: string;
  name: string;
  grade: number; // 1 to 12
  parentName: string;
  parentPhone: string;
  joinedDate: string; // YYYY-MM-DD
  teacherNote?: string; // Teacher feedback / comments
  discountPercentage?: number; // % giảm trừ học phí
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  grade: number;
  tuitionFee: number; // monthly fee in VND
}

export interface ClassEnrollment {
  classId: string;
  studentId: string;
  enrolledDate: string;
}

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent_excused' | 'absent_unexcused' | 'late';
  note?: string;
}

export interface TuitionPayment {
  id: string;
  studentId: string;
  classId: string;
  month: string; // MM/YYYY
  amountPaid: number; // in VND
  totalDue: number; // in VND
  paymentDate?: string; // YYYY-MM-DD (if paid)
  status: 'paid' | 'partially_paid' | 'unpaid';
  note?: string;
}

// New Types
export interface BankSettings {
  bankId: string;
  accountNo: string;
  accountName: string;
}

export interface ClassSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "18:00 - 20:00"
  topic?: string; // Topic / lesson name
}

export interface ClassTask {
  id: string;
  classId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  submissions: string[]; // array of studentIds who have submitted
}

export interface PointRule {
  id: string;
  name: string;
  points: number; // positive points
  type: 'plus' | 'minus';
}

export interface StudentEvaluation {
  id: string;
  classId: string;
  sessionId: string;
  studentId: string;
  plusPoints: number;
  minusPoints: number;
  checkedRules?: string[]; // rule IDs
  comment?: string;
}

export interface DatabaseState {
  students: Student[];
  classes: Class[];
  enrollments: ClassEnrollment[];
  attendance: Attendance[];
  payments: TuitionPayment[];
  bankSettings: BankSettings; // Added bank settings
  sessions: ClassSession[]; // Added class sessions
  tasks: ClassTask[];
  evaluations: StudentEvaluation[];
  pointRules: PointRule[]; // Added point rules
  updatedAt?: string; // Mốc thời gian đồng bộ/cập nhật cuối cùng
}

const isBrowser = typeof window !== 'undefined';

// Seed Data
const initialStudents: Student[] = [
  { id: 'std-1', name: 'Nguyễn Văn An', grade: 9, parentName: 'Nguyễn Văn Hùng', parentPhone: '0901234567', joinedDate: '2026-01-10' },
  { id: 'std-2', name: 'Trần Thị Bình', grade: 9, parentName: 'Trần Minh Tuấn', parentPhone: '0912345678', joinedDate: '2026-01-12' },
  { id: 'std-3', name: 'Lê Hoàng Cường', grade: 12, parentName: 'Lê Văn Dũng', parentPhone: '0923456789', joinedDate: '2026-01-15' },
  { id: 'std-4', name: 'Phạm Hồng Dương', grade: 12, parentName: 'Phạm Văn Nam', parentPhone: '0934567890', joinedDate: '2026-01-20' },
  { id: 'std-5', name: 'Hoàng Minh Em', grade: 10, parentName: 'Hoàng Quốc Việt', parentPhone: '0945678901', joinedDate: '2026-02-01' },
  { id: 'std-6', name: 'Ngô Thanh Giang', grade: 10, parentName: 'Ngô Đức Thịnh', parentPhone: '0956789012', joinedDate: '2026-02-05' },
  { id: 'std-7', name: 'Vũ Minh Hoa', grade: 11, parentName: 'Vũ Văn Thanh', parentPhone: '0967890123', joinedDate: '2026-02-10' },
  { id: 'std-8', name: 'Đỗ Tiến Hùng', grade: 11, parentName: 'Đỗ Hữu Đạt', parentPhone: '0978901234', joinedDate: '2026-02-12' },
  { id: 'std-9', name: 'Bùi Quốc Khánh', grade: 12, parentName: 'Bùi Văn Hùng', parentPhone: '0989012345', joinedDate: '2026-02-15' },
  { id: 'std-10', name: 'Đặng Ngọc Lan', grade: 9, parentName: 'Đặng Văn Long', parentPhone: '0990123456', joinedDate: '2026-02-18' },
  { id: 'std-11', name: 'Phùng Bình Minh', grade: 10, parentName: 'Phùng Huy Hoàng', parentPhone: '0909876543', joinedDate: '2026-03-01' },
  { id: 'std-12', name: 'Đinh Hoài Nam', grade: 11, parentName: 'Đinh Quốc Bảo', parentPhone: '0919876543', joinedDate: '2026-03-05' }
];

const initialClasses: Class[] = [
  { id: 'cls-1', name: 'Lớp Toán 9 - Thầy Hải', subject: 'Toán', grade: 9, tuitionFee: 800000 },
  { id: 'cls-2', name: 'Lớp Tiếng Anh 10 - Cô Hà', subject: 'Tiếng Anh', grade: 10, tuitionFee: 1000000 },
  { id: 'cls-3', name: 'Lớp Vật Lý 12 - Thầy Sơn', subject: 'Vật Lý', grade: 12, tuitionFee: 1200000 },
  { id: 'cls-4', name: 'Lớp Hóa Học 11 - Cô Linh', subject: 'Hóa Học', grade: 11, tuitionFee: 900000 }
];

const initialEnrollments: ClassEnrollment[] = [
  { classId: 'cls-1', studentId: 'std-1', enrolledDate: '2026-01-10' },
  { classId: 'cls-1', studentId: 'std-2', enrolledDate: '2026-01-12' },
  { classId: 'cls-1', studentId: 'std-10', enrolledDate: '2026-02-18' },

  { classId: 'cls-2', studentId: 'std-5', enrolledDate: '2026-02-01' },
  { classId: 'cls-2', studentId: 'std-6', enrolledDate: '2026-02-05' },
  { classId: 'cls-2', studentId: 'std-11', enrolledDate: '2026-03-01' },

  { classId: 'cls-3', studentId: 'std-3', enrolledDate: '2026-01-15' },
  { classId: 'cls-3', studentId: 'std-4', enrolledDate: '2026-01-20' },
  { classId: 'cls-3', studentId: 'std-9', enrolledDate: '2026-02-15' },

  { classId: 'cls-4', studentId: 'std-7', enrolledDate: '2026-02-10' },
  { classId: 'cls-4', studentId: 'std-8', enrolledDate: '2026-02-12' },
  { classId: 'cls-4', studentId: 'std-12', enrolledDate: '2026-03-05' }
];

// Seed attendance for past dates: 2026-06-15 and 2026-06-22
const initialAttendance: Attendance[] = [
  { id: 'att-1', classId: 'cls-1', studentId: 'std-1', date: '2026-06-15', status: 'present' },
  { id: 'att-2', classId: 'cls-1', studentId: 'std-2', date: '2026-06-15', status: 'late', note: 'Muộn 10p' },
  { id: 'att-3', classId: 'cls-1', studentId: 'std-10', date: '2026-06-15', status: 'absent_excused', note: 'Ốm có phép' },

  { id: 'att-4', classId: 'cls-1', studentId: 'std-1', date: '2026-06-22', status: 'present' },
  { id: 'att-5', classId: 'cls-1', studentId: 'std-2', date: '2026-06-22', status: 'present' },
  { id: 'att-6', classId: 'cls-1', studentId: 'std-10', date: '2026-06-22', status: 'absent_unexcused', note: 'Không phép' },

  { id: 'att-7', classId: 'cls-2', studentId: 'std-5', date: '2026-06-22', status: 'present' },
  { id: 'att-8', classId: 'cls-2', studentId: 'std-6', date: '2026-06-22', status: 'present' },
  { id: 'att-9', classId: 'cls-2', studentId: 'std-11', date: '2026-06-22', status: 'present' }
];

const initialPayments: TuitionPayment[] = [
  { id: 'pay-1', studentId: 'std-1', classId: 'cls-1', month: '05/2026', amountPaid: 800000, totalDue: 800000, paymentDate: '2026-05-05', status: 'paid' },
  { id: 'pay-2', studentId: 'std-2', classId: 'cls-1', month: '05/2026', amountPaid: 800000, totalDue: 800000, paymentDate: '2026-05-06', status: 'paid' },
  { id: 'pay-3', studentId: 'std-3', classId: 'cls-3', month: '05/2026', amountPaid: 1200000, totalDue: 1200000, paymentDate: '2026-05-05', status: 'paid' },
  { id: 'pay-4', studentId: 'std-4', classId: 'cls-3', month: '05/2026', amountPaid: 1200000, totalDue: 1200000, paymentDate: '2026-05-07', status: 'paid' },
  { id: 'pay-5', studentId: 'std-5', classId: 'cls-2', month: '05/2026', amountPaid: 1000000, totalDue: 1000000, paymentDate: '2026-05-05', status: 'paid' },

  { id: 'pay-6', studentId: 'std-1', classId: 'cls-1', month: '06/2026', amountPaid: 800000, totalDue: 800000, paymentDate: '2026-06-05', status: 'paid' },
  { id: 'pay-7', studentId: 'std-2', classId: 'cls-1', month: '06/2026', amountPaid: 0, totalDue: 800000, status: 'unpaid' },
  { id: 'pay-8', studentId: 'std-10', classId: 'cls-1', month: '06/2026', amountPaid: 400000, totalDue: 800000, paymentDate: '2026-06-10', status: 'partially_paid', note: 'Đóng trước một nửa' },
  { id: 'pay-9', studentId: 'std-3', classId: 'cls-3', month: '06/2026', amountPaid: 1200000, totalDue: 1200000, paymentDate: '2026-06-05', status: 'paid' },
  { id: 'pay-10', studentId: 'std-4', classId: 'cls-3', month: '06/2026', amountPaid: 0, totalDue: 1200000, status: 'unpaid' },
  { id: 'pay-11', studentId: 'std-9', classId: 'cls-3', month: '06/2026', amountPaid: 1200000, totalDue: 1200000, paymentDate: '2026-06-12', status: 'paid' },
  { id: 'pay-12', studentId: 'std-5', classId: 'cls-2', month: '06/2026', amountPaid: 1000000, totalDue: 1000000, paymentDate: '2026-06-05', status: 'paid' },
  { id: 'pay-13', studentId: 'std-6', classId: 'cls-2', month: '06/2026', amountPaid: 0, totalDue: 1000000, status: 'unpaid' },
  { id: 'pay-14', studentId: 'std-11', classId: 'cls-2', month: '06/2026', amountPaid: 1000000, totalDue: 1000000, paymentDate: '2026-06-08', status: 'paid' },
  { id: 'pay-15', studentId: 'std-7', classId: 'cls-4', month: '06/2026', amountPaid: 900000, totalDue: 900000, paymentDate: '2026-06-04', status: 'paid' },
  { id: 'pay-16', studentId: 'std-8', classId: 'cls-4', month: '06/2026', amountPaid: 0, totalDue: 900000, status: 'unpaid' },
  { id: 'pay-17', studentId: 'std-12', classId: 'cls-4', month: '06/2026', amountPaid: 0, totalDue: 900000, status: 'unpaid' }
];

const defaultBankSettings: BankSettings = {
  bankId: 'MB',
  accountNo: '0987654321',
  accountName: 'TRUNG TAM LE KHANH LOAN'
};

const initialSessions: ClassSession[] = [
  // Lớp Toán 9
  { id: 'sess-1', classId: 'cls-1', date: '2026-06-15', time: '18:00 - 20:00' },
  { id: 'sess-2', classId: 'cls-1', date: '2026-06-22', time: '18:00 - 20:00' },
  { id: 'sess-3', classId: 'cls-1', date: '2026-06-29', time: '18:00 - 20:00' },
  
  // Lớp Tiếng Anh 10
  { id: 'sess-4', classId: 'cls-2', date: '2026-06-22', time: '19:30 - 21:00' },
  { id: 'sess-5', classId: 'cls-2', date: '2026-06-29', time: '19:30 - 21:00' }
];

const initialTasks: ClassTask[] = [
  { id: 'task-1', classId: 'cls-1', title: 'Bài tập hàm số lũy thừa (Buổi 1)', dueDate: '2026-06-22', submissions: ['std-1', 'std-2', 'std-10'] },
  { id: 'task-2', classId: 'cls-1', title: 'Bài tập ôn thi giữa kì (Lượng giác)', dueDate: '2026-06-29', submissions: ['std-1'] },
  { id: 'task-3', classId: 'cls-2', title: 'Homework: Present Perfect tense practice', dueDate: '2026-06-29', submissions: ['std-5', 'std-6'] }
];

const defaultPointRules: PointRule[] = [
  { id: 'rule-plus-1', name: 'Phát biểu xây dựng bài', points: 2, type: 'plus' },
  { id: 'rule-plus-2', name: 'Làm bài tập xuất sắc', points: 3, type: 'plus' },
  { id: 'rule-plus-3', name: 'Chuyên cần, đúng giờ', points: 1, type: 'plus' },
  { id: 'rule-minus-1', name: 'Không làm bài tập về nhà', points: 3, type: 'minus' },
  { id: 'rule-minus-2', name: 'Nói chuyện riêng / Mất trật tự', points: 2, type: 'minus' },
  { id: 'rule-minus-3', name: 'Đi muộn không phép / Không tập trung', points: 1, type: 'minus' }
];

const initialEvaluations: StudentEvaluation[] = [
  // Lớp Toán 9, Buổi 1 (2026-06-15)
  { id: 'eval-1', classId: 'cls-1', sessionId: 'sess-1', studentId: 'std-1', plusPoints: 2, minusPoints: 0, checkedRules: ['rule-plus-1'], comment: 'Hăng hái phát biểu xây dựng bài' },
  { id: 'eval-2', classId: 'cls-1', sessionId: 'sess-1', studentId: 'std-2', plusPoints: 1, minusPoints: 1, checkedRules: ['rule-plus-3', 'rule-minus-3'], comment: 'Làm bài tốt nhưng đi học hơi muộn' },
  { id: 'eval-3', classId: 'cls-1', sessionId: 'sess-1', studentId: 'std-10', plusPoints: 0, minusPoints: 3, checkedRules: ['rule-minus-1'], comment: 'Vắng có phép, chưa làm bài tập về nhà' },

  // Lớp Toán 9, Buổi 2 (2026-06-22)
  { id: 'eval-4', classId: 'cls-1', sessionId: 'sess-2', studentId: 'std-1', plusPoints: 3, minusPoints: 0, checkedRules: ['rule-plus-2'], comment: 'Làm bài tập về nhà xuất sắc' },
  { id: 'eval-5', classId: 'cls-1', sessionId: 'sess-2', studentId: 'std-2', plusPoints: 0, minusPoints: 2, checkedRules: ['rule-minus-2'], comment: 'Nói chuyện riêng trong giờ học' },
  { id: 'eval-6', classId: 'cls-1', sessionId: 'sess-2', studentId: 'std-10', plusPoints: 0, minusPoints: 0, checkedRules: [], comment: 'Tập trung nghe giảng' }
];

const LOCAL_STORAGE_KEY = 'tutoring_center_db';

const getInitialState = (): DatabaseState => {
  return {
    students: initialStudents,
    classes: initialClasses,
    enrollments: initialEnrollments,
    attendance: initialAttendance,
    payments: initialPayments,
    bankSettings: defaultBankSettings,
    sessions: initialSessions,
    tasks: initialTasks,
    evaluations: initialEvaluations,
    pointRules: defaultPointRules
  };
};

export const getDB = (): DatabaseState => {
  if (!isBrowser) {
    return getInitialState();
  }
  
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const initialState = getInitialState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
  
  try {
    const parsed = JSON.parse(stored);
    
    // Auto migration to support new fields if they don't exist
    let updated = false;
    if (!parsed.bankSettings) {
      parsed.bankSettings = defaultBankSettings;
      updated = true;
    }
    if (!parsed.sessions) {
      parsed.sessions = initialSessions;
      updated = true;
    }
    if (!parsed.tasks) {
      parsed.tasks = initialTasks;
      updated = true;
    }
    if (!parsed.evaluations) {
      parsed.evaluations = initialEvaluations;
      updated = true;
    }
    if (!parsed.pointRules) {
      parsed.pointRules = defaultPointRules;
      updated = true;
    }
    if (updated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to parse DB, resetting...', e);
    const initialState = getInitialState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
};

export const saveDB = (state: DatabaseState, skipFirebaseSync = false): void => {
  if (isBrowser) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

    if (!skipFirebaseSync) {
      // Dynamic import to avoid circular dependencies and SSR bundling issues
      import('./firebaseSync').then(({ getSavedFirebaseConfig, getSavedCenterId, isAutoSyncEnabled, pushToFirebase }) => {
        const config = getSavedFirebaseConfig();
        const centerId = getSavedCenterId();
        const autoSync = isAutoSyncEnabled();

        if (config && autoSync) {
          pushToFirebase(centerId, state, config).catch(err => {
            console.error('Lỗi khi tự động đồng bộ nền lên Firebase:', err);
          });
        }
      });
    }
  }
};

// --- API Helpers ---

// Bank Settings
export const getBankSettings = (): BankSettings => {
  return getDB().bankSettings;
};

export const saveBankSettings = (settings: BankSettings): void => {
  const db = getDB();
  db.bankSettings = settings;
  saveDB(db);
};

// Class Sessions
export const getSessionsForClass = (classId: string): ClassSession[] => {
  return getDB().sessions
    .filter(s => s.classId === classId)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const addClassSession = (classId: string, session: Omit<ClassSession, 'id' | 'classId'>): ClassSession => {
  const db = getDB();
  const newSession: ClassSession = {
    ...session,
    id: `sess-${Date.now()}`,
    classId
  };
  db.sessions.push(newSession);
  saveDB(db);
  return newSession;
};

export const addClassSessionsBulk = (
  classId: string, 
  startSession: Omit<ClassSession, 'id' | 'classId'>, 
  repeatWeeksCount: number
): ClassSession[] => {
  const db = getDB();
  const generated: ClassSession[] = [];
  const baseDate = new Date(startSession.date);
  
  for (let i = 0; i < repeatWeeksCount; i++) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + (i * 7));
    const dateString = nextDate.toISOString().split('T')[0];
    
    generated.push({
      id: `sess-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      classId,
      date: dateString,
      time: startSession.time,
      topic: startSession.topic
    });
  }
  
  db.sessions.push(...generated);
  saveDB(db);
  return generated;
};

export const deleteClassSession = (id: string): void => {
  const db = getDB();
  db.sessions = db.sessions.filter(s => s.id !== id);
  saveDB(db);
};

// Students
export const getStudents = (): Student[] => getDB().students;

export const addStudent = (student: Omit<Student, 'id' | 'joinedDate'>): Student => {
  const db = getDB();
  const newStudent: Student = {
    ...student,
    id: `std-${Date.now()}`,
    joinedDate: new Date().toISOString().split('T')[0]
  };
  db.students.push(newStudent);
  saveDB(db);
  return newStudent;
};

export const updateStudent = (id: string, updated: Partial<Omit<Student, 'id'>>): Student => {
  const db = getDB();
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Student not found');
  
  db.students[index] = { ...db.students[index], ...updated };
  saveDB(db);
  return db.students[index];
};

export const deleteStudent = (id: string): void => {
  const db = getDB();
  db.students = db.students.filter(s => s.id !== id);
  db.enrollments = db.enrollments.filter(e => e.studentId !== id);
  db.attendance = db.attendance.filter(a => a.studentId !== id);
  db.payments = db.payments.filter(p => p.studentId !== id);
  saveDB(db);
};

// Classes
export const getClasses = (): Class[] => getDB().classes;

export const addClass = (cls: Omit<Class, 'id'>): Class => {
  const db = getDB();
  const newClass: Class = {
    ...cls,
    id: `cls-${Date.now()}`
  };
  db.classes.push(newClass);
  saveDB(db);
  return newClass;
};

export const updateClass = (id: string, updated: Partial<Omit<Class, 'id'>>): Class => {
  const db = getDB();
  const index = db.classes.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Class not found');
  
  db.classes[index] = { ...db.classes[index], ...updated };
  saveDB(db);
  return db.classes[index];
};

export const deleteClass = (id: string): void => {
  const db = getDB();
  db.classes = db.classes.filter(c => c.id !== id);
  db.enrollments = db.enrollments.filter(e => e.classId !== id);
  db.attendance = db.attendance.filter(a => a.studentId !== id);
  db.payments = db.payments.filter(p => p.classId !== id);
  db.sessions = db.sessions.filter(s => s.classId !== id); // Remove class sessions as well
  saveDB(db);
};

// Enrollments
export const getEnrollments = (): ClassEnrollment[] => getDB().enrollments;

export const getStudentsInClass = (classId: string): Student[] => {
  const db = getDB();
  const studentIds = db.enrollments
    .filter(e => e.classId === classId)
    .map(e => e.studentId);
  return db.students.filter(s => studentIds.includes(s.id));
};

export const getClassesForStudent = (studentId: string): Class[] => {
  const db = getDB();
  const classIds = db.enrollments
    .filter(e => e.studentId === studentId)
    .map(e => e.classId);
  return db.classes.filter(c => classIds.includes(c.id));
};

export const enrollStudent = (classId: string, studentId: string, enrolledDate?: string): void => {
  const db = getDB();
  const alreadyEnrolled = db.enrollments.some(e => e.classId === classId && e.studentId === studentId);
  if (alreadyEnrolled) return;

  const finalEnrolledDate = enrolledDate || new Date().toISOString().split('T')[0];

  db.enrollments.push({
    classId,
    studentId,
    enrolledDate: finalEnrolledDate
  });

  // Auto-generate invoice/payment entry for the month of enrollment for this student
  const cls = db.classes.find(c => c.id === classId);
  const student = db.students.find(s => s.id === studentId);
  if (cls) {
    // Parse month from enrolledDate (YYYY-MM-DD)
    const dateParts = finalEnrolledDate.split('-');
    let targetMonth = '';
    if (dateParts.length === 3) {
      targetMonth = `${dateParts[1]}/${dateParts[0]}`; // MM/YYYY
    } else {
      targetMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    }

    const discountPercent = student?.discountPercentage || 0;
    let totalDue = cls.tuitionFee;
    if (discountPercent > 0) {
      totalDue = Math.round(totalDue * (1 - discountPercent / 100));
    }

    const paymentExists = db.payments.some(p => p.studentId === studentId && p.classId === classId && p.month === targetMonth);
    if (!paymentExists) {
      db.payments.push({
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        classId,
        month: targetMonth,
        amountPaid: 0,
        totalDue: totalDue,
        status: 'unpaid'
      });
    }
  }

  saveDB(db);
};

export const unenrollStudent = (classId: string, studentId: string): void => {
  const db = getDB();
  db.enrollments = db.enrollments.filter(e => !(e.classId === classId && e.studentId === studentId));
  saveDB(db);
};

// Attendance
export const getAttendanceForClass = (classId: string, date?: string): Attendance[] => {
  const db = getDB();
  let query = db.attendance.filter(a => a.classId === classId);
  if (date) {
    query = query.filter(a => a.date === date);
  }
  return query;
};

export const saveAttendance = (classId: string, date: string, records: { studentId: string; status: Attendance['status']; note?: string }[]): void => {
  const db = getDB();
  
  // Remove existing attendance records for this class and date
  db.attendance = db.attendance.filter(a => !(a.classId === classId && a.date === date));
  
  // Insert new records
  records.forEach(r => {
    db.attendance.push({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      classId,
      studentId: r.studentId,
      date,
      status: r.status,
      note: r.note
    });
  });
  
  saveDB(db);
};

// Payments / Tuition
export const getPayments = (): TuitionPayment[] => getDB().payments;

export const savePayment = (payment: Omit<TuitionPayment, 'id'> & { id?: string }): TuitionPayment => {
  const db = getDB();
  let finalPayment: TuitionPayment;
  
  if (payment.id) {
    const idx = db.payments.findIndex(p => p.id === payment.id);
    if (idx !== -1) {
      db.payments[idx] = { ...db.payments[idx], ...payment } as TuitionPayment;
      finalPayment = db.payments[idx];
    } else {
      finalPayment = { ...payment, id: payment.id } as TuitionPayment;
      db.payments.push(finalPayment);
    }
  } else {
    finalPayment = {
      ...payment,
      id: `pay-${Date.now()}`
    } as TuitionPayment;
    db.payments.push(finalPayment);
  }
  
  saveDB(db);
  return finalPayment;
};

// General stats computed on client
export const getDashboardStats = () => {
  const db = getDB();
  const totalStudents = db.students.length;
  const totalClasses = db.classes.length;
  
  let totalPaid = 0;
  let totalDebt = 0;
  
  db.payments.forEach(p => {
    totalPaid += p.amountPaid;
    totalDebt += (p.totalDue - p.amountPaid);
  });
  
  // Grade distribution (1-12)
  const gradeDistribution: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) {
    gradeDistribution[i] = 0;
  }
  db.students.forEach(s => {
    if (s.grade >= 1 && s.grade <= 12) {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
    }
  });
  
  return {
    totalStudents,
    totalClasses,
    totalPaid,
    totalDebt,
    gradeDistribution
  };
};

// --- Tasks Helpers ---
export const getTasksForClass = (classId: string): ClassTask[] => {
  return getDB().tasks.filter(t => t.classId === classId);
};

export const addClassTask = (classId: string, task: Omit<ClassTask, 'id' | 'classId' | 'submissions'>): ClassTask => {
  const db = getDB();
  const newTask: ClassTask = {
    ...task,
    id: `task-${Date.now()}`,
    classId,
    submissions: []
  };
  db.tasks.push(newTask);
  saveDB(db);
  return newTask;
};

export const toggleTaskSubmission = (taskId: string, studentId: string): void => {
  const db = getDB();
  const idx = db.tasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    const task = db.tasks[idx];
    if (task.submissions.includes(studentId)) {
      task.submissions = task.submissions.filter(id => id !== studentId);
    } else {
      task.submissions.push(studentId);
    }
    saveDB(db);
  }
};

export const deleteClassTask = (id: string): void => {
  const db = getDB();
  db.tasks = db.tasks.filter(t => t.id !== id);
  saveDB(db);
};

// --- Point Rules Helpers ---
export const getPointRules = (): PointRule[] => {
  return getDB().pointRules || defaultPointRules;
};

export const savePointRules = (rules: PointRule[]): void => {
  const db = getDB();
  db.pointRules = rules;
  saveDB(db);
};

// --- Evaluations Helpers ---
export const getEvaluationsForSession = (sessionId: string): StudentEvaluation[] => {
  return getDB().evaluations.filter(e => e.sessionId === sessionId);
};

export const getEvaluationsForClass = (classId: string): StudentEvaluation[] => {
  return getDB().evaluations.filter(e => e.classId === classId);
};

export const saveEvaluations = (
  sessionId: string, 
  classId: string, 
  records: { studentId: string; plusPoints: number; minusPoints: number; checkedRules?: string[]; comment?: string }[]
): void => {
  const db = getDB();
  
  // Remove existing evaluations for this session
  db.evaluations = db.evaluations.filter(e => e.sessionId !== sessionId);
  
  // Add new evaluation records
  records.forEach(r => {
    db.evaluations.push({
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      classId,
      sessionId,
      studentId: r.studentId,
      plusPoints: r.plusPoints,
      minusPoints: r.minusPoints,
      checkedRules: r.checkedRules || [],
      comment: r.comment
    });
  });
  
  saveDB(db);
};

export const resetToSeedData = (): void => {
  if (isBrowser) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getInitialState()));
  }
};

export interface TuitionCalculation {
  scheduledSessions: number;
  absences: number;
  prevBalance: number;
  currentExcess: number;
  newBalance: number;
  discountSessions: number;
  discountAmount: number;
  recommendedDue: number;
}

export const calculateTuitionForMonth = (
  studentId: string,
  classId: string,
  targetMonth: string // "MM/YYYY"
): TuitionCalculation => {
  const db = getDB();
  const enrollment = db.enrollments.find(e => e.studentId === studentId && e.classId === classId);
  const cls = db.classes.find(c => c.id === classId);
  const student = db.students.find(s => s.id === studentId);
  
  if (!enrollment || !cls || !student) {
    return {
      scheduledSessions: 0,
      absences: 0,
      prevBalance: 0,
      currentExcess: 0,
      newBalance: 0,
      discountSessions: 0,
      discountAmount: 0,
      recommendedDue: 0
    };
  }

  const enrolledDateStr = enrollment.enrolledDate; // YYYY-MM-DD
  const enrolledDate = new Date(enrolledDateStr);
  const enrolledYear = enrolledDate.getFullYear();
  const enrolledMonth = enrolledDate.getMonth() + 1; // 1-12
  
  // Parse target month
  const [targetM, targetY] = targetMonth.split('/').map(Number);
  
  // Generate list of months chronologically from enrolled Month/Year to target Month/Year
  const monthsList: string[] = [];
  let currY = enrolledYear;
  let currM = enrolledMonth;
  
  while (currY < targetY || (currY === targetY && currM <= targetM)) {
    monthsList.push(`${String(currM).padStart(2, '0')}/${currY}`);
    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
  }

  let balance = 0;
  let prevBalance = 0;
  let targetScheduled = 0;
  let targetAbsences = 0;
  let targetExcess = 0;
  let targetDiscountSessions = 0;

  monthsList.forEach(mStr => {
    const [m, y] = mStr.split('/').map(Number);
    
    // Find sessions in this month y-m
    const monthSessions = db.sessions.filter(s => {
      if (s.classId !== classId) return false;
      const sDate = new Date(s.date);
      if (s.date < enrolledDateStr) return false;
      return (sDate.getFullYear() === y && (sDate.getMonth() + 1) === m);
    });
    
    // Find absences in this month y-m
    const monthAbsences = db.attendance.filter(a => {
      if (a.classId !== classId || a.studentId !== studentId) return false;
      if (a.date < enrolledDateStr) return false;
      if (a.status !== 'absent_excused' && a.status !== 'absent_unexcused') return false;
      const aDate = new Date(a.date);
      return (aDate.getFullYear() === y && (aDate.getMonth() + 1) === m);
    });

    const scheduledCount = monthSessions.length;
    const absencesCount = monthAbsences.length;
    const excessGenerated = Math.max(0, scheduledCount - 12);
    
    if (mStr === targetMonth) {
      prevBalance = balance;
      targetScheduled = scheduledCount;
      targetAbsences = absencesCount;
      targetExcess = excessGenerated;
    }

    balance = balance + excessGenerated - absencesCount;
    
    if (balance < 0) {
      if (mStr === targetMonth) {
        targetDiscountSessions = -balance;
      }
      balance = 0; // reset balance to 0 as it gets discounted in this month's billing
    }
  });

  const discountAmount = targetDiscountSessions * Math.round(cls.tuitionFee / 12);
  let recommendedDue = Math.max(0, cls.tuitionFee - discountAmount);

  // Apply student discount percentage if configured
  const studentDiscountPercent = student.discountPercentage || 0;
  if (studentDiscountPercent > 0) {
    recommendedDue = Math.round(recommendedDue * (1 - studentDiscountPercent / 100));
  }

  return {
    scheduledSessions: targetScheduled,
    absences: targetAbsences,
    prevBalance,
    currentExcess: targetExcess,
    newBalance: balance,
    discountSessions: targetDiscountSessions,
    discountAmount,
    recommendedDue
  };
};
