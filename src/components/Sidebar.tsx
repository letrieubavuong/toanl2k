'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, QrCode, GraduationCap, X, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Tổng quan (Dashboard)', path: '/', icon: LayoutDashboard },
    { name: 'Quản lý Lớp học', path: '/classes', icon: BookOpen },
    { name: 'Quản lý Học sinh', path: '/students', icon: Users },
    { name: 'Cài đặt hệ thống', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar glass ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <GraduationCap size={28} className="brand-icon" />
          <span className="brand-name">GeniCenter</span>
          <button className="mobile-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={onClose}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">LK</div>
            <div className="user-info">
              <span className="user-name">LÊ KHÁNH LOAN</span>
              <span className="user-role">Giáo Vụ Trung Tâm</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
