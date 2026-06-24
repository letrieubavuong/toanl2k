'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface HeaderProps {
  onMenuOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuOpen }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const getPageTitle = () => {
    if (pathname === '/') return 'Tổng quan hệ thống';
    if (pathname.startsWith('/classes')) {
      if (pathname.includes('/cls-')) return 'Chi tiết Lớp học';
      return 'Quản lý Lớp học';
    }
    if (pathname.startsWith('/students')) return 'Quản lý Học sinh';
    if (pathname.startsWith('/qr')) return 'Tạo mã QR Liên hệ';
    return 'Hệ thống Quản lý';
  };

  return (
    <header className="header glass">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onMenuOpen}>
          <Menu size={22} />
        </button>
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="header-right">
        <button 
          className="header-btn theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
