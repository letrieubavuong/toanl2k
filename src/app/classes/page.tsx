'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Plus, X, GraduationCap, DollarSign } from 'lucide-react';
import { getClasses, addClass, getStudentsInClass, Class } from '@/lib/db';

export default function ClassesPage() {
  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState(9);
  const [tuitionFee, setTuitionFee] = useState(800000);

  const loadData = () => {
    const list = getClasses();
    setClasses(list);
    
    // Calculate student count for each class
    const counts: Record<string, number> = {};
    list.forEach(c => {
      counts[c.id] = getStudentsInClass(c.id).length;
    });
    setClassStudentCounts(counts);
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !subject.trim() || tuitionFee <= 0) {
      alert('Vui lòng điền đầy đủ và chính xác thông tin lớp học.');
      return;
    }

    addClass({
      name: newClassName,
      subject,
      grade,
      tuitionFee
    });

    // Reset Form
    setNewClassName('');
    setSubject('Toán');
    setGrade(9);
    setTuitionFee(800000);
    setIsModalOpen(false);
    
    // Reload
    loadData();
  };

  if (!mounted) {
    return <div className="loading-state">Đang tải danh sách lớp...</div>;
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="classes-wrapper">
      <div className="section-header">
        <div>
          <h2 className="section-title">Danh sách Lớp học</h2>
          <p className="section-desc">Quản lý danh sách các lớp đang giảng dạy tại trung tâm.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Thêm Lớp Mới</span>
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="card empty-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>Chưa có lớp học nào</h3>
          <p>Bắt đầu bằng cách thêm lớp học đầu tiên cho trung tâm.</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            Thêm Lớp Mới
          </button>
        </div>
      ) : (
        <div className="grid-cols-4 classes-grid">
          {classes.map((cls) => (
            <div className="card class-card" key={cls.id}>
              <div className="class-badge">
                <GraduationCap size={14} />
                <span>Khối {cls.grade}</span>
              </div>
              <h3 className="class-name">{cls.name}</h3>
              <p className="class-subject">Môn học: {cls.subject}</p>
              
              <div className="class-stats">
                <div className="class-stat-item">
                  <Users size={16} />
                  <span>Sĩ số: <strong>{classStudentCounts[cls.id] || 0}</strong> học sinh</span>
                </div>
                <div className="class-stat-item">
                  <DollarSign size={16} />
                  <span>Học phí: <strong>{formatVND(cls.tuitionFee)}</strong>/tháng</span>
                </div>
              </div>

              <div className="class-actions">
                <Link href={`/classes/${cls.id}`} className="btn btn-primary btn-sm btn-block">
                  Quản lý lớp
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Thêm Lớp Học Mới</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label className="form-label">Tên lớp học</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Lớp Toán 9 - Thầy Hải"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Môn học</label>
                <select 
                  className="form-input select-input" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
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
                    placeholder="Ví dụ: 800000"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(Number(e.target.value))}
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .classes-wrapper {
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

        .classes-grid {
          margin-top: 10px;
        }

        .class-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
        }

        .class-badge {
          position: absolute;
          top: 18px;
          right: 18px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .class-name {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 10px;
          margin-bottom: 6px;
          padding-right: 70px; /* Make space for badge */
          color: var(--text-main);
        }

        .class-subject {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .class-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .class-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .class-stat-item strong {
          font-weight: 600;
        }

        .class-actions {
          margin-top: auto;
        }

        .btn-block {
          width: 100%;
        }

        .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          gap: 16px;
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
          margin-bottom: 8px;
        }

        /* Modal Styles */
        .select-input {
          cursor: pointer;
        }

        .grid-inputs {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: var(--text-muted);
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
