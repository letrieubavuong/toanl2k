'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  X, 
  Check, 
  Phone, 
  User, 
  GraduationCap 
} from 'lucide-react';
import { 
  getStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent, 
  getClassesForStudent, 
  getClasses,
  getPayments, 
  savePayment, 
  calculateTuitionForMonth,
  Student, 
  Class, 
  TuitionPayment 
} from '@/lib/db';

export default function StudentsPage() {
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [allPayments, setAllPayments] = useState<TuitionPayment[]>([]);
  const [studentClasses, setStudentClasses] = useState<Record<string, Class[]>>({});
  const [allClasses, setAllClasses] = useState<Class[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Register Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState(9);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Collect Tuition Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [pendingPayments, setPendingPayments] = useState<TuitionPayment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Loading indicator / Toast
  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    const stds = getStudents();
    setStudents(stds);
    
    const payments = getPayments();
    setAllPayments(payments);

    const clsList = getClasses();
    setAllClasses(clsList);

    const classesMap: Record<string, Class[]> = {};
    stds.forEach(s => {
      classesMap[s.id] = getClassesForStudent(s.id);
    });
    setStudentClasses(classesMap);
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentStudentId('');
    setStudentName('');
    setStudentGrade(9);
    setParentName('');
    setParentPhone('');
    setDiscountPercentage(0);
    setIsRegModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setIsEditMode(true);
    setCurrentStudentId(student.id);
    setStudentName(student.name);
    setStudentGrade(student.grade);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setDiscountPercentage(student.discountPercentage || 0);
    setIsRegModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentName.trim() || !parentPhone.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    const discountVal = Math.min(100, Math.max(0, Number(discountPercentage) || 0));

    if (isEditMode) {
      updateStudent(currentStudentId, {
        name: studentName,
        grade: studentGrade,
        parentName,
        parentPhone,
        discountPercentage: discountVal
      });
      triggerToast('Đã cập nhật thông tin học sinh!');
    } else {
      addStudent({
        name: studentName,
        grade: studentGrade,
        parentName,
        parentPhone,
        discountPercentage: discountVal
      });
      triggerToast('Đăng ký học sinh mới thành công!');
    }

    setIsRegModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${name}? Mọi dữ liệu điểm danh, đóng học phí liên quan đến học sinh này sẽ bị xóa vĩnh viễn khỏi hệ thống.`)) {
      deleteStudent(id);
      triggerToast('Đã xóa học sinh ra khỏi trung tâm.');
      loadData();
    }
  };

  // Open payment collection modal
  const handleOpenPaymentModal = (student: Student) => {
    setPaymentStudent(student);
    
    // Find unpaid/partially paid payments for this student
    const unpaid = allPayments.filter(p => p.studentId === student.id && p.status !== 'paid');
    setPendingPayments(unpaid);
    
    if (unpaid.length > 0) {
      setSelectedPaymentId(unpaid[0].id);
      // Auto fill amount needed
      setPayAmount(unpaid[0].totalDue - unpaid[0].amountPaid);
    } else {
      setSelectedPaymentId('');
      setPayAmount(0);
    }
    
    setIsPaymentModalOpen(true);
  };

  // When selected payment month changes inside modal
  const handleSelectedPaymentChange = (id: string) => {
    setSelectedPaymentId(id);
    const pm = pendingPayments.find(p => p.id === id);
    if (pm) {
      setPayAmount(pm.totalDue - pm.amountPaid);
    }
  };

  const selectedPayment = pendingPayments.find(p => p.id === selectedPaymentId);
  const selectedClass = selectedPayment ? allClasses.find(c => c.id === selectedPayment.classId) : null;
  const calc = (selectedPayment && selectedClass) 
    ? calculateTuitionForMonth(paymentStudent?.id || '', selectedClass.id, selectedPayment.month) 
    : null;

  const handleApplyCalculatedTuition = () => {
    const pm = pendingPayments.find(p => p.id === selectedPaymentId);
    if (!pm || !calc) return;
    
    savePayment({
      ...pm,
      totalDue: calc.recommendedDue
    });
    
    loadData();
    
    const updatedPending = pendingPayments.map(p => 
      p.id === pm.id ? { ...p, totalDue: calc.recommendedDue } : p
    );
    setPendingPayments(updatedPending);
    setPayAmount(calc.recommendedDue - pm.amountPaid);
    triggerToast('Đã áp dụng giảm trừ học phí thành công!');
  };

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId || payAmount <= 0) {
      alert('Vui lòng chọn khoản học phí và số tiền đóng hợp lệ.');
      return;
    }

    const currentPayRecord = allPayments.find(p => p.id === selectedPaymentId);
    if (!currentPayRecord) return;

    const newAmountPaid = currentPayRecord.amountPaid + payAmount;
    const isFullyPaid = newAmountPaid >= currentPayRecord.totalDue;

    savePayment({
      id: selectedPaymentId,
      studentId: currentPayRecord.studentId,
      classId: currentPayRecord.classId,
      month: currentPayRecord.month,
      amountPaid: newAmountPaid,
      totalDue: currentPayRecord.totalDue,
      paymentDate,
      status: isFullyPaid ? 'paid' : 'partially_paid',
      note: isFullyPaid ? 'Đã hoàn tất đóng học phí' : `Đóng thêm ${payAmount.toLocaleString('vi-VN')}đ`
    });

    triggerToast('Ghi nhận đóng học phí thành công!');
    setIsPaymentModalOpen(false);
    loadData();
  };

  if (!mounted) {
    return <div className="loading-state">Đang tải danh sách học sinh...</div>;
  }

  // Get outstanding debt of a student
  const getStudentDebt = (studentId: string) => {
    return allPayments
      .filter(p => p.studentId === studentId)
      .reduce((acc, curr) => acc + (curr.totalDue - curr.amountPaid), 0);
  };

  // Filter students based on search and grade filters
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.parentPhone.includes(searchTerm);
    const matchesGrade = 
      selectedGrade === 'all' || 
      s.grade === Number(selectedGrade);
    
    return matchesSearch && matchesGrade;
  });

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="students-wrapper">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Danh mục Học sinh</h2>
          <p className="section-desc">Quản lý hồ sơ, lớp tham gia, và tình hình học phí của học sinh trung tâm.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Đăng Ký Học Sinh</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          {toastMessage}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="card filter-bar-card glass">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="Tìm kiếm theo họ tên học sinh hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <label className="form-label" style={{ marginBottom: 0, marginRight: '10px', whiteSpace: 'nowrap' }}>
            Lọc theo khối:
          </label>
          <select 
            className="form-input filter-select"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="all">Tất cả khối lớp</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={g}>Khối {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="card empty-card">
          <Users size={48} className="empty-icon" />
          <h3>Không tìm thấy học sinh</h3>
          <p>Không tìm thấy kết quả phù hợp với từ khóa hoặc bộ lọc đã chọn.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Khối</th>
                <th>Thông tin Phụ huynh</th>
                <th>Lớp đang học</th>
                <th>Học phí còn nợ</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((std) => {
                const classes = studentClasses[std.id] || [];
                const debt = getStudentDebt(std.id);
                
                return (
                  <tr key={std.id}>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-small">
                          {std.name.split(' ').pop()?.substring(0, 2)}
                        </div>
                        <div className="student-name-group">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong className="std-name">{std.name}</strong>
                            {std.discountPercentage ? (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px', backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                                Giảm {std.discountPercentage}%
                              </span>
                            ) : null}
                          </div>
                          <span className="std-date">Nhập học: {std.joinedDate}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">Khối {std.grade}</span>
                    </td>
                    <td>
                      <div className="parent-info-cell">
                        <span className="parent-name">{std.parentName}</span>
                        <span className="parent-phone">
                          <Phone size={12} style={{ verticalAlign: 'middle', marginRight: '4px', display: 'inline' }} />
                          {std.parentPhone}
                        </span>
                      </div>
                    </td>
                    <td>
                      {classes.length === 0 ? (
                        <span className="no-class-text">Chưa vào lớp</span>
                      ) : (
                        <div className="classes-tags-list">
                          {classes.map(c => (
                            <span key={c.id} className="badge badge-info class-tag">{c.name}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {debt === 0 ? (
                        <span className="badge badge-success">Đã hoàn thành</span>
                      ) : (
                        <span className="badge badge-danger" style={{ cursor: 'pointer' }} onClick={() => handleOpenPaymentModal(std)}>
                          Nợ: {formatVND(debt)}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell-buttons">
                        <button 
                          className="btn btn-secondary btn-sm table-action-btn paid"
                          onClick={() => handleOpenPaymentModal(std)}
                          title="Thu Học Phí"
                          disabled={debt === 0}
                        >
                          <CreditCard size={14} />
                          <span>Thu học phí</span>
                        </button>

                        <button 
                          className="btn btn-secondary btn-sm table-action-btn"
                          onClick={() => handleOpenEditModal(std)}
                          title="Sửa thông tin"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button 
                          className="btn btn-secondary btn-sm table-action-btn delete"
                          onClick={() => handleDelete(std.id, std.name)}
                          title="Xóa học sinh"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isRegModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {isEditMode ? 'Cập Nhật Thông Tin Học Sinh' : 'Đăng Ký Học Sinh Mới'}
              </h3>
              <button className="modal-close" onClick={() => setIsRegModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent}>
              <div className="form-group">
                <label className="form-label">Họ và Tên học sinh</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={16} />
                  <input 
                    type="text" 
                    className="form-input padded-input" 
                    placeholder="Ví dụ: Lê Tuấn Anh"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-inputs">
                <div className="form-group">
                  <label className="form-label">Khối lớp</label>
                  <select 
                    className="form-input select-input" 
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại phụ huynh</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={16} />
                    <input 
                      type="tel" 
                      className="form-input padded-input" 
                      placeholder="Ví dụ: 0912345678"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Họ tên phụ huynh</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Lê Văn Dũng"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Miễn giảm học phí (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Ví dụ: 10% (nhập 10) hoặc 0"
                  value={discountPercentage || ''}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? 'Lưu thay đổi' : 'Đăng ký học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Tuition Payment Modal */}
      {isPaymentModalOpen && paymentStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Ghi Nhận Đóng Học Phí</h3>
              <button className="modal-close" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="payment-empty-container">
                <p>Học sinh <strong>{paymentStudent.name}</strong> đã thanh toán đầy đủ các kỳ học phí hiện tại, không còn nợ phí.</p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setIsPaymentModalOpen(false)}>
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCollectPayment}>
                <div className="payment-student-info">
                  <p>Học sinh: <strong>{paymentStudent.name}</strong> (Khối {paymentStudent.grade})</p>
                  <p>Phụ huynh: {paymentStudent.parentName} - {paymentStudent.parentPhone}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn khoản học phí cần thu</label>
                  <select 
                    className="form-input select-input"
                    value={selectedPaymentId}
                    onChange={(e) => handleSelectedPaymentChange(e.target.value)}
                    required
                  >
                    {pendingPayments.map(p => {
                      const cName = studentClasses[paymentStudent.id]?.find(c => c.id === p.classId)?.name || 'Lớp học';
                      const remaining = p.totalDue - p.amountPaid;
                      return (
                        <option key={p.id} value={p.id}>
                          Tháng {p.month} - Lớp {cName} (Còn nợ: {formatVND(remaining)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Chi tiết tính toán học phí bù trừ buổi nghỉ và buổi dư */}
                {calc && selectedClass && (
                  <div className="tuition-calc-details" style={{ marginTop: '14px', marginBottom: '18px', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '4px', color: 'var(--text-main)' }}>
                      Chi tiết tính học phí (Định mức chuẩn: 12 buổi/tháng)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Học phí gốc lớp học:</span>
                      <strong>{formatVND(selectedClass.tuitionFee)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số buổi thực tế lên lịch:</span>
                      <span>{calc.scheduledSessions} / 12 buổi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số buổi dư tháng này:</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{calc.currentExcess} buổi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Quỹ buổi dư cũ tích luỹ:</span>
                      <span>{calc.prevBalance} buổi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số buổi vắng học (tháng này):</span>
                      <span style={{ color: calc.absences > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>-{calc.absences} buổi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Quỹ buổi dư chuyển tiếp sau:</span>
                      <strong style={{ color: 'var(--primary)' }}>{calc.newBalance} buổi</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số buổi nghỉ quá hạn bị trừ tiền:</span>
                      <span style={{ color: calc.discountSessions > 0 ? 'var(--danger)' : 'inherit', fontWeight: 600 }}>{calc.discountSessions} buổi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số tiền được giảm trừ:</span>
                      <strong style={{ color: 'var(--success)' }}>-{formatVND(calc.discountAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Học phí khuyến nghị:</span>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{formatVND(calc.recommendedDue)}</strong>
                    </div>

                    {selectedPayment && selectedPayment.totalDue !== calc.recommendedDue && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={handleApplyCalculatedTuition}
                        style={{ width: '100%', marginTop: '6px', fontSize: '0.75rem', padding: '6px' }}
                      >
                        Áp dụng giảm trừ học phí
                      </button>
                    )}
                  </div>
                )}

                <div className="grid-inputs">
                  <div className="form-group">
                    <label className="form-label">Số tiền thu (VND)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      required
                      min={1000}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày đóng học phí</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Xác nhận đóng tiền
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .students-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .section-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-top: 4px;
        }

        /* Filter bar style */
        .filter-bar-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          gap: 20px;
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          padding-left: 40px !important;
          width: 100%;
        }

        .filter-box {
          display: flex;
          align-items: center;
        }

        .filter-select {
          min-width: 180px;
          cursor: pointer;
        }

        /* Student profile cell */
        .student-profile-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .student-avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #a5b4fc 100%);
          color: var(--text-inverse);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.15);
        }

        .student-name-group {
          display: flex;
          flex-direction: column;
        }

        .std-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .std-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Parent cell */
        .parent-info-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .parent-name {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .parent-phone {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Class tags */
        .classes-tags-list {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          max-width: 250px;
        }

        .class-tag {
          font-size: 0.7rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .no-class-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Actions cell buttons */
        .actions-cell-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }

        .table-action-btn {
          padding: 8px;
          border-radius: 6px;
          color: var(--text-muted);
          border-color: var(--border);
          background-color: transparent;
        }

        .table-action-btn:hover {
          color: var(--text-main);
          background-color: var(--bg-input);
        }

        .table-action-btn.paid {
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.2);
          background-color: transparent;
          padding: 8px 12px;
          font-size: 0.8rem;
        }

        .table-action-btn.paid:hover {
          background-color: var(--success-light);
          border-color: var(--success);
        }
        
        .table-action-btn.paid:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background-color: transparent !important;
          border-color: var(--border) !important;
          color: var(--text-muted) !important;
        }

        .table-action-btn.delete:hover {
          color: var(--danger);
          background-color: var(--danger-light);
          border-color: var(--danger);
        }

        /* Input icons */
        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .padded-input {
          padding-left: 38px !important;
        }

        .grid-inputs {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
        }

        /* Payment modal formatting */
        .payment-student-info {
          padding: 12px 14px;
          background-color: var(--bg-input);
          border-radius: 8px;
          border-left: 4px solid var(--primary);
          margin-bottom: 20px;
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .payment-student-info strong {
          color: var(--text-main);
        }

        .payment-empty-container {
          padding: 20px 0 10px;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .payment-empty-container strong {
          color: var(--text-main);
        }

        .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          gap: 14px;
        }

        .empty-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .empty-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .empty-card p {
          color: var(--text-muted);
          max-width: 320px;
          font-size: 0.95rem;
        }

        .toast-alert {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1100;
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease forwards;
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: var(--text-muted);
          font-size: 1rem;
        }

        @media (max-width: 1024px) {
          .filter-bar-card {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          
          .filter-box {
            justify-content: space-between;
          }
          
          .filter-select {
            flex: 1;
          }
        }

        @media (max-width: 640px) {
          .table-action-btn span {
            display: none;
          }
          .table-action-btn.paid {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}
