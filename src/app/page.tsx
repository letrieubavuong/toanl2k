'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { getDashboardStats, getStudents, getClasses, getPayments, getDB, DatabaseState } from '@/lib/db';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalPaid: 0,
    totalDebt: 0,
    gradeDistribution: {} as Record<number, number>
  });
  const [dbState, setDbState] = useState<DatabaseState | null>(null);

  useEffect(() => {
    setMounted(true);
    setStats(getDashboardStats());
    setDbState(getDB());
  }, []);

  if (!mounted || !dbState) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu dashboard...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            gap: 16px;
            color: var(--text-muted);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Format currency helper
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Process data for grade distribution chart
  const grades = [6, 7, 8, 9, 10, 11, 12]; // Grades represented in center
  const gradeCounts = grades.map(g => stats.gradeDistribution[g] || 0);
  const maxCount = Math.max(...gradeCounts, 5); // Fallback to 5 to avoid division by 0 and give chart head room

  // Calculate percentage of attendance
  const totalAttendanceRecords = dbState.attendance.length;
  const presentCount = dbState.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentCount / totalAttendanceRecords) * 100) 
    : 100;

  // Get recent 4 payments
  const recentPayments = [...dbState.payments]
    .filter(p => p.amountPaid > 0)
    .sort((a, b) => {
      const dateA = a.paymentDate || '';
      const dateB = b.paymentDate || '';
      return dateB.localeCompare(dateA);
    })
    .slice(0, 4);

  // Get recent 4 attendance check-ins
  const recentAttendance = [...dbState.attendance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const getStudentName = (id: string) => {
    return dbState.students.find(s => s.id === id)?.name || 'Học sinh';
  };

  const getClassName = (id: string) => {
    return dbState.classes.find(c => c.id === id)?.name || 'Lớp học';
  };

  return (
    <div className="dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="welcome-banner glass">
        <div className="welcome-text">
          <h2>Xin chào, LÊ KHÁNH LOAN 👋</h2>
          <p>Chào mừng bạn trở lại hệ thống quản lý. Dưới đây là tóm tắt nhanh hoạt động của trung tâm hôm nay.</p>
        </div>
        <div className="quick-actions">
          <Link href="/classes" className="btn btn-primary">
            <BookOpen size={16} />
            <span>Điểm Danh Ngay</span>
          </Link>
          <Link href="/qr" className="btn btn-secondary">
            <TrendingUp size={16} />
            <span>Báo Cáo Học Tập</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid-cols-4 stat-grid">
        <Link href="/students" className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Tổng học sinh</span>
            <div className="stat-icon-wrapper std">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalStudents} em</div>
          <div className="stat-footer">
            <span className="trend-pos">Hoạt động tốt</span>
            <ArrowUpRight size={14} className="trend-arrow" />
          </div>
        </Link>

        <Link href="/classes" className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Số lớp học</span>
            <div className="stat-icon-wrapper cls">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalClasses} lớp</div>
          <div className="stat-footer">
            <span>{formatVND(Math.round(stats.totalPaid / (stats.totalClasses || 1)))} / lớp</span>
          </div>
        </Link>

        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Học phí đã thu</span>
            <div className="stat-icon-wrapper paid">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value text-gradient">{formatVND(stats.totalPaid)}</div>
          <div className="stat-footer">
            <span className="trend-pos">Tỷ lệ đóng: {Math.round((stats.totalPaid / ((stats.totalPaid + stats.totalDebt) || 1)) * 100)}%</span>
          </div>
        </div>

        <Link href="/students?filter=debt" className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">Học phí còn nợ</span>
            <div className="stat-icon-wrapper debt">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value debt-color">{formatVND(stats.totalDebt)}</div>
          <div className="stat-footer">
            <span className="trend-neg">Cần nhắc phụ huynh</span>
          </div>
        </Link>
      </section>

      {/* Charts & Analytics */}
      <section className="grid-cols-2 charts-grid">
        {/* Grade Distribution Chart (SVG based) */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Học sinh theo Khối Lớp</h3>
            <span className="badge badge-info">Phân tích khối</span>
          </div>
          <div className="chart-container">
            <svg viewBox="0 0 400 240" className="grade-chart">
              {/* Grid Lines */}
              <line x1="40" y1="40" x2="380" y2="40" className="chart-grid-line" />
              <line x1="40" y1="90" x2="380" y2="90" className="chart-grid-line" />
              <line x1="40" y1="140" x2="380" y2="140" className="chart-grid-line" />
              <line x1="40" y1="190" x2="380" y2="190" className="chart-grid-line" />

              {/* Y Axis labels */}
              <text x="30" y="44" className="chart-axis-text">10</text>
              <text x="30" y="94" className="chart-axis-text">6</text>
              <text x="30" y="144" className="chart-axis-text">3</text>
              <text x="30" y="194" className="chart-axis-text">0</text>

              {/* Gradients */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>

              {/* Bars */}
              {grades.map((grade, index) => {
                const count = stats.gradeDistribution[grade] || 0;
                // Height calculations
                const chartHeight = 150; // max chart height
                const barHeight = (count / maxCount) * chartHeight;
                const barWidth = 40;
                const xGap = 80;
                const xStart = 60 + index * xGap;
                const yStart = 190 - barHeight;

                return (
                  <g key={grade} className="chart-group">
                    {/* Bar background (track) */}
                    <rect 
                      x={xStart} 
                      y={40} 
                      width={barWidth} 
                      height={chartHeight} 
                      rx="4"
                      className="chart-bar-track" 
                    />
                    {/* Active Bar */}
                    <rect 
                      x={xStart} 
                      y={yStart} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="4"
                      fill="url(#barGradient)"
                      className="chart-bar-fill"
                    />
                    {/* Data Value Label */}
                    <text 
                      x={xStart + barWidth / 2} 
                      y={yStart - 8} 
                      textAnchor="middle" 
                      className="chart-value-text"
                    >
                      {count}
                    </text>
                    {/* X Axis Label */}
                    <text 
                      x={xStart + barWidth / 2} 
                      y="215" 
                      textAnchor="middle" 
                      className="chart-axis-label"
                    >
                      Khối {grade}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Center Chuyên Cần Card */}
        <div className="card attendance-card">
          <div className="card-header">
            <h3 className="card-title">Tỷ lệ Chuyên Cần Trung Tâm</h3>
            <span className="badge badge-success">Tháng này</span>
          </div>
          
          <div className="attendance-content">
            <div className="circular-progress-wrapper">
              <svg viewBox="0 0 120 120" className="circular-chart">
                <circle className="circle-bg" cx="60" cy="60" r="50" />
                <circle 
                  className="circle-fill" 
                  strokeDasharray={`${attendanceRate}, 100`} 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  stroke="var(--success)"
                />
                <text x="60" y="65" textAnchor="middle" className="circle-percentage">
                  {attendanceRate}%
                </text>
              </svg>
            </div>
            
            <div className="attendance-details">
              <div className="att-stat-item">
                <div className="dot success"></div>
                <span className="label">Chuyên cần tổng quan:</span>
                <span className="value">Tốt</span>
              </div>
              <div className="att-stat-item">
                <div className="dot info"></div>
                <span className="label">Tổng buổi điểm danh:</span>
                <span className="value">{totalAttendanceRecords} lượt</span>
              </div>
              <p className="attendance-desc">
                Tỉ lệ đi học đầy đủ và muộn trong tầm kiểm soát. Các trường hợp vắng không phép đều được hệ thống tự động ghi nhận để liên hệ phụ huynh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity logs / Lists */}
      <section className="grid-cols-2 activities-grid">
        {/* Recent payments */}
        <div className="card list-card">
          <div className="card-header">
            <h3 className="card-title">Thu Học Phí Gần Đây</h3>
            <Link href="/students" className="view-all-link">
              Quản lý học sinh &rarr;
            </Link>
          </div>
          
          <div className="list-content">
            {recentPayments.length === 0 ? (
              <p className="empty-text">Chưa có giao dịch thu học phí gần đây.</p>
            ) : (
              recentPayments.map(p => (
                <div className="activity-item" key={p.id}>
                  <div className="activity-icon-box success">
                    <CheckCircle size={16} />
                  </div>
                  <div className="activity-info">
                    <div className="activity-text">
                      <strong>{getStudentName(p.studentId)}</strong> đã đóng học phí lớp <em>{getClassName(p.classId)}</em>
                    </div>
                    <span className="activity-date">{p.paymentDate} • Tháng {p.month}</span>
                  </div>
                  <div className="activity-amount">
                    +{formatVND(p.amountPaid)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent attendance check-ins */}
        <div className="card list-card">
          <div className="card-header">
            <h3 className="card-title">Điểm Danh Gần Đây</h3>
            <Link href="/classes" className="view-all-link">
              Quản lý lớp học &rarr;
            </Link>
          </div>
          
          <div className="list-content">
            {recentAttendance.length === 0 ? (
              <p className="empty-text">Chưa có dữ liệu điểm danh gần đây.</p>
            ) : (
              recentAttendance.map(a => {
                let badgeClass = 'badge-success';
                let statusText = 'Có mặt';
                
                if (a.status === 'late') {
                  badgeClass = 'badge-warning';
                  statusText = 'Đi muộn';
                } else if (a.status === 'absent_excused') {
                  badgeClass = 'badge-info';
                  statusText = 'Vắng phép';
                } else if (a.status === 'absent_unexcused') {
                  badgeClass = 'badge-danger';
                  statusText = 'Không phép';
                }

                return (
                  <div className="activity-item" key={a.id}>
                    <div className={`activity-icon-box ${a.status.startsWith('absent') ? 'danger' : 'info'}`}>
                      <Clock size={16} />
                    </div>
                    <div className="activity-info">
                      <div className="activity-text">
                        <strong>{getStudentName(a.studentId)}</strong> học lớp <em>{getClassName(a.classId)}</em>
                      </div>
                      <span className="activity-date">{a.date} {a.note ? `• ${a.note}` : ''}</span>
                    </div>
                    <span className={`badge ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%);
          border-left: 5px solid var(--primary);
        }

        .welcome-text h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--text-main);
        }

        .welcome-text p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .quick-actions {
          display: flex;
          gap: 12px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 140px;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .stat-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.std { background-color: var(--info-light); color: var(--info); }
        .stat-icon-wrapper.cls { background-color: var(--primary-light); color: var(--primary); }
        .stat-icon-wrapper.paid { background-color: var(--success-light); color: var(--success); }
        .stat-icon-wrapper.debt { background-color: var(--danger-light); color: var(--danger); }

        .stat-footer {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 14px;
        }

        .trend-pos { color: var(--success); font-weight: 500; }
        .trend-neg { color: var(--danger); font-weight: 500; }
        .trend-arrow { color: var(--success); }
        
        .debt-color {
          color: var(--danger);
        }

        /* Charts Styles */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .chart-container {
          height: 240px;
          display: flex;
          align-items: flex-end;
        }

        .grade-chart {
          width: 100%;
          height: 100%;
        }

        .chart-grid-line {
          stroke: var(--border);
          stroke-dasharray: 4 4;
          stroke-width: 1;
        }

        .chart-axis-text {
          font-size: 10px;
          fill: var(--text-muted);
          text-anchor: end;
        }

        .chart-bar-track {
          fill: var(--bg-input);
          opacity: 0.2;
        }

        .chart-bar-fill {
          transition: height 0.6s ease, y 0.6s ease;
        }

        .chart-bar-fill:hover {
          fill: var(--primary-hover);
          cursor: pointer;
        }

        .chart-value-text {
          font-size: 11px;
          font-weight: 600;
          fill: var(--text-main);
        }

        .chart-axis-label {
          font-size: 11px;
          font-weight: 500;
          fill: var(--text-muted);
        }

        /* Circular Attendance Progress */
        .attendance-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          height: 200px;
        }

        .circular-progress-wrapper {
          width: 140px;
          height: 140px;
        }

        .circular-chart {
          display: block;
          margin: 10px auto;
          max-width: 100%;
          max-height: 100%;
        }

        .circle-bg {
          fill: none;
          stroke: var(--bg-input);
          stroke-width: 3.5;
        }

        .circle-fill {
          fill: none;
          stroke-width: 3.8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.6s ease;
        }

        .circle-percentage {
          fill: var(--text-main);
          font-family: inherit;
          font-size: 1.15rem;
          font-weight: 700;
          text-anchor: middle;
        }

        .attendance-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .att-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .att-stat-item .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .att-stat-item .dot.success { background-color: var(--success); }
        .att-stat-item .dot.info { background-color: var(--info); }
        
        .att-stat-item .label {
          color: var(--text-muted);
        }

        .att-stat-item .value {
          font-weight: 600;
          color: var(--text-main);
        }

        .attendance-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-top: 6px;
        }

        /* Activities Lists */
        .view-all-link {
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 500;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .list-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-text {
          color: var(--text-muted);
          font-size: 0.9rem;
          text-align: center;
          padding: 20px 0;
        }

        .activity-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-input);
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .activity-item:hover {
          border-color: rgba(99, 102, 241, 0.2);
          background-color: var(--border);
        }

        .activity-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .activity-icon-box.success { background-color: var(--success-light); color: var(--success); }
        .activity-icon-box.info { background-color: var(--info-light); color: var(--info); }
        .activity-icon-box.danger { background-color: var(--danger-light); color: var(--danger); }

        .activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .activity-text {
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .activity-text strong {
          font-weight: 600;
        }

        .activity-text em {
          font-style: normal;
          color: var(--primary);
          font-weight: 500;
        }

        .activity-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .activity-amount {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--success);
        }

        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .attendance-content {
            flex-direction: column;
            height: auto;
            align-items: center;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
