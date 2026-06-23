'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Save, Check, Settings, Info, Plus, Trash2, Award, Cloud, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';
import { getBankSettings, saveBankSettings, BankSettings, getPointRules, savePointRules, PointRule, getDB, saveDB } from '@/lib/db';
import { 
  getSavedFirebaseConfig, 
  getSavedCenterId, 
  isAutoSyncEnabled, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  pushToFirebase, 
  pullFromFirebase,
  getSavedLastSyncTime,
  FirebaseConfig
} from '@/lib/firebaseSync';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [bankId, setBankId] = useState('MB');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Point Rules States
  const [rules, setRules] = useState<PointRule[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePoints, setNewRulePoints] = useState(1);
  const [newRuleType, setNewRuleType] = useState<'plus' | 'minus'>('plus');

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveToastMsg, setSaveToastMsg] = useState('');

  // Firebase States
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbMeasurementId, setFbMeasurementId] = useState('');
  const [fbCenterId, setFbCenterId] = useState('toanl2k');
  const [fbAutoSync, setFbAutoSync] = useState(false);
  const [fbRawConfig, setFbRawConfig] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // List of major Vietnamese banks for VietQR integration
  const popularBanks = [
    { id: 'MB', name: 'MBBank - Ngân hàng Quân Đội' },
    { id: 'VCB', name: 'Vietcombank - Ngoại thương VN' },
    { id: 'ICB', name: 'VietinBank - Công thương VN' },
    { id: 'BIDV', name: 'BIDV - Đầu tư và Phát triển VN' },
    { id: 'TCB', name: 'Techcombank - Kỹ thương VN' },
    { id: 'VBA', name: 'Agribank - Nông nghiệp VN' },
    { id: 'ACB', name: 'ACB - Á Châu' },
    { id: 'VPB', name: 'VPBank - Việt Nam Thịnh Vượng' },
    { id: 'TPB', name: 'TPBank - Tiên Phong' },
    { id: 'MSB', name: 'MSB - Hàng Hải' },
    { id: 'HDB', name: 'HDBank - Phát triển TPHCM' },
    { id: 'SHB', name: 'SHB - Sài Gòn - Hà Nội' },
  ];

  useEffect(() => {
    setMounted(true);
    const settings = getBankSettings();
    setBankId(settings.bankId);
    setAccountNo(settings.accountNo);
    setAccountName(settings.accountName);

    const pointRules = getPointRules();
    setRules(pointRules);

    // Load Firebase sync configurations
    const fbConfig = getSavedFirebaseConfig();
    if (fbConfig) {
      setFbApiKey(fbConfig.apiKey || '');
      setFbAuthDomain(fbConfig.authDomain || '');
      setFbProjectId(fbConfig.projectId || '');
      setFbStorageBucket(fbConfig.storageBucket || '');
      setFbMessagingSenderId(fbConfig.messagingSenderId || '');
      setFbAppId(fbConfig.appId || '');
      setFbMeasurementId(fbConfig.measurementId || '');
      setIsConfigured(true);
    }
    setFbCenterId(getSavedCenterId());
    setFbAutoSync(isAutoSyncEnabled());
    setLastSyncedTime(getSavedLastSyncTime());
  }, []);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNo.trim() || !accountName.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.');
      return;
    }

    // Capitalize account name automatically for standard banking
    const formattedName = accountName.trim().toUpperCase();

    saveBankSettings({
      bankId,
      accountNo: accountNo.trim(),
      accountName: formattedName
    });

    setAccountName(formattedName);
    setSaveToastMsg('Đã lưu cấu hình tài khoản ngân hàng thành công!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Firebase Smart Parser for Config Code Block
  const handleParseRawConfig = (text: string) => {
    setFbRawConfig(text);
    if (!text.trim()) return;

    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        let jsonStr = match[0];
        jsonStr = jsonStr.replace(/\/\/.*$/gm, ''); // remove single line comments
        jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // quote keys
        jsonStr = jsonStr.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"'); // quote values
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1'); // remove trailing comma

        const parsed = JSON.parse(jsonStr);
        if (parsed.apiKey) setFbApiKey(parsed.apiKey);
        if (parsed.authDomain) setFbAuthDomain(parsed.authDomain);
        if (parsed.projectId) setFbProjectId(parsed.projectId);
        if (parsed.storageBucket) setFbStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setFbMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setFbAppId(parsed.appId);
        if (parsed.measurementId) setFbMeasurementId(parsed.measurementId);
        
        setSaveToastMsg('Đã phân tích cú pháp và tự động điền cấu hình Firebase!');
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
      }
    } catch (e) {
      console.error('Failed to parse Firebase config as JSON:', e);
      // Fallback to simple regex matching
      const fields = [
        { key: 'apiKey', setter: setFbApiKey },
        { key: 'authDomain', setter: setFbAuthDomain },
        { key: 'projectId', setter: setFbProjectId },
        { key: 'storageBucket', setter: setFbStorageBucket },
        { key: 'messagingSenderId', setter: setFbMessagingSenderId },
        { key: 'appId', setter: setFbAppId },
        { key: 'measurementId', setter: setFbMeasurementId },
      ];
      let matchedAny = false;
      fields.forEach(({ key, setter }) => {
        const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
        const m = text.match(regex);
        if (m && m[1]) {
          setter(m[1]);
          matchedAny = true;
        }
      });
      if (matchedAny) {
        setSaveToastMsg('Đã trích xuất các trường cấu hình Firebase thành công!');
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
      }
    }
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      alert('Vui lòng điền các thông số Firebase bắt buộc (API Key, Project ID, App ID).');
      return;
    }
    const config: FirebaseConfig = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim(),
      measurementId: fbMeasurementId.trim() || undefined
    };
    saveFirebaseConfig(config, fbCenterId.trim(), fbAutoSync);
    setIsConfigured(true);
    setSaveToastMsg('Đã lưu cấu hình kết nối Firebase thành công!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleDisconnectFirebase = () => {
    if (confirm('Bạn có chắc chắn muốn ngắt kết nối và xóa cấu hình Firebase khỏi thiết bị? Dữ liệu cục bộ vẫn được bảo toàn.')) {
      clearFirebaseConfig();
      setFbApiKey('');
      setFbAuthDomain('');
      setFbProjectId('');
      setFbStorageBucket('');
      setFbMessagingSenderId('');
      setFbAppId('');
      setFbMeasurementId('');
      setFbCenterId('toanl2k');
      setFbAutoSync(false);
      setFbRawConfig('');
      setLastSyncedTime('');
      setIsConfigured(false);
      setSaveToastMsg('Đã ngắt kết nối Firebase thành công!');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  const handlePushFirebase = async () => {
    if (!fbApiKey || !fbProjectId || !fbAppId) {
      alert('Chưa cấu hình Firebase đầy đủ.');
      return;
    }
    setIsSyncing(true);
    try {
      const config: FirebaseConfig = {
        apiKey: fbApiKey.trim(),
        authDomain: fbAuthDomain.trim(),
        projectId: fbProjectId.trim(),
        storageBucket: fbStorageBucket.trim(),
        messagingSenderId: fbMessagingSenderId.trim(),
        appId: fbAppId.trim(),
        measurementId: fbMeasurementId.trim() || undefined
      };
      
      // Save settings to localstorage first to make sure UI states match
      saveFirebaseConfig(config, fbCenterId.trim(), fbAutoSync);
      setIsConfigured(true);

      const dbState = getDB();
      await pushToFirebase(fbCenterId.trim(), dbState, config);
      const nowStr = new Date().toISOString();
      setLastSyncedTime(nowStr);
      
      setSaveToastMsg('Đã tải (Push) dữ liệu thành công lên Firebase Firestore!');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert(`Đồng bộ thất bại: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFirebase = async () => {
    if (!fbApiKey || !fbProjectId || !fbAppId) {
      alert('Chưa cấu hình Firebase đầy đủ.');
      return;
    }
    if (confirm('CẢNH BÁO: Dữ liệu trên đám mây sẽ ghi đè HOÀN TOÀN dữ liệu cục bộ trên máy này. Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tải (Pull) dữ liệu về không?')) {
      setIsSyncing(true);
      try {
        const config: FirebaseConfig = {
          apiKey: fbApiKey.trim(),
          authDomain: fbAuthDomain.trim(),
          projectId: fbProjectId.trim(),
          storageBucket: fbStorageBucket.trim(),
          messagingSenderId: fbMessagingSenderId.trim(),
          appId: fbAppId.trim(),
          measurementId: fbMeasurementId.trim() || undefined
        };
        const pulledState = await pullFromFirebase(fbCenterId.trim(), config);
        if (pulledState) {
          saveDB(pulledState, true); // skip firebase push loop
          setSaveToastMsg('Tải dữ liệu thành công! Đang tải lại trang...');
          setShowSaveToast(true);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert('Không tìm thấy dữ liệu cho trung tâm này trên đám mây.');
        }
      } catch (e: any) {
        console.error(e);
        alert(`Tải dữ liệu thất bại: ${e.message || JSON.stringify(e)}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      alert('Vui lòng nhập tên quy tắc.');
      return;
    }

    const newRule: PointRule = {
      id: `rule-${newRuleType}-${Date.now()}`,
      name: newRuleName.trim(),
      points: Math.max(1, newRulePoints),
      type: newRuleType
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    savePointRules(updatedRules);

    setNewRuleName('');
    setNewRulePoints(1);

    setSaveToastMsg('Đã thêm quy tắc điểm thi đua mới!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa quy tắc điểm này không?')) {
      const updatedRules = rules.filter(r => r.id !== id);
      setRules(updatedRules);
      savePointRules(updatedRules);

      setSaveToastMsg('Đã xóa quy tắc điểm thành công!');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  const handleRuleChange = (id: string, field: 'name' | 'points', value: string | number) => {
    const updatedRules = rules.map(r => {
      if (r.id === id) {
        if (field === 'points') {
          return { ...r, points: Math.max(1, Number(value)) };
        } else {
          return { ...r, name: String(value) };
        }
      }
      return r;
    });
    setRules(updatedRules);
  };

  const handleSaveRules = () => {
    // Validate rules
    const hasEmptyName = rules.some(r => !r.name.trim());
    if (hasEmptyName) {
      alert('Tên các quy tắc điểm không được để trống.');
      return;
    }

    savePointRules(rules);
    setSaveToastMsg('Đã lưu cấu hình quy tắc điểm thi đua thành công!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  if (!mounted) {
    return <div className="loading-state">Đang tải cấu hình cài đặt...</div>;
  }

  // Pre-generate dynamic VietQR preview URL for visual feedback
  const previewMemo = "GENICENTER DONG HOC PHI";
  const previewQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo || '0000000000'}-compact2.png?amount=500000&addInfo=${encodeURIComponent(previewMemo)}&accountName=${encodeURIComponent(accountName || 'CHUYEN KHOAN MAU')}`;

  const plusRules = rules.filter(r => r.type === 'plus');
  const minusRules = rules.filter(r => r.type === 'minus');

  return (
    <div className="settings-wrapper">
      {/* Toast Save Settings */}
      {showSaveToast && (
        <div className="toast-alert alert alert-success">
          <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline' }} />
          {saveToastMsg}
        </div>
      )}

      <div className="section-header">
        <div>
          <h2 className="section-title">Cài đặt Hệ thống</h2>
          <p className="section-desc">Cấu hình thông tin thanh toán học phí và các quy tắc thi đua học sinh.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Side - Configuration Form */}
        <div className="settings-form-panel">
          <form onSubmit={handleSaveBank} className="card glass">
            <div className="card-header-inner" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CreditCard className="text-primary" size={22} />
              <h3 className="card-title">Cấu hình Tài khoản Ngân hàng (VietQR)</h3>
            </div>

            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Thông tin này sẽ được dùng để tự động tạo mã QR thanh toán (VietQR) đính kèm trên trang báo cáo học tập gửi cho phụ huynh. Khi phụ huynh quét mã, app ngân hàng sẽ tự điền đúng số tài khoản, số tiền nợ học phí và nội dung chuyển khoản.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tên Ngân hàng</label>
              <select 
                className="form-input select-input"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
              >
                {popularBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Số tài khoản</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nhập số tài khoản ngân hàng chính xác..."
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value.replace(/\s/g, ''))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tên chủ tài khoản (Viết hoa không dấu)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ví dụ: NGUYEN VAN A"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '28px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }}>
                <Save size={16} />
                <span>Lưu cấu hình thanh toán</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - VietQR Visual Preview */}
        <div className="settings-preview-panel">
          <div className="card glass text-center-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Xem trước Mã QR chuyển khoản</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '280px', textAlign: 'center' }}>
              Dưới đây là bản xem trước của mã QR phụ huynh sẽ quét (Ví dụ số tiền: 500,000đ).
            </p>
            
            <div className="qr-preview-box-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '14px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewQrUrl} 
                alt="Bản xem trước mã VietQR" 
                style={{ width: '150px', height: '150px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', marginTop: '8px', letterSpacing: '0.05em' }}>
                VietQR Napas 247
              </span>
            </div>

            <div className="preview-details-box" style={{ marginTop: '20px', width: '100%', maxWidth: '300px', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngân hàng:</span>
                <strong>{popularBanks.find(b => b.id === bankId)?.name.split(' - ')[0] || bankId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tài khoản:</span>
                <strong>{accountNo || 'Chưa nhập'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản:</span>
                <strong>{accountName || 'Chưa nhập'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Sync Management Section */}
      <div className="firebase-sync-section" style={{ marginTop: '8px' }}>
        <div className="card glass">
          <div className="card-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cloud className="text-primary" size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Đồng bộ đám mây (Firebase Firestore)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Kết nối Cloud Firestore để sao lưu dữ liệu trung tâm và đồng bộ hóa thời gian thực giữa các thiết bị.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isConfigured ? (
                <span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Wifi size={14} />
                  <span>Đã kết nối</span>
                </span>
              ) : (
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <WifiOff size={14} />
                  <span>Chưa cấu hình</span>
                </span>
              )}
            </div>
          </div>

          <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Left side: Config parsing and status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Mẹo điền nhanh:</strong> Bạn có thể sao chép toàn bộ khối mã cấu hình <code>{"const firebaseConfig = { ... };"}</code> từ Firebase Console và dán vào ô bên dưới, hệ thống sẽ tự động phân tách và điền tất cả các thông số bên phải cho bạn!
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dán mã cấu hình Firebase SDK (Tùy chọn)</label>
                <textarea
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', minHeight: '120px', resize: 'vertical' }}
                  placeholder="const firebaseConfig = {&#10;  apiKey: &quot;...&quot;,&#10;  authDomain: &quot;...&quot;,&#10;  projectId: &quot;...&quot;,&#10;  ...&#10;};"
                  value={fbRawConfig}
                  onChange={(e) => handleParseRawConfig(e.target.value)}
                />
              </div>

              <div className="sync-actions-panel" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Đồng bộ thủ công & Quản lý</h4>
                
                {lastSyncedTime && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Đồng bộ lần cuối: <strong>{new Date(lastSyncedTime).toLocaleString('vi-VN')}</strong>
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handlePushFirebase}
                    disabled={isSyncing || !fbApiKey}
                    style={{ gap: '6px', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    <span>Đẩy lên Cloud (Push)</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handlePullFirebase}
                    disabled={isSyncing || !fbApiKey}
                    style={{ gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Database size={14} />
                    <span>Tải về máy (Pull)</span>
                  </button>

                  {isConfigured && (
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={handleDisconnectFirebase}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', gap: '6px', fontSize: '0.85rem', border: 'none' }}
                    >
                      <Trash2 size={14} />
                      <span>Xóa cấu hình</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Config Fields */}
            <form onSubmit={handleSaveFirebase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Mã trung tâm (Center ID)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbCenterId}
                    onChange={(e) => setFbCenterId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="ví dụ: toanl2k"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Project ID *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="ví dụ: toanl2k"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>API Key *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>App ID *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  placeholder="1:890950041993:web:..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Auth Domain</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbAuthDomain}
                    onChange={(e) => setFbAuthDomain(e.target.value)}
                    placeholder="toanl2k.firebaseapp.com"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Storage Bucket</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbStorageBucket}
                    onChange={(e) => setFbStorageBucket(e.target.value)}
                    placeholder="toanl2k.firebasestorage.app"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Messaging Sender ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbMessagingSenderId}
                    onChange={(e) => setFbMessagingSenderId(e.target.value)}
                    placeholder="890950041993"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Measurement ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fbMeasurementId}
                    onChange={(e) => setFbMeasurementId(e.target.value)}
                    placeholder="G-TV60DNJ0PM"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: '10px 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="fbAutoSyncCheckbox"
                  checked={fbAutoSync}
                  onChange={(e) => setFbAutoSync(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="fbAutoSyncCheckbox" style={{ fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                  Tự động đồng bộ hóa đám mây trong nền khi dữ liệu cục bộ thay đổi
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }} disabled={isSyncing}>
                <Save size={16} />
                <span>Lưu & Kích hoạt đồng bộ</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Point Rules Management Section */}
      <div className="point-rules-section">
        <div className="card glass">
          <div className="card-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award className="text-primary" size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Quy tắc cộng/trừ điểm thi đua</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Thiết lập điểm thưởng và điểm phạt áp dụng khi đánh giá học sinh theo buổi học.</p>
              </div>
            </div>
            <button onClick={handleSaveRules} className="btn btn-primary" style={{ gap: '8px' }}>
              <Save size={16} />
              <span>Lưu tất cả quy tắc</span>
            </button>
          </div>

          <div className="rules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            {/* Plus Rules Column */}
            <div className="rules-column">
              <h4 className="column-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', borderBottom: '2px solid var(--success-light)', paddingBottom: '8px', marginBottom: '16px', fontWeight: 700 }}>
                <span>Điểm cộng (+)</span>
                <span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{plusRules.length} quy tắc</span>
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plusRules.length === 0 ? (
                  <p className="no-rules-text">Chưa có quy tắc cộng điểm nào.</p>
                ) : (
                  plusRules.map(rule => (
                    <div key={rule.id} className="rule-item-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-input rule-name-input" 
                        value={rule.name}
                        onChange={(e) => handleRuleChange(rule.id, 'name', e.target.value)}
                        placeholder="Tên quy tắc điểm cộng..."
                        style={{ flex: 1 }}
                      />
                      <div className="points-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '90px' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>+</span>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={rule.points}
                          onChange={(e) => handleRuleChange(rule.id, 'points', e.target.value)}
                          min="1"
                          style={{ width: '60px', textAlign: 'center', padding: '8px 4px' }}
                        />
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="btn-icon-delete"
                        title="Xóa quy tắc"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Minus Rules Column */}
            <div className="rules-column">
              <h4 className="column-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', borderBottom: '2px solid var(--danger-light)', paddingBottom: '8px', marginBottom: '16px', fontWeight: 700 }}>
                <span>Điểm trừ (-)</span>
                <span className="badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{minusRules.length} quy tắc</span>
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {minusRules.length === 0 ? (
                  <p className="no-rules-text">Chưa có quy tắc trừ điểm nào.</p>
                ) : (
                  minusRules.map(rule => (
                    <div key={rule.id} className="rule-item-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-input rule-name-input" 
                        value={rule.name}
                        onChange={(e) => handleRuleChange(rule.id, 'name', e.target.value)}
                        placeholder="Tên quy tắc điểm trừ..."
                        style={{ flex: 1 }}
                      />
                      <div className="points-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '90px' }}>
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-</span>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={rule.points}
                          onChange={(e) => handleRuleChange(rule.id, 'points', e.target.value)}
                          min="1"
                          style={{ width: '60px', textAlign: 'center', padding: '8px 4px' }}
                        />
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="btn-icon-delete"
                        title="Xóa quy tắc"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Add New Rule Form */}
          <div className="add-rule-card-inner" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} className="text-primary" />
              <span>Thêm quy tắc thi đua mới</span>
            </h4>
            <form onSubmit={handleAddRule} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Tên quy tắc</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Hăng hái đóng góp ý kiến, Quên đem sách..." 
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Số điểm</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" 
                  value={newRulePoints}
                  onChange={(e) => setNewRulePoints(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group" style={{ width: '160px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Phân loại</label>
                <select 
                  className="form-input select-input"
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as 'plus' | 'minus')}
                >
                  <option value="plus">Điểm cộng (+)</option>
                  <option value="minus">Điểm trừ (-)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ height: '42px', padding: '0 20px', display: 'flex', gap: '8px' }}>
                <Plus size={16} />
                <span>Thêm</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .rules-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
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

        .no-rules-text {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 10px 0;
        }

        .btn-icon-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background-color: var(--danger-light);
          color: var(--danger);
          border: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-icon-delete:hover {
          background-color: var(--danger);
          color: var(--text-inverse);
          transform: scale(1.05);
        }

        .rule-name-input {
          font-weight: 500;
        }

        .point-rules-section {
          margin-top: 8px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
