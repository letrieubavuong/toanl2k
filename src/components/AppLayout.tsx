'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Cloud, RefreshCw } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync state
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newRemoteState, setNewRemoteState] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isFirstSnapshot = true;

    // Load Firebase sync config dynamically to prevent server-side rendering bundle errors
    import('@/lib/firebaseSync').then(({ getSavedFirebaseConfig, getSavedCenterId, isAutoSyncEnabled, subscribeToFirebase }) => {
      const config = getSavedFirebaseConfig();
      const centerId = getSavedCenterId();
      const autoSync = isAutoSyncEnabled();

      if (config && autoSync) {
        subscribeToFirebase(centerId, config, (remoteState) => {
          import('@/lib/db').then(({ getDB, saveDB }) => {
            const localState = getDB();
            const localUpdatedAt = localState.updatedAt || '';
            const remoteUpdatedAt = remoteState.updatedAt || '';

            // Only notify if the remote update is newer than local update
            if (remoteUpdatedAt && remoteUpdatedAt > localUpdatedAt) {
              if (isFirstSnapshot) {
                console.log('Tự động đồng bộ phiên bản mới nhất từ Firestore khi tải trang:', remoteUpdatedAt);
                saveDB(remoteState, true);
                window.location.reload();
              } else {
                console.log('Phát hiện phiên bản mới hơn trên đám mây:', remoteUpdatedAt, '(cục bộ:', localUpdatedAt, ')');
                setNewRemoteState(remoteState);
                setHasNewVersion(true);
              }
            }
            isFirstSnapshot = false;
          });
        }).then(unsub => {
          unsubscribe = unsub;
        }).catch(err => {
          console.error('Lỗi khi đăng ký lắng nghe Firebase:', err);
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleApplyUpdate = () => {
    if (!newRemoteState) return;
    setIsUpdating(true);
    
    import('@/lib/db').then(({ saveDB }) => {
      // Save pulled state to localstorage, skip sending it back to Firebase
      saveDB(newRemoteState, true);
      
      // Reload page to refresh all context/state
      window.location.reload();
    }).catch(err => {
      console.error(err);
      setIsUpdating(false);
    });
  };

  // If this is the parent report portal, render it without the admin UI wrapper
  const isParentPortal = pathname.startsWith('/reports/');

  if (isParentPortal) {
    return (
      <main className="parent-portal-container">
        {children}
        <style jsx global>{`
          /* Parent portal mobile-friendly resets */
          body {
            background-color: var(--bg-app);
          }
          .parent-portal-container {
            width: 100%;
            min-height: 100vh;
            padding: 0;
            margin: 0;
          }
        `}</style>
      </main>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Alert for New Cloud Data Version */}
      {hasNewVersion && (
        <div className="cloud-update-toast">
          <div className="toast-content">
            <Cloud className="cloud-icon text-primary animate-pulse" size={20} />
            <div className="toast-text">
              <span className="toast-title">Cơ sở dữ liệu đã thay đổi!</span>
              <span className="toast-desc">Có dữ liệu mới hơn được cập nhật từ thiết bị khác.</span>
            </div>
            <button 
              className="btn btn-primary btn-sm toast-action-btn"
              onClick={handleApplyUpdate}
              disabled={isUpdating}
            >
              <RefreshCw size={12} className={isUpdating ? 'animate-spin' : ''} />
              <span>Cập nhật ngay</span>
            </button>
          </div>
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-wrapper">
        <Header onMenuOpen={() => setSidebarOpen(true)} />
        
        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .main-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0; /* Prevents flex items from overflowing */
        }

        .cloud-update-toast {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 1000;
          animation: slideInRight 0.3s ease-out forwards;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          padding: 12px 16px;
          border-radius: 12px;
          color: #f8fafc;
        }

        .cloud-icon {
          color: var(--primary);
        }

        .toast-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toast-title {
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffffff;
        }

        .toast-desc {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .toast-action-btn {
          padding: 6px 12px;
          font-size: 0.75rem;
          border-radius: 8px;
          height: 32px;
          font-weight: 600;
          gap: 6px;
          cursor: pointer;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
