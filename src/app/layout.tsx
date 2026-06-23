import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeContext';
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'GeniCenter - Quản Lý Trung Tâm Học Thêm',
  description: 'Hệ thống quản lý lớp học, điểm danh, học viên và học phí chuyên sâu dành cho trung tâm học thêm và giáo viên dạy thêm.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ThemeProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
