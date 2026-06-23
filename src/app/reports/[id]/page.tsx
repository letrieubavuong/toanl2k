'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  CreditCard, 
  MessageSquare,
  Phone,
  QrCode,
  DollarSign,
  CheckSquare,
  Star,
  Award,
  Trophy
} from 'lucide-react';
import { 
  getStudents, 
  getClassesForStudent, 
  getPayments, 
  getAttendanceForClass, 
  getBankSettings, 
  getTasksForClass,
  getEvaluationsForClass,
  calculateTuitionForMonth,
  getDB, 
  Student, 
  Class, 
  TuitionPayment, 
  Attendance,
  ClassTask,
  StudentEvaluation
} from '@/lib/db';

export default function ParentReportPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  
  // Dynamic Bank Settings state
  const [bankSettings, setBankSettings] = useState({
    bankId: 'MB',
    accountNo: '0987654321',
    accountName: 'TRUNG TAM LE KHANH LOAN'
  });
  
  const [dbState, setDbState] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const db = getDB();
    setDbState(db);

    const std = db.students.find(s => s.id === studentId) || null;
    setStudent(std);

    if (std) {
      const classes = getClassesForStudent(studentId);
      setEnrolledClasses(classes);
      setPayments(db.payments.filter(p => p.studentId === studentId));
      setAttendance(db.attendance.filter(a => a.studentId === studentId));
      
      // Fetch dynamic bank settings
      setBankSettings(getBankSettings());

      // Fetch tasks and evaluations for student's classes
      const studentClassIds = classes.map(c => c.id);
      const studentTasks: ClassTask[] = [];
      const studentEvals: StudentEvaluation[] = [];

      studentClassIds.forEach(classId => {
        studentTasks.push(...getTasksForClass(classId));
        studentEvals.push(...db.evaluations.filter(e => e.classId === classId && e.studentId === studentId));
      });

      setTasks(studentTasks);
      setEvaluations(studentEvals);
    }
  }, [studentId]);

  if (!mounted) {
    return <div className="loading-state">Đang tải báo cáo học tập...</div>;
  }

  if (!student || !dbState) {
    return (
      <div className="report-error-container">
        <div className="error-card card">
          <AlertCircle size={48} className="error-icon" />
          <h3>Không tìm thấy dữ liệu học viên</h3>
          <p>Mã liên kết báo cáo không tồn tại hoặc đã hết hạn. Vui lòng liên hệ với trung tâm để nhận liên kết mới.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100)
    : 100;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const excusedCount = attendance.filter(a => a.status === 'absent_excused').length;
  const unexcusedCount = attendance.filter(a => a.status === 'absent_unexcused').length;

  const totalPaid = payments.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalDue = payments.reduce((acc, curr) => acc + curr.totalDue, 0);
  const outstandingDebt = totalDue - totalPaid;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getClassName = (classId: string) => {
    return enrolledClasses.find(c => c.id === classId)?.name || 'Lớp học';
  };

  const getCumulativeRanking = () => {
    if (evaluations.length === 0) {
      return { average: 10, ranking: 'Tốt', labelClass: 'badge-secondary' };
    }

    const totalScores = evaluations.reduce((acc, curr) => {
      const score = Math.max(0, 10 + curr.plusPoints - curr.minusPoints);
      return acc + score;
    }, 0);

    const average = Math.round((totalScores / evaluations.length) * 10) / 10;
    
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

  // Generate VietQR URL dynamically based on settings
  const memoText = `Dong hoc phi LE KHANH LOAN ${student.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')}`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankSettings.bankId}-${bankSettings.accountNo}-compact2.png?amount=${outstandingDebt}&addInfo=${encodeURIComponent(memoText)}&accountName=${encodeURIComponent(bankSettings.accountName)}`;

  return (
    <div className="report-portal-wrapper">
      {/* Mobile-first Header Banner */}
      <div className="portal-header glass">
        <GraduationCap size={32} className="header-logo" />
        <div className="header-info">
          <h1>Sổ Liên Lạc Điện Tử</h1>
          <p>Hệ thống Báo cáo Học tập &amp; Học phí LÊ KHÁNH LOAN</p>
        </div>
      </div>

      <div className="portal-body">
        {/* Student General Profile */}
        <section className="card profile-card glass">
          <div className="portal-avatar">
            {student.name.split(' ').pop()?.substring(0, 2)}
          </div>
          <div className="portal-profile-details">
            <h2>{student.name}</h2>
            <div className="profile-meta-grid">
              <span className="meta-item">Khối lớp: <strong>Khối {student.grade}</strong></span>
              <span className="meta-item">Phụ huynh: <strong>{student.parentName}</strong></span>
              <span className="meta-item">SĐT liên hệ: <strong>{student.parentPhone}</strong></span>
            </div>
          </div>
        </section>

        {/* Live Teacher Note */}
        {student.teacherNote && (
          <section className="card feedback-card highlight-card">
            <div className="card-header-inner">
              <MessageSquare size={20} className="icon-blue" />
              <h3>Nhận xét từ giáo viên chủ nhiệm</h3>
            </div>
            <div className="feedback-content">
              <p>&quot;{student.teacherNote}&quot;</p>
            </div>
          </section>
        )}

        {/* Attendance Summary */}
        <section className="card attendance-summary-card">
          <div className="card-header-inner">
            <Calendar size={20} className="icon-violet" />
            <h3>Chuyên Cần &amp; Đi Học</h3>
            <span className="badge badge-success right-badge">{attendanceRate}% Đi học</span>
          </div>

          <div className="attendance-grid-metrics">
            <div className="metric-box success">
              <span className="num">{presentCount}</span>
              <span className="lbl">Đúng giờ</span>
            </div>
            <div className="metric-box warning">
              <span className="num">{lateCount}</span>
              <span className="lbl">Đi muộn</span>
            </div>
            <div className="metric-box info">
              <span className="num">{excusedCount}</span>
              <span className="lbl">Vắng phép</span>
            </div>
            <div className="metric-box danger">
              <span className="num">{unexcusedCount}</span>
              <span className="lbl">Không phép</span>
            </div>
          </div>

          {attendance.length === 0 ? (
            <p className="empty-section-text">Chưa có ghi nhận điểm danh.</p>
          ) : (
            <div className="attendance-timeline">
              <h4 className="timeline-title">Lịch sử điểm danh chi tiết</h4>
              <div className="timeline-items-list">
                {[...attendance]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(att => {
                    let statusIcon = <CheckCircle className="timeline-icon text-success" size={16} />;
                    let statusLabel = 'Đi học đúng giờ';
                    let itemClass = 'present';

                    if (att.status === 'late') {
                      statusIcon = <Clock className="timeline-icon text-warning" size={16} />;
                      statusLabel = 'Đi học muộn';
                      itemClass = 'late';
                    } else if (att.status === 'absent_excused') {
                      statusIcon = <CheckCircle className="timeline-icon text-info" size={16} />;
                      statusLabel = 'Vắng mặt (Có phép)';
                      itemClass = 'absent-excused';
                    } else if (att.status === 'absent_unexcused') {
                      statusIcon = <XCircle className="timeline-icon text-danger" size={16} />;
                      statusLabel = 'Vắng mặt (Không phép)';
                      itemClass = 'absent-unexcused';
                    }

                    return (
                      <div className={`timeline-item ${itemClass}`} key={att.id}>
                        {statusIcon}
                        <div className="timeline-details">
                          <div className="timeline-header-row">
                            <span className="time-date">{att.date}</span>
                            <span className="class-name">{getClassName(att.classId)}</span>
                          </div>
                          <span className="status-desc">
                            {statusLabel} {att.note ? `• Ghi chú: ${att.note}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </section>

        {/* Homework Tasks Section */}
        <section className="card tasks-summary-card">
          <div className="card-header-inner">
            <CheckSquare size={20} className="icon-blue" />
            <h3>Nhiệm Vụ &amp; Bài Tập Về Nhà</h3>
          </div>

          {tasks.length === 0 ? (
            <p className="empty-section-text">Chưa có nhiệm vụ học tập nào được giao.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {tasks.map(task => {
                const hasSubmitted = task.submissions.includes(studentId);
                return (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{task.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Hạn nộp: {task.dueDate} • Lớp: {getClassName(task.classId)}
                      </div>
                    </div>
                    {hasSubmitted ? (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Đã nộp bài</span>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Chưa nộp bài</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Student Evaluations & Rankings Section */}
        <section className="card evaluations-summary-card">
          <div className="card-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} className="icon-warning" />
              <h3>Đánh Giá Học Tập &amp; Thi Đua</h3>
            </div>
            {evaluations.length > 0 && (
              <span className={`badge ${getCumulativeRanking().labelClass}`}>
                Xếp loại: {getCumulativeRanking().ranking}
              </span>
            )}
          </div>

          {evaluations.length === 0 ? (
            <p className="empty-section-text" style={{ marginTop: '10px' }}>Chưa có đánh giá học tập nào cho các buổi học.</p>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {/* Score Cumulative banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-light)', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  Điểm tích lũy trung bình ({evaluations.length} buổi):
                </span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                  {getCumulativeRanking().average} / 10
                </strong>
              </div>

              <h4 className="timeline-title" style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
                Nhận xét thi đua chi tiết theo buổi học:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...evaluations]
                  .sort((a, b) => b.id.localeCompare(a.id)) // show newest first
                  .map((evalItem, idx) => {
                    const sessionScore = Math.max(0, 10 + evalItem.plusPoints - evalItem.minusPoints);
                    // Find session date
                    const session = dbState.sessions.find((s: any) => s.id === evalItem.sessionId);
                    const sessionDate = session ? session.date : '';

                    return (
                      <div key={evalItem.id} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Buổi học ngày {sessionDate || '(Chưa rõ)'}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {sessionScore} / 10 điểm
                          </span>
                        </div>

                        {/* Hiển thị chi tiết các quy tắc điểm đã áp dụng */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                          {evalItem.checkedRules && evalItem.checkedRules.length > 0 ? (
                            evalItem.checkedRules.map(rId => {
                              const rule = dbState.pointRules?.find((r: any) => r.id === rId);
                              if (!rule) return null;
                              const isPlus = rule.type === 'plus';
                              return (
                                <div key={rId} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                  <span 
                                    style={{ 
                                      display: 'inline-block',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: isPlus ? 'var(--success)' : 'var(--danger)'
                                    }}
                                  />
                                  <span style={{ color: isPlus ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                    {isPlus ? '+' : '-'}{rule.points} điểm:
                                  </span>
                                  <span style={{ color: 'var(--text-main)' }}>{rule.name}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              {evalItem.plusPoints > 0 && (
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                  + Thưởng: +{evalItem.plusPoints} điểm
                                </span>
                              )}
                              {evalItem.minusPoints > 0 && (
                                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                  - Phạt: -{evalItem.minusPoints} điểm
                                </span>
                              )}
                              {evalItem.plusPoints === 0 && evalItem.minusPoints === 0 && (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Không tăng giảm điểm thi đua
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', margin: 0 }}>
                          &quot;{evalItem.comment || 'Học sinh tập trung học tập.'}&quot;
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </section>

        {/* Tuition & Payment */}
        <section className="card tuition-card">
          <div className="card-header-inner">
            <CreditCard size={20} className="icon-green" />
            <h3>Tình Hình Học Phí</h3>
            {outstandingDebt === 0 ? (
              <span className="badge badge-success right-badge">Đã hoàn tất học phí</span>
            ) : (
              <span className="badge badge-danger right-badge">Còn nợ phí</span>
            )}
          </div>

          <div className="tuition-status-summary">
            <div className="tuition-stat">
              <span className="lbl">Tổng cộng phải đóng:</span>
              <span className="val">{formatVND(totalDue)}</span>
            </div>
            <div className="tuition-stat">
              <span className="lbl">Số tiền đã đóng:</span>
              <span className="val text-success">{formatVND(totalPaid)}</span>
            </div>
            <div className="tuition-stat total-debt-row">
              <span className="lbl">Số tiền còn nợ:</span>
              <span className="val text-danger">{formatVND(outstandingDebt)}</span>
            </div>
          </div>

          {/* Quỹ buổi học dư tích luỹ của học viên */}
          <div className="card-header-inner" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <Award size={18} className="icon-warning" style={{ color: 'var(--warning)' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Quỹ buổi học dư tích lũy (Bù trừ vắng học)</h4>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Quỹ buổi dư tích luỹ khi lịch học tháng thực tế vượt quá định mức 12 buổi chuẩn. Buổi dư dùng để tự động bù đắp các buổi học sinh nghỉ mà không làm giảm học phí đóng hàng tháng.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {enrolledClasses.map(c => {
              const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
              const calc = calculateTuitionForMonth(student.id, c.id, currentMonth);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <strong style={{ color: 'var(--primary)' }}>{calc.newBalance} buổi dư</strong>
                </div>
              );
            })}
          </div>

          {/* VietQR integration when debt > 0 */}
          {outstandingDebt > 0 && (
            <div className="vietqr-payment-box glass">
              <div className="vietqr-header">
                <QrCode size={18} className="text-primary" />
                <h4>Thanh toán học phí nhanh qua VietQR</h4>
              </div>
              <p className="vietqr-desc">
                Quét mã QR dưới đây bằng app Ngân hàng (Mobile Banking) bất kỳ để tự động thanh toán học phí chính xác số tiền và nội dung chuyển khoản.
              </p>
              
              <div className="vietqr-display-row">
                <div className="qr-image-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={vietQrUrl} 
                    alt="VietQR Chuyển Khoản Học Phí" 
                    className="napas-qr-image"
                  />
                  <span className="qr-badge">VietQR NAPAS 247</span>
                </div>
                
                <div className="transfer-details-box">
                  <h5 className="details-title">Thông tin chuyển khoản thủ công</h5>
                  <div className="details-list">
                    <div className="d-item">
                      <span className="d-lbl">Ngân hàng:</span>
                      <strong className="d-val">{bankSettings.bankId}</strong>
                    </div>
                    <div className="d-item">
                      <span className="d-lbl">Số tài khoản:</span>
                      <strong className="d-val">{bankSettings.accountNo}</strong>
                    </div>
                    <div className="d-item">
                      <span className="d-lbl">Chủ tài khoản:</span>
                      <strong className="d-val">{bankSettings.accountName}</strong>
                    </div>
                    <div className="d-item">
                      <span className="d-lbl">Số tiền:</span>
                      <strong className="d-val text-danger">{formatVND(outstandingDebt)}</strong>
                    </div>
                    <div className="d-item">
                      <span className="d-lbl">Nội dung CK:</span>
                      <strong className="d-val text-primary copyable-memo">{memoText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments History */}
          <div className="payment-history-section">
            <h4 className="payment-history-title">Lịch sử giao dịch học phí</h4>
            {payments.length === 0 ? (
              <p className="empty-section-text">Chưa có giao dịch phát sinh.</p>
            ) : (
              <div className="payments-table-wrapper">
                <table className="custom-table reports-payment-table">
                  <thead>
                    <tr>
                      <th>Khoản học phí</th>
                      <th>Phải đóng</th>
                      <th>Đã đóng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const calc = calculateTuitionForMonth(p.studentId, p.classId, p.month);
                      const classObj = enrolledClasses.find(c => c.id === p.classId);
                      const standardFee = classObj?.tuitionFee || 0;

                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="p-month-cell">
                              <strong>Tháng {p.month}</strong>
                              <span>{getClassName(p.classId)}</span>
                              {calc && calc.discountAmount > 0 && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '2px' }}>
                                  Giảm trừ vắng học: -{formatVND(calc.discountAmount)} ({calc.discountSessions} buổi)
                                </div>
                              )}
                              {calc && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Quỹ buổi dư tích luỹ: {calc.newBalance} buổi
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>{formatVND(p.totalDue)}</div>
                            {calc && calc.discountAmount > 0 && (
                              <span style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                                {formatVND(standardFee)}
                              </span>
                            )}
                          </td>
                          <td className="text-success">{formatVND(p.amountPaid)}</td>
                          <td>
                            {p.status === 'paid' && <span className="badge badge-success">Đã đóng đủ</span>}
                            {p.status === 'partially_paid' && <span className="badge badge-warning">Đóng một phần</span>}
                            {p.status === 'unpaid' && <span className="badge badge-danger">Chưa đóng</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
