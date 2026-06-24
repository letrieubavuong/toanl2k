'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Plus, 
  Check, 
  UserMinus, 
  X,
  UserPlus,
  Save,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  QrCode,
  Printer,
  MessageSquare,
  Copy,
  ExternalLink,
  CheckSquare,
  Star,
  Minus,
  Trophy,
  Award
} from 'lucide-react';
import { 
  getClasses, 
  getStudents, 
  getStudentsInClass, 
  enrollStudent, 
  unenrollStudent, 
  addStudent, 
  getAttendanceForClass, 
  saveAttendance, 
  getClassesForStudent,
  updateClass,
  deleteClass,
  updateStudent,
  getSessionsForClass,
  addClassSession,
  addClassSessionsBulk,
  deleteClassSession,
  getTasksForClass,
  addClassTask,
  toggleTaskSubmission,
  deleteClassTask,
  getEvaluationsForSession,
  getEvaluationsForClass,
  saveEvaluations,
  getPointRules,
  PointRule,
  Class, 
  Student, 
  Attendance,
  ClassSession,
  ClassTask,
  StudentEvaluation
} from '@/lib/db';

export default function ClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'schedule' | 'tasks' | 'evaluations'>('students');

  // Schedule States
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('18:00 - 20:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);

  // Tasks States
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Evaluations States
  const [selectedEvaluationSessionId, setSelectedEvaluationSessionId] = useState<string>('');
  const [evaluationRecords, setEvaluationRecords] = useState<Record<string, { plusPoints: number; minusPoints: number; checkedRules?: string[]; comment: string }>>({});
  const [classEvaluations, setClassEvaluations] = useState<StudentEvaluation[]>([]);
  const [showSaveEvaluationToast, setShowSaveEvaluationToast] = useState(false);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);

  // Dialog Đánh giá học sinh
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<Student | null>(null);
  const [evalDialogCheckedRules, setEvalDialogCheckedRules] = useState<string[]>([]);
  const [evalDialogComment, setEvalDialogComment] = useState('');

  // Attendance Form State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: Attendance['status']; note: string }>>({});
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'existing' | 'new'>('existing');
  
  // Modal Case 1: Existing Student
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');
  
  // Modal Case 2: New Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState(9);
  const [newStudentParentName, setNewStudentParentName] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [enrollDate, setEnrollDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Selected Student for Detail Modal
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Edit Class Modal State
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassSubject, setEditClassSubject] = useState('');
  const [editClassGrade, setEditClassGrade] = useState(9);
  const [editClassTuition, setEditClassTuition] = useState(800000);

  // QR Modal States (New Feature integrated inside Classes!)
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [qrTeacherNote, setQrTeacherNote] = useState('');
  const [origin, setOrigin] = useState('');
  const [showSaveQRToast, setShowSaveQRToast] = useState(false);
  const [showCopyQRToast, setShowCopyQRToast] = useState(false);

  const loadData = () => {
    const classList = getClasses();
    const currentClass = classList.find(c => c.id === classId) || null;
    setCls(currentClass);
    
    if (currentClass) {
      const roster = getStudentsInClass(classId);
      setStudents(roster);
      
      const centerStudents = getStudents();
      setAllStudents(centerStudents);
      
      const classSessions = getSessionsForClass(classId);
      setSessions(classSessions);

      const classTasks = getTasksForClass(classId);
      setTasks(classTasks);

      const allClassEvals = getEvaluationsForClass(classId);
      setClassEvaluations(allClassEvals);

      const rulesList = getPointRules();
      setPointRules(rulesList);
      
      // Auto-set grade in new student form to match class grade
      setNewStudentGrade(currentClass.grade);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, [classId]);

  // Load attendance data whenever active date or students change
  useEffect(() => {
    if (!classId || students.length === 0) return;

    const existingAtt = getAttendanceForClass(classId, attendanceDate);
    const initialRecords: Record<string, { status: Attendance['status']; note: string }> = {};
    
    students.forEach(std => {
      const record = existingAtt.find(a => a.studentId === std.id);
      if (record) {
        initialRecords[std.id] = {
          status: record.status,
          note: record.note || ''
        };
      } else {
        // Default to present if no prior record
        initialRecords[std.id] = {
          status: 'present',
          note: ''
        };
      }
    });

    setAttendanceRecords(initialRecords);
  }, [attendanceDate, students, classId]);

  const handleStatusChange = (studentId: string, status: Attendance['status']) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleSaveAttendance = () => {
    const recordsToSave = Object.keys(attendanceRecords).map(studentId => ({
      studentId,
      status: attendanceRecords[studentId].status,
      note: attendanceRecords[studentId].note
    }));

    saveAttendance(classId, attendanceDate, recordsToSave);
    
    // Show Toast/Alert success
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 3000);
  };

  const handleEnrollExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingStudentId) {
      alert('Vui lòng chọn học sinh từ danh sách.');
      return;
    }

    enrollStudent(classId, selectedExistingStudentId, enrollDate);
    setSelectedExistingStudentId('');
    setEnrollDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(false);
    loadData();
  };

  const handleEnrollNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentParentName.trim() || !newStudentParentPhone.trim()) {
      alert('Vui lòng điền đầy đủ thông tin học sinh mới.');
      return;
    }

    // 1. Add student to Center roster
    const newStd = addStudent({
      name: newStudentName,
      grade: newStudentGrade,
      parentName: newStudentParentName,
      parentPhone: newStudentParentPhone
    });

    // 2. Enroll student in current class
    enrollStudent(classId, newStd.id, enrollDate);

    // Reset Form
    setNewStudentName('');
    setNewStudentParentName('');
    setNewStudentParentPhone('');
    setEnrollDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(false);
    
    // Reload
    loadData();
  };

  const handleUnenroll = (studentId: string, studentName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentName} ra khỏi lớp học này? Dữ liệu điểm danh của học sinh trong lớp cũng có thể bị ảnh hưởng.`)) {
      unenrollStudent(classId, studentId);
      loadData();
    }
  };

  // Open Edit Class Modal pre-filled
  const handleOpenEditClassModal = () => {
    if (!cls) return;
    setEditClassName(cls.name);
    setEditClassSubject(cls.subject);
    setEditClassGrade(cls.grade);
    setEditClassTuition(cls.tuitionFee);
    setIsEditClassModalOpen(true);
  };

  // Save Class Edit
  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassName.trim() || !editClassSubject.trim() || editClassTuition <= 0) {
      alert('Vui lòng điền đầy đủ và chính xác thông tin lớp học.');
      return;
    }

    updateClass(classId, {
      name: editClassName,
      subject: editClassSubject,
      grade: editClassGrade,
      tuitionFee: editClassTuition
    });

    setIsEditClassModalOpen(false);
    loadData();
  };

  // Delete Class
  const handleDeleteClass = () => {
    if (!cls) return;
    if (confirm(`Bạn có chắc chắn muốn xóa lớp học "${cls.name}"? Hành động này sẽ xóa lớp khỏi trung tâm, rút toàn bộ học sinh và xóa lịch sử điểm danh của lớp. Hành động này không thể hoàn tác.`)) {
      deleteClass(classId);
      router.push('/classes');
    }
  };

  // Open QR modal for student
  const handleOpenQRModal = (student: Student) => {
    setSelectedStudentForQR(student);
    setQrTeacherNote(student.teacherNote || '');
  };

  // Save teacher note inside QR modal
  const handleSaveQRNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForQR) return;

    updateStudent(selectedStudentForQR.id, { teacherNote: qrTeacherNote });
    
    // Refresh lists
    loadData();

    setShowSaveQRToast(true);
    setTimeout(() => setShowSaveQRToast(false), 3000);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setShowCopyQRToast(true);
    setTimeout(() => setShowCopyQRToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate || !sessionTime.trim()) {
      alert('Vui lòng điền ngày và giờ học.');
      return;
    }

    if (isRecurring) {
      addClassSessionsBulk(classId, {
        date: sessionDate,
        time: sessionTime.trim()
      }, recurringWeeks);
    } else {
      addClassSession(classId, {
        date: sessionDate,
        time: sessionTime.trim()
      });
    }

    setIsAddSessionModalOpen(false);
    setIsRecurring(false);
    setRecurringWeeks(4);
    loadData();
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa buổi học này khỏi lịch học?')) {
      deleteClassSession(id);
      loadData();
    }
  };

  // --- Tasks Handlers ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDueDate) {
      alert('Vui lòng điền đầy đủ tên nhiệm vụ và hạn nộp.');
      return;
    }
    addClassTask(classId, {
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate
    });
    setNewTaskTitle('');
    setIsAddTaskModalOpen(false);
    loadData();
  };

  const handleToggleSubmission = (taskId: string, studentId: string) => {
    toggleTaskSubmission(taskId, studentId);
    loadData();
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
      deleteClassTask(id);
      loadData();
    }
  };

  // --- Evaluations Handlers ---
  const handleSaveEvaluations = () => {
    if (!selectedEvaluationSessionId) return;

    const recordsToSave = Object.keys(evaluationRecords).map(studentId => ({
      studentId,
      plusPoints: evaluationRecords[studentId].plusPoints,
      minusPoints: evaluationRecords[studentId].minusPoints,
      checkedRules: evaluationRecords[studentId].checkedRules || [],
      comment: evaluationRecords[studentId].comment
    }));

    saveEvaluations(selectedEvaluationSessionId, classId, recordsToSave);
    loadData();

    setShowSaveEvaluationToast(true);
    setTimeout(() => setShowSaveEvaluationToast(false), 3000);
  };

  const getPointsFromCheckedRules = (checkedIds: string[]) => {
    let plus = 0;
    let minus = 0;
    checkedIds.forEach(id => {
      const rule = pointRules.find(r => r.id === id);
      if (rule) {
        if (rule.type === 'plus') {
          plus += rule.points;
        } else if (rule.type === 'minus') {
          minus += rule.points;
        }
      }
    });
    return { plus, minus };
  };

  const handleOpenEvaluationDialog = (student: Student) => {
    setSelectedStudentForEval(student);
    const record = evaluationRecords[student.id] || { plusPoints: 0, minusPoints: 0, checkedRules: [], comment: '' };
    setEvalDialogCheckedRules(record.checkedRules || []);
    setEvalDialogComment(record.comment || '');
  };

  const handleSaveDialogEvaluation = () => {
    if (!selectedStudentForEval) return;
    const { plus, minus } = getPointsFromCheckedRules(evalDialogCheckedRules);
    setEvaluationRecords(prev => ({
      ...prev,
      [selectedStudentForEval.id]: {
        plusPoints: plus,
        minusPoints: minus,
        checkedRules: evalDialogCheckedRules,
        comment: evalDialogComment
      }
    }));
    setSelectedStudentForEval(null);
  };

  const handleToggleRuleInDialog = (ruleId: string) => {
    setEvalDialogCheckedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  const getStudentAverageAndRanking = (studentId: string) => {
    const studentEvals = classEvaluations.filter(e => e.studentId === studentId);
    if (studentEvals.length === 0) {
      return { average: 10, ranking: 'Tốt (Mặc định)', labelClass: 'badge-secondary' };
    }

    const totalScores = studentEvals.reduce((acc, curr) => {
      const score = Math.max(0, 10 + curr.plusPoints - curr.minusPoints);
      return acc + score;
    }, 0);

    const average = Math.round((totalScores / studentEvals.length) * 10) / 10;
    
    let ranking = 'Trung bình';
    let labelClass = 'badge-info';

    if (average >= 9.0) {
      ranking = 'Xuất sắc';
      labelClass = 'badge-success';
    } else if (average >= 8.0) {
      ranking = 'Tốt / Khá';
      labelClass = 'badge-primary';
    } else if (average >= 6.5) {
      ranking = 'Trung bình';
      labelClass = 'badge-warning';
    } else {
      ranking = 'Yếu (Cần cố gắng)';
      labelClass = 'badge-danger';
    }

    return { average, ranking, labelClass };
  };

  // Auto-select evaluation session if not set
  useEffect(() => {
    if (sessions.length > 0 && !selectedEvaluationSessionId) {
      setSelectedEvaluationSessionId(sessions[0].id);
    }
  }, [sessions, selectedEvaluationSessionId]);

  // Load evaluation records when selected session changes
  useEffect(() => {
    if (!selectedEvaluationSessionId || students.length === 0) return;

    const existingEvals = getEvaluationsForSession(selectedEvaluationSessionId);
    const initialRecords: Record<string, { plusPoints: number; minusPoints: number; checkedRules?: string[]; comment: string }> = {};

    students.forEach(std => {
      const rec = existingEvals.find(e => e.studentId === std.id);
      if (rec) {
        initialRecords[std.id] = {
          plusPoints: rec.plusPoints,
          minusPoints: rec.minusPoints,
          checkedRules: rec.checkedRules || [],
          comment: rec.comment || ''
        };
      } else {
        initialRecords[std.id] = {
          plusPoints: 0,
          minusPoints: 0,
          checkedRules: [],
          comment: ''
        };
      }
    });

    setEvaluationRecords(initialRecords);
  }, [selectedEvaluationSessionId, students]);

  if (!mounted) {
    return <div className="loading-state">Đang tải thông tin chi tiết lớp học...</div>;
  }

  if (!cls) {
    return (
      <div className="error-card card">
        <AlertCircle size={48} className="error-icon" />
        <h3>Không tìm thấy lớp học</h3>
        <p>Lớp học này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <button className="btn btn-primary" onClick={() => router.push('/classes')}>
          <ArrowLeft size={16} /> Quay lại danh sách lớp
        </button>
      </div>
    );
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Filter students who are NOT in the class yet for the dropdown selector
  const enrolledStudentIds = students.map(s => s.id);
  const eligibleExistingStudents = allStudents.filter(s => !enrolledStudentIds.includes(s.id));

  // Dynamic QR Code parameters
  const reportLink = selectedStudentForQR ? `${origin}/reports/${selectedStudentForQR.id}` : '';
  const qrCodeUrl = reportLink 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(reportLink)}`
    : '';

  return (
    <div className="class-detail-wrapper">
      {/* Header Back Button & Info */}
      <div className="detail-header-nav">
        <button className="back-link-btn" onClick={() => router.push('/classes')}>
          <ArrowLeft size={16} />
          <span>Quay lại danh sách lớp</span>
        </button>
      </div>

      <div className="class-profile-card card glass">
        <div className="profile-details">
          <div className="title-edit-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2>{cls.name}</h2>
            <div className="class-manage-buttons" style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleOpenEditClassModal}
                title="Sửa tên/thông tin lớp học"
                style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px' }}
              >
                <Edit2 size={12} />
                <span>Sửa lớp</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleDeleteClass}
                title="Xóa lớp học"
                style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <Trash2 size={12} />
                <span>Xóa lớp</span>
              </button>
            </div>
          </div>
          <div className="profile-badges" style={{ marginTop: '8px' }}>
            <span className="badge badge-primary">Khối lớp: {cls.grade}</span>
            <span className="badge badge-secondary">Môn học: {cls.subject}</span>
            <span className="badge badge-info">Sĩ số: {students.length} học sinh</span>
            <span className="badge badge-success">Học phí: {formatVND(cls.tuitionFee)}/tháng</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Thêm Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-header" style={{ overflowX: 'auto', display: 'flex', whiteSpace: 'nowrap', gap: '8px', paddingBottom: '4px' }}>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
          style={{ flexShrink: 0 }}
        >
          <Users size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Danh sách học sinh
        </button>
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
          style={{ flexShrink: 0 }}
        >
          <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Điểm danh lớp học
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          style={{ flexShrink: 0 }}
        >
          <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Lịch học của lớp
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          style={{ flexShrink: 0 }}
        >
          <CheckSquare size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Nhiệm vụ (Todo)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluations')}
          style={{ flexShrink: 0 }}
        >
          <Star size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Đánh giá học tập
        </button>
      </div>

      {/* Toast Save Alert */}
      {showSaveAlert && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Đã lưu lịch sử điểm danh ngày {attendanceDate} thành công!
        </div>
      )}

      {/* Toast Save Evaluation */}
      {showSaveEvaluationToast && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Đã lưu đánh giá học sinh buổi học thành công!
        </div>
      )}

      {/* Toast Save QR Note */}
      {showSaveQRToast && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Đã cập nhật lời nhắn gửi phụ huynh thành công!
        </div>
      )}

      {/* Toast Copy QR Link */}
      {showCopyQRToast && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          Đã sao chép đường dẫn báo cáo học sinh!
        </div>
      )}

      {/* Tab 1: Students List */}
      {activeTab === 'students' && (
        <div className="tab-content">
          {students.length === 0 ? (
            <div className="card empty-state-inner">
              <Users size={40} className="empty-icon" />
              <h4>Chưa có học sinh trong lớp</h4>
              <p>Thêm học sinh từ danh sách có sẵn của trung tâm hoặc tạo học sinh mới.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
                Thêm học sinh ngay
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Họ và Tên</th>
                    <th>Ngày Vào Lớp</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((std) => (
                    <tr key={std.id}>
                      <td>
                        <button 
                          type="button"
                          className="student-details-trigger"
                          onClick={() => setSelectedStudentForDetail(std)}
                          title="Xem chi tiết học sinh"
                        >
                          <strong className="student-name-cell">{std.name}</strong>
                        </button>
                      </td>
                      <td>{std.joinedDate}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenQRModal(std)}
                            title="Tạo mã QR gửi phụ huynh"
                            style={{ gap: '4px' }}
                          >
                            <QrCode size={14} />
                            <span>Gửi QR</span>
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm delete-btn-table"
                            onClick={() => handleUnenroll(std.id, std.name)}
                            title="Xóa khỏi lớp học"
                            style={{ gap: '4px' }}
                          >
                            <UserMinus size={14} />
                            <span>Rút lớp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Attendance Check-in */}
      {activeTab === 'attendance' && (
        <div className="tab-content">
          <div className="card attendance-control-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="date-picker-section" style={{ display: 'flex', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0, marginRight: '12px', whiteSpace: 'nowrap' }}>
                  <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
                  Chọn ngày điểm danh:
                </label>
                <input 
                  type="date" 
                  className="form-input date-input-field" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ width: 'auto' }}
                />
              </div>

              {sessions.length > 0 && (
                <div className="session-select-section" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  <label className="form-label" style={{ marginBottom: 0, marginRight: '12px', whiteSpace: 'nowrap' }}>
                    <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
                    Chọn buổi theo lịch học:
                  </label>
                  <select 
                    className="form-input select-input"
                    value={sessions.some(s => s.date === attendanceDate) ? sessions.find(s => s.date === attendanceDate)?.id : ''}
                    onChange={(e) => {
                      const selectedSessId = e.target.value;
                      if (selectedSessId) {
                        const sess = sessions.find(s => s.id === selectedSessId);
                        if (sess) {
                          setAttendanceDate(sess.date);
                        }
                      }
                    }}
                    style={{ margin: 0 }}
                  >
                    <option value="">-- Chọn buổi học từ lịch --</option>
                    {sessions.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Buổi {idx + 1} ({s.date} - {s.time})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <p className="attendance-info-text" style={{ margin: 0 }}>
              Bạn đang thực hiện điểm danh cho lớp <strong>{cls.name}</strong> ngày <strong>{attendanceDate}</strong>
              {sessions.find(s => s.date === attendanceDate) && (
                <>
                  {' '}(Giờ học: <strong>{sessions.find(s => s.date === attendanceDate)?.time}</strong>)
                </>
              )}. 
              Mặc định khi mở form, hệ thống sẽ chọn sẵn &quot;Có mặt&quot; cho tất cả học sinh.
            </p>
          </div>

          {students.length === 0 ? (
            <div className="card empty-state-inner" style={{ marginTop: '20px' }}>
              <Users size={40} className="empty-icon" />
              <h4>Lớp học trống</h4>
              <p>Vui lòng thêm học sinh vào lớp học trước khi thực hiện điểm danh.</p>
            </div>
          ) : (
            <div className="attendance-form-wrapper">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Họ tên học sinh</th>
                      <th style={{ width: '45%', textAlign: 'center' }}>Trạng thái đi học</th>
                      <th style={{ width: '30%' }}>Ghi chú nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std) => {
                      const record = attendanceRecords[std.id] || { status: 'present', note: '' };
                      return (
                        <tr key={std.id}>
                          <td>
                            <strong className="student-name-cell">{std.name}</strong>
                          </td>
                          <td>
                            <div className="attendance-buttons-group">
                              <button
                                type="button"
                                className={`att-choice-btn present ${record.status === 'present' ? 'active' : ''}`}
                                onClick={() => handleStatusChange(std.id, 'present')}
                              >
                                Có mặt
                              </button>
                              <button
                                type="button"
                                className={`att-choice-btn late ${record.status === 'late' ? 'active' : ''}`}
                                onClick={() => handleStatusChange(std.id, 'late')}
                              >
                                Đi muộn
                              </button>
                              <button
                                type="button"
                                className={`att-choice-btn absent-excused ${record.status === 'absent_excused' ? 'active' : ''}`}
                                onClick={() => handleStatusChange(std.id, 'absent_excused')}
                              >
                                Vắng phép
                              </button>
                              <button
                                type="button"
                                className={`att-choice-btn absent-unexcused ${record.status === 'absent_unexcused' ? 'active' : ''}`}
                                onClick={() => handleStatusChange(std.id, 'absent_unexcused')}
                              >
                                Không phép
                              </button>
                            </div>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-input form-input-sm" 
                              placeholder="Ghi chú (ví dụ: Muộn 15p...)"
                              value={record.note}
                              onChange={(e) => handleNoteChange(std.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="attendance-submit-section">
                <button className="btn btn-primary" onClick={handleSaveAttendance}>
                  <Save size={16} />
                  <span>Lưu Điểm Danh</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Class Schedule */}
      {activeTab === 'schedule' && (
        <div className="tab-content">
          <div className="card schedule-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Lịch học của lớp</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Lên lịch các buổi dạy để tiến hành điểm danh nhanh và theo dõi tiến độ bài học.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddSessionModalOpen(true)}>
              <Plus size={16} />
              <span>Thêm buổi học mới</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="card empty-state-inner">
              <Calendar size={40} className="empty-icon" />
              <h4>Chưa có lịch học cho lớp này</h4>
              <p>Hãy thêm các buổi học (ngày, giờ) để bắt đầu quản lý.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddSessionModalOpen(true)}>
                Tạo buổi học đầu tiên
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Buổi học</th>
                    <th>Ngày học</th>
                    <th>Thời gian</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess, idx) => (
                    <tr key={sess.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>Buổi {idx + 1}</strong>
                      </td>
                      <td>
                        <span>{sess.date}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          {sess.time}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setAttendanceDate(sess.date);
                              setActiveTab('attendance');
                            }}
                            style={{ gap: '4px' }}
                            title="Điểm danh cho buổi học này"
                          >
                            <Check size={14} />
                            <span>Điểm danh</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm delete-btn-table"
                            onClick={() => handleDeleteSession(sess.id)}
                            style={{ gap: '4px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Xóa buổi học"
                          >
                            <Trash2 size={14} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Homework Tasks (Todo list) */}
      {activeTab === 'tasks' && (
        <div className="tab-content">
          <div className="card schedule-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Nhiệm vụ &amp; Bài tập về nhà</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Giao bài tập về nhà cho lớp. Nhiệm vụ sẽ tự động hoàn thành khi 100% học sinh trong lớp nộp bài.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddTaskModalOpen(true)}>
              <Plus size={16} />
              <span>Thêm nhiệm vụ</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="card empty-state-inner">
              <CheckSquare size={40} className="empty-icon" />
              <h4>Chưa giao nhiệm vụ nào</h4>
              <p>Thêm nhiệm vụ mới để bắt đầu giao bài tập về nhà cho học sinh.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddTaskModalOpen(true)}>
                Giao nhiệm vụ đầu tiên
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map((task) => {
                const isCompleted = students.length > 0 && students.every(s => task.submissions.includes(s.id));
                const submissionCount = students.filter(s => task.submissions.includes(s.id)).length;
                const isExpanded = expandedTaskId === task.id;

                return (
                  <div key={task.id} className="card task-item-card glass" style={{ padding: '16px 20px', transition: 'all 0.2s ease', borderLeft: isCompleted ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div 
                        style={{ cursor: 'pointer', flex: 1 }} 
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      >
                        <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {task.title}
                          {isCompleted ? (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Hoàn thành</span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Đang thực hiện ({submissionCount}/{students.length})</span>
                          )}
                        </h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Hạn nộp: <strong>{task.dueDate}</strong> • Click để {isExpanded ? 'thu gọn' : 'xem chi tiết nộp bài'}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        >
                          {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm delete-btn-table" 
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        <h6 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-muted)' }}>
                          Danh sách nộp bài tập về nhà:
                        </h6>
                        {students.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Lớp học chưa có học viên nào.</p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                            {students.map((std) => {
                              const hasSubmitted = task.submissions.includes(std.id);
                              return (
                                <label 
                                  key={std.id} 
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', border: hasSubmitted ? '1px solid var(--success)' : '1px solid var(--border)' }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={hasSubmitted}
                                    onChange={() => handleToggleSubmission(task.id, std.id)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--success)' }}
                                  />
                                  <span style={{ fontSize: '0.85rem', fontWeight: hasSubmitted ? 600 : 400 }}>{std.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Student Evaluations */}
      {activeTab === 'evaluations' && (
        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Rules alert message */}
          <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Award size={22} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Quy tắc cộng trừ điểm thi đua (Điểm gốc: 10)</strong>
              <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Cộng điểm (+):</span>
                  <ul style={{ paddingLeft: '14px', marginTop: '2px' }}>
                    {pointRules.filter(r => r.type === 'plus').map(r => (
                      <li key={r.id}>{r.name} (+{r.points})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Trừ điểm (-):</span>
                  <ul style={{ paddingLeft: '14px', marginTop: '2px' }}>
                    {pointRules.filter(r => r.type === 'minus').map(r => (
                      <li key={r.id}>{r.name} (-{r.points})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Session Selector & Save button */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
                  Đánh giá theo buổi học:
                </label>
                {sessions.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Cần thêm lịch học trước</span>
                ) : (
                  <select 
                    className="form-input select-input"
                    value={selectedEvaluationSessionId}
                    onChange={(e) => setSelectedEvaluationSessionId(e.target.value)}
                    style={{ margin: 0 }}
                  >
                    {sessions.map((sess, idx) => (
                      <option key={sess.id} value={sess.id}>
                        Buổi {idx + 1} - Ngày {sess.date} ({sess.time})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleSaveEvaluations}
                disabled={sessions.length === 0}
                style={{ gap: '6px' }}
              >
                <Save size={16} />
                <span>Lưu Đánh Giá Buổi Này</span>
              </button>
            </div>

            {sessions.length > 0 && students.length > 0 && (
              <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Học sinh</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Điểm buổi</th>
                      <th style={{ width: '35%' }}>Quy tắc áp dụng</th>
                      <th style={{ width: '25%' }}>Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std) => {
                      const record = evaluationRecords[std.id] || { plusPoints: 0, minusPoints: 0, checkedRules: [], comment: '' };
                      const currentScore = Math.max(0, 10 + record.plusPoints - record.minusPoints);
                      const checkedRulesList = record.checkedRules || [];

                      return (
                        <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEvaluationDialog(std)}>
                          <td>
                            <strong className="student-name-cell text-primary" style={{ borderBottom: '1px dashed var(--primary)' }}>{std.name}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <strong style={{ fontSize: '1.1rem', color: currentScore >= 8 ? 'var(--success)' : currentScore >= 6.5 ? 'var(--primary)' : 'var(--danger)' }}>{currentScore}/10</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {checkedRulesList.length === 0 ? (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa tích chọn (Click để đánh giá)</span>
                              ) : (
                                checkedRulesList.map(rId => {
                                  const rule = pointRules.find(r => r.id === rId);
                                  if (!rule) return null;
                                  const isPlus = rule.type === 'plus';
                                  return (
                                    <span 
                                      key={rId} 
                                      className="badge" 
                                      style={{ 
                                        fontSize: '0.7rem', 
                                        padding: '2px 6px', 
                                        backgroundColor: isPlus ? 'var(--success-light)' : 'var(--danger-light)', 
                                        color: isPlus ? 'var(--success)' : 'var(--danger)',
                                        borderRadius: '8px'
                                      }}
                                    >
                                      {isPlus ? '+' : '-'}{rule.points} {rule.name}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.9rem', color: record.comment ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {record.comment || 'Không có nhận xét'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cumulative Leaderboard / Rankings */}
          <div className="card">
            <div className="card-header-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Trophy className="text-warning" size={20} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Bảng Tổng Kết Điểm Tích Lũy &amp; Xếp Loại Học Viên</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Điểm trung bình được tính dựa trên điểm đánh giá các buổi học đã qua. Đây là cơ sở để xếp loại thi đua tuần/tháng.
            </p>

            {students.length === 0 ? (
              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Chưa có học sinh nào.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th>Số buổi học đã đánh giá</th>
                      <th style={{ textAlign: 'center' }}>Điểm trung bình tích lũy</th>
                      <th style={{ textAlign: 'right' }}>Xếp loại thi đua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std) => {
                      const { average, ranking, labelClass } = getStudentAverageAndRanking(std.id);
                      const evalCount = classEvaluations.filter(e => e.studentId === std.id).length;

                      return (
                        <tr key={std.id}>
                          <td>
                            <strong>{std.name}</strong>
                          </td>
                          <td>
                            <span>{evalCount} buổi</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{average} / 10</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`badge ${labelClass}`}>{ranking}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal (2 Options Tabs) */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-student-modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Thêm Học Sinh Vào Lớp</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="modal-tabs-header">
              <button 
                type="button"
                className={`modal-tab-btn ${addModalTab === 'existing' ? 'active' : ''}`}
                onClick={() => setAddModalTab('existing')}
              >
                Học sinh hiện có ở trung tâm
              </button>
              <button 
                type="button"
                className={`modal-tab-btn ${addModalTab === 'new' ? 'active' : ''}`}
                onClick={() => setAddModalTab('new')}
              >
                Đăng ký học sinh mới
              </button>
            </div>

            {/* Modal Case 1: Existing student roster */}
            {addModalTab === 'existing' && (
              <form onSubmit={handleEnrollExisting}>
                <div className="form-group">
                  <label className="form-label">Chọn học sinh cần thêm</label>
                  {eligibleExistingStudents.length === 0 ? (
                    <div className="alert alert-info" style={{ marginTop: '8px', marginBottom: 0 }}>
                      Tất cả học sinh của trung tâm đã tham gia lớp học này. Không còn học sinh nào khác.
                    </div>
                  ) : (
                    <select 
                      className="form-input select-input"
                      value={selectedExistingStudentId}
                      onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn học sinh từ danh sách --</option>
                      {eligibleExistingStudents.map(std => (
                        <option key={std.id} value={std.id}>
                          {std.name} - Khối {std.grade} (PH: {std.parentName} - {std.parentPhone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày nhập học vào lớp</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={enrollDate}
                    onChange={(e) => setEnrollDate(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={eligibleExistingStudents.length === 0}
                  >
                    <UserPlus size={16} />
                    <span>Thêm vào lớp</span>
                  </button>
                </div>
              </form>
            )}

            {/* Modal Case 2: Register & enroll new student */}
            {addModalTab === 'new' && (
              <form onSubmit={handleEnrollNew}>
                <div className="form-group">
                  <label className="form-label">Họ và Tên học sinh</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ví dụ: Nguyễn Thị Diệp"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-inputs">
                  <div className="form-group">
                    <label className="form-label">Khối lớp</label>
                    <select 
                      className="form-input select-input"
                      value={newStudentGrade}
                      onChange={(e) => setNewStudentGrade(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={g}>Khối {g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại phụ huynh</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Ví dụ: 0987654321"
                      value={newStudentParentPhone}
                      onChange={(e) => setNewStudentParentPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tên phụ huynh (Bố/Mẹ)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    value={newStudentParentName}
                    onChange={(e) => setNewStudentParentName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày nhập học vào lớp</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={enrollDate}
                    onChange={(e) => setEnrollDate(e.target.value)}
                    required
                  />
                </div>

                <div className="alert alert-info">
                  Thực hiện thao tác này sẽ tự động tạo hồ sơ học sinh mới trong danh bạ trung tâm và trực tiếp ghi danh em vào lớp <strong>{cls.name}</strong>.
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <UserPlus size={16} />
                    <span>Đăng ký &amp; Thêm lớp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudentForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Thông Tin Chi Tiết Học Sinh</h3>
              <button className="modal-close" onClick={() => setSelectedStudentForDetail(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="student-detail-modal-body">
              <div className="detail-item-row">
                <span className="label">Họ và tên:</span>
                <span className="value">{selectedStudentForDetail.name}</span>
              </div>
              <div className="detail-item-row">
                <span className="label">Khối lớp:</span>
                <span className="value">Khối {selectedStudentForDetail.grade}</span>
              </div>
              <div className="detail-item-row">
                <span className="label">Họ tên phụ huynh:</span>
                <span className="value">{selectedStudentForDetail.parentName}</span>
              </div>
              <div className="detail-item-row">
                <span className="label">SĐT phụ huynh:</span>
                <span className="value">
                  <a href={`tel:${selectedStudentForDetail.parentPhone}`} className="text-primary" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    {selectedStudentForDetail.parentPhone}
                  </a>
                </span>
              </div>
              <div className="detail-item-row">
                <span className="label">Ngày nhập học:</span>
                <span className="value">{selectedStudentForDetail.joinedDate}</span>
              </div>
              
              <div className="student-detail-classes-section" style={{ marginTop: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', fontWeight: 600 }}>Các lớp học đang tham gia:</label>
                {getClassesForStudent(selectedStudentForDetail.id).length === 0 ? (
                  <p className="no-class-text" style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa học lớp nào.</p>
                ) : (
                  <div className="classes-tags-list" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {getClassesForStudent(selectedStudentForDetail.id).map(c => (
                      <span key={c.id} className="badge badge-info" style={{ fontSize: '0.75rem' }}>{c.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="btn btn-primary btn-block" onClick={() => setSelectedStudentForDetail(null)}>
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {isAddSessionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Thêm Buổi Học Mới</h3>
              <button className="modal-close" onClick={() => setIsAddSessionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSession}>
              <div className="form-group">
                <label className="form-label">Ngày học</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thời gian học (Ví dụ: 18:00 - 20:00)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: 18:00 - 20:00"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 8px 0' }}>
                <input 
                  type="checkbox" 
                  id="isRecurringCheckbox" 
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="isRecurringCheckbox" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', margin: 0 }}>
                  Lặp lại hàng tuần (Tạo nhiều buổi học)
                </label>
              </div>

              {isRecurring && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Số tuần lặp lại</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="1" 
                    max="24"
                    value={recurringWeeks}
                    onChange={(e) => setRecurringWeeks(Math.max(1, Math.min(24, Number(e.target.value))))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Hệ thống sẽ tự động tạo {recurringWeeks} buổi học tiếp theo vào cùng khung giờ này, cách nhau 7 ngày.
                  </span>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddSessionModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Thêm buổi học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Giao Nhiệm Vụ / Bài Tập Mới</h3>
              <button className="modal-close" onClick={() => setIsAddTaskModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label className="form-label">Tên nhiệm vụ / Bài tập</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Bài tập về nhà hàm số lũy thừa (Buổi 1)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hạn nộp</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTaskModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Thêm nhiệm vụ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditClassModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Chỉnh Sửa Thông Tin Lớp Học</h3>
              <button className="modal-close" onClick={() => setIsEditClassModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClassEdit}>
              <div className="form-group">
                <label className="form-label">Tên lớp học</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Môn học</label>
                <select 
                  className="form-input select-input" 
                  value={editClassSubject}
                  onChange={(e) => setEditClassSubject(e.target.value)}
                  required
                >
                  <option value="Toán">Toán</option>
                  <option value="Vật lí">Vật lí</option>
                  <option value="KHTN">KHTN</option>
                </select>
              </div>

              <div className="grid-inputs">
                <div className="form-group">
                  <label className="form-label">Khối lớp</label>
                  <select 
                    className="form-input select-input" 
                    value={editClassGrade}
                    onChange={(e) => setEditClassGrade(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Học phí tháng (VND)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editClassTuition}
                    onChange={(e) => setEditClassTuition(Number(e.target.value))}
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditClassModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Generation Modal (New Integrated Feature!) */}
      {selectedStudentForQR && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForQR(null)}>
          <div className="modal-content add-student-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Gửi Báo Cáo Học Tập &amp; Học Phí</h3>
              <button className="modal-close" onClick={() => setSelectedStudentForQR(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-tabs-header" style={{ marginBottom: '16px' }}>
              <div style={{ padding: '8px 10px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Học sinh: {selectedStudentForQR.name} - Khối {selectedStudentForQR.grade} (PH: {selectedStudentForQR.parentName})
              </div>
            </div>

            <div className="qr-integrated-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Form & link */}
              <div className="qr-modal-form-side" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <form onSubmit={handleSaveQRNote}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Lời nhắn / Nhận xét gửi phụ huynh</label>
                    <div className="textarea-wrapper" style={{ position: 'relative' }}>
                      <MessageSquare size={16} className="textarea-icon" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                      <textarea
                        className="form-input form-textarea"
                        rows={4}
                        placeholder="Nhập nhận xét của giáo viên (ví dụ: Học tốt, đi học đầy đủ...)"
                        value={qrTeacherNote}
                        onChange={(e) => setQrTeacherNote(e.target.value)}
                        style={{ paddingLeft: '38px', fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-sm btn-block" style={{ gap: '4px' }}>
                    <Save size={12} />
                    <span>Lưu lời nhắn</span>
                  </button>
                </form>

                <div className="action-preview-card" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sao chép liên kết báo cáo</label>
                  <div className="link-copy-row" style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <input 
                      type="text" 
                      className="form-input readonly-input" 
                      value={reportLink} 
                      readOnly 
                      style={{ fontSize: '0.75rem', padding: '6px' }}
                    />
                    <button className="btn btn-secondary btn-icon-only" onClick={() => handleCopyLink(reportLink)} title="Sao chép" style={{ padding: '6px' }}>
                      <Copy size={12} />
                    </button>
                    <a href={reportLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-icon-only" title="Mở báo cáo" style={{ padding: '6px' }}>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button className="btn btn-secondary btn-sm btn-block" onClick={handlePrint} style={{ gap: '4px' }}>
                      <Printer size={12} />
                      <span>In phiếu thông báo A4</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Preview slip */}
              <div className="qr-modal-preview-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-input)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={qrCodeUrl} 
                  alt="Mã QR Sổ Liên Lạc" 
                  style={{ width: '130px', height: '130px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px', backgroundColor: '#ffffff', objectFit: 'contain' }}
                />
                <span className="scan-guide-text" style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-main)' }}>Mã QR Sổ Liên Lạc</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', lineHeight: 1.3 }}>
                  Phụ huynh quét mã này để tra cứu tình hình chuyên cần, điểm danh và học phí nợ của con.
                </p>
              </div>
            </div>

            {/* Printable slip hidden in HTML rendering, only visible during window.print() */}
            <div className="printable-slip card" id="print-area" style={{ display: 'none' }}>
              <div className="slip-border-container">
                <div className="slip-header">
                  <h2>PHIẾU LIÊN LẠC HỌC TẬP</h2>
                  <span className="slip-brand">Hệ thống Đào tạo LÊ KHÁNH LOAN</span>
                  <div className="divider-line"></div>
                </div>

                <div className="slip-body">
                  <div className="slip-student-info">
                    <div className="info-row">
                      <span className="label">Học sinh:</span>
                      <strong className="value">{selectedStudentForQR.name}</strong>
                    </div>
                    <div className="info-row">
                      <span className="label">Khối lớp:</span>
                      <span className="value">Khối {selectedStudentForQR.grade}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phụ huynh:</span>
                      <span className="value">{selectedStudentForQR.parentName}</span>
                    </div>
                  </div>

                  <div className="slip-feedback">
                    <h5>Nhận xét của Giáo viên:</h5>
                    <p className="feedback-text">
                      {qrTeacherNote ? qrTeacherNote : 'Chưa có nhận xét riêng cho tháng này.'}
                    </p>
                  </div>

                  <div className="slip-qr-box">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCodeUrl} 
                      alt="Mã QR Báo Cáo Phụ Huynh" 
                      className="print-qr-code-img"
                    />
                    <span className="scan-guide-text">Phụ huynh quét mã QR để tra cứu:</span>
                    <ul className="guide-points">
                      <li>Lịch sử điểm danh &amp; chuyên cần</li>
                      <li>Thông báo đóng học phí tháng</li>
                      <li>Trạng thái thanh toán của học sinh</li>
                    </ul>
                  </div>
                </div>

                <div className="slip-footer">
                  <p>Mọi thắc mắc xin liên hệ Hotline trung tâm để được giải quyết nhanh nhất.</p>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setSelectedStudentForQR(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Đánh giá chi tiết học viên */}
      {selectedStudentForEval && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForEval(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ĐÁNH GIÁ: {selectedStudentForEval.name.toUpperCase()}
              </h3>
              <button className="modal-close" onClick={() => setSelectedStudentForEval(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
              
              {/* Point rules grid split into plus and minus */}
              <div className="rules-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Plus Rules Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)', borderBottom: '1px solid var(--success-light)', paddingBottom: '6px', marginBottom: '8px' }}>
                    Điểm cộng (+)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {pointRules.filter(r => r.type === 'plus').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có quy tắc cộng</p>
                    ) : (
                      pointRules.filter(r => r.type === 'plus').map(rule => {
                        const isChecked = evalDialogCheckedRules.includes(rule.id);
                        return (
                          <label 
                            key={rule.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '8px', 
                              padding: '8px 10px', 
                              background: isChecked ? 'var(--success-light)' : 'var(--bg-input)', 
                              border: isChecked ? '1px solid var(--success)' : '1px solid var(--border)',
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleToggleRuleInDialog(rule.id)}
                              style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--success)' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 600 : 400, flex: 1, color: isChecked ? 'var(--text-main)' : 'inherit' }}>
                              {rule.name}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                              +{rule.points}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Minus Rules Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--danger)', borderBottom: '1px solid var(--danger-light)', paddingBottom: '6px', marginBottom: '8px' }}>
                    Điểm trừ (-)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {pointRules.filter(r => r.type === 'minus').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có quy tắc trừ</p>
                    ) : (
                      pointRules.filter(r => r.type === 'minus').map(rule => {
                        const isChecked = evalDialogCheckedRules.includes(rule.id);
                        return (
                          <label 
                            key={rule.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '8px', 
                              padding: '8px 10px', 
                              background: isChecked ? 'var(--danger-light)' : 'var(--bg-input)', 
                              border: isChecked ? '1px solid var(--danger)' : '1px solid var(--border)',
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleToggleRuleInDialog(rule.id)}
                              style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--danger)' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 600 : 400, flex: 1, color: isChecked ? 'var(--text-main)' : 'inherit' }}>
                              {rule.name}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                              -{rule.points}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Score calculator & Comment section */}
              <div className="eval-result-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Điểm đánh giá buổi học:</span>
                  {(() => {
                    const { plus, minus } = getPointsFromCheckedRules(evalDialogCheckedRules);
                    const finalScore = Math.max(0, 10 + plus - minus);
                    return (
                      <strong style={{ fontSize: '1.4rem', color: finalScore >= 8 ? 'var(--success)' : finalScore >= 6.5 ? 'var(--primary)' : 'var(--danger)' }}>
                        {finalScore} / 10
                      </strong>
                    );
                  })()}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nhận xét chi tiết</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Nhập nhận xét cụ thể về tình hình học tập và thái độ của học sinh..."
                    value={evalDialogComment}
                    onChange={(e) => setEvalDialogComment(e.target.value)}
                    style={{ fontSize: '0.9rem', width: '100%', resize: 'none' }}
                  />
                </div>
              </div>

            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedStudentForEval(null)}>
                Hủy bỏ
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveDialogEvaluation}>
                <Check size={16} />
                <span>Cập nhật đánh giá</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Print Stylesheet injected inline */}
      <style>{`
        @media print {
          /* Hide everything on screen */
          body * {
            visibility: hidden;
            background: #ffffff !important;
            color: #000000 !important;
          }
          
          /* Only show print area slip */
          #print-area, #print-area * {
            visibility: visible;
          }
          
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .slip-border-container {
            border: 2px solid #000000 !important;
          }

          .feedback-text {
            background-color: #ffffff !important;
            border: 1px solid #000000 !important;
          }

          .slip-student-info {
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
          }
          
          /* Resets layout padding on print */
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
