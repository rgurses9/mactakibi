import React, { useState, useEffect, useMemo } from 'react';
import MatchList from './components/MatchList';
import WhatsAppSender from './components/WhatsAppSender';
import ScriptGenerator from './components/ScriptGenerator';
import NotificationPanel from './components/NotificationPanel';
import TrafficLogger, { LogEntry } from './components/TrafficLogger';
import FirebaseSettings from './components/FirebaseSettings';
import { autoScanDriveFolder } from './services/driveService';
import { initFirebase, subscribeToMatches } from './services/firebaseService';
import { MatchDetails } from './types';
import { isPastDate, parseDate } from './utils/dateHelpers';
import { 
  RefreshCw, Bot, Folder, User, 
  Calendar, CheckCircle, Briefcase, Clock, Shield, FileText,
  Activity, Settings, Flame
} from 'lucide-react';

// Default configuration provided by user
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
  authDomain: "mactakibi-50e0b.firebaseapp.com",
  projectId: "mactakibi-50e0b",
  storageBucket: "mactakibi-50e0b.firebasestorage.app",
  messagingSenderId: "529275453572",
  appId: "1:529275453572:web:4d6102920b55724e5902d1",
  measurementId: "G-V793VBMXF7",
  databaseURL: "https://mactakibi-50e0b.firebaseio.com"
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automation'>('dashboard');
  
  const [matches, setMatches] = useState<MatchDetails[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);
  
  // Firebase State
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  
  // Real-time Traffic Logs
  const [trafficLogs, setTrafficLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    setTrafficLogs(prev => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        message,
        type
      };
      // Keep last 100 logs to prevent memory issues
      return [...prev.slice(-99), newLog];
    });
  };

  // Initial Firebase Setup
  useEffect(() => {
    // Check local storage first, otherwise use default config
    let config = DEFAULT_FIREBASE_CONFIG;
    const savedConfig = localStorage.getItem('firebase_config');
    
    if (savedConfig) {
      try {
        config = JSON.parse(savedConfig);
      } catch (e) {
        console.error("Local config parse error, using default", e);
      }
    }

    try {
      const success = initFirebase(config);
      if (success) {
        setIsFirebaseActive(true);
        addLog("Firebase başlatıldı. Canlı veri dinleniyor...", 'success');
        
        // Subscribe immediately
        const unsubscribe = subscribeToMatches((liveMatches) => {
            const count = liveMatches.length;
            addLog(`🔥 Firebase Update: ${count} maç alındı.`, 'network');
            
            // Filter past dates
            const activeMatches = liveMatches.filter(m => !isPastDate(m.date, m.time));
            setMatches(activeMatches);
            setLastUpdated(new Date().toLocaleString('tr-TR'));
            
        }, (errMsg) => {
            addLog(`Firebase Hatası: ${errMsg}`, 'error');
        });

        return () => unsubscribe();
      }
    } catch (e: any) {
      console.error(e);
      addLog(`Firebase Init Error: ${e.message}`, 'error');
    }
  }, []);

  // Auto-scan on mount (Only if Firebase NOT active)
  useEffect(() => {
    if (!hasAutoScanned && !isFirebaseActive) {
        handleAutoScan();
        setHasAutoScanned(true);
    }
    if (!lastUpdated) setLastUpdated(new Date().toLocaleString('tr-TR'));
    
    // Auto refresh interval if enabled (only for Drive scan)
    const interval = setInterval(() => {
        if (autoRefresh && !isAnalyzing && !isFirebaseActive) {
            handleAutoScan();
        }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, hasAutoScanned, isFirebaseActive]);

  const handleAutoScan = async () => {
      if (isFirebaseActive) {
         addLog("Firebase aktif. Manuel tarama devre dışı.", 'warning');
         return;
      }

      setIsAnalyzing(true);
      setError(null);
      setProgress("Arka planda taranıyor...");
      addLog("Otomatik Drive taraması başlatıldı.", 'info');
      
      try {
          const driveMatches = await autoScanDriveFolder((msg, type) => {
              setProgress(msg);
              // Map basic progress to traffic logs
              const logType = type === 'network' ? 'network' : 'info';
              addLog(msg, logType);
          });
          
          addLog(`${driveMatches.length} adet ham veri çekildi.`, 'success');

          // Filter: Only keep matches where date/time has NOT passed
          // isPastDate checks both date AND time now
          const activeMatches = driveMatches.filter(m => !isPastDate(m.date, m.time));
          
          if (driveMatches.length > activeMatches.length) {
              addLog(`${driveMatches.length - activeMatches.length} geçmiş maç filtrelendi.`, 'warning');
          }

          setMatches(activeMatches);
          setLastUpdated(new Date().toLocaleString('tr-TR'));
          addLog("Tarama ve analiz tamamlandı.", 'success');
      } catch (err: any) {
          console.error(err);
          setError(`Hata: ${err.message}`);
          addLog(`HATA: ${err.message}`, 'error');
      } finally {
          setIsAnalyzing(false);
          setProgress("");
      }
  };

  const handleRefresh = () => {
     if (isFirebaseActive) {
       // Just trigger a dummy log to show it's live
       addLog("Veri canlı (Firebase). Manuel yenilemeye gerek yok.", 'success');
     } else {
       handleAutoScan();
     }
  };

  // Stats Calculations
  const activeMatchCount = matches.length;
  
  const nextMatchDate = useMemo(() => {
      if (matches.length === 0) return "-";
      // Sort to find the earliest date
      const sorted = [...matches].sort((a, b) => {
          const da = parseDate(a.date);
          const db = parseDate(b.date);
          if (!da || !db) return 0;
          return da.getTime() - db.getTime();
      });
      return sorted[0].date;
  }, [matches]);

  const activeFilesCount = useMemo(() => {
      const uniqueFiles = new Set(matches.map(m => m.sourceFile));
      return uniqueFiles.size;
  }, [matches]);

  // Generate notifications from matches
  const notifications = useMemo(() => {
    const grouped = matches.reduce((acc, match) => {
      const file = match.sourceFile || 'Dosya';
      if (!acc[file]) acc[file] = 0;
      acc[file]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([file, count], index) => ({
      id: `notif-${index}`,
      file,
      count,
      time: lastUpdated
    }));
  }, [matches, lastUpdated]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans pb-24">
      <FirebaseSettings 
        isOpen={isFirebaseOpen} 
        onClose={() => setIsFirebaseOpen(false)} 
        onSave={(config) => {
            if(initFirebase(config)) {
                setIsFirebaseActive(true);
                window.location.reload(); // Reload to start fresh subscription
            }
        }}
      />

      {/* --- TOP HEADER (Simplified) --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Shield size={20} />
                </div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">Maç Takip Paneli</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Panel
                    </button>
                    <button 
                        onClick={() => setActiveTab('automation')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'automation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Bot
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- HERO (Clean) --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
                    <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md ring-4 ring-blue-50">
                        RG
                    </div>
                    </div>
                    <div>
                    <h2 className="text-2xl font-bold text-gray-800">Hoş Geldiniz, Rıfat Bey</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Sadece güncel ve saati gelmemiş müsabakalar listelenir.</p>
                    </div>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Stats & Matches (Span 8) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Aktif Görevler</div>
                                <div className="text-3xl font-extrabold text-blue-600">{activeMatchCount}</div>
                            </div>
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                <Briefcase size={24} />
                            </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Sıradaki</div>
                                <div className="text-xl font-extrabold text-gray-900 truncate">{nextMatchDate}</div>
                            </div>
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                                <Calendar size={24} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Kaynaklar</div>
                                <div className="text-3xl font-extrabold text-gray-900">{activeFilesCount}</div>
                            </div>
                            <div className="bg-purple-50 text-purple-500 p-3 rounded-lg">
                                <FileText size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
                             <div className="bg-red-100 p-1.5 rounded-full mt-0.5"><Bot size={16} /></div>
                             <div>
                                <strong>Bağlantı Hatası:</strong> 
                                <p className="mt-1 opacity-90">{error}</p>
                             </div>
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {!isAnalyzing && matches.length === 0 && !error && (
                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Folder size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Aktif Maç Bulunamadı</h3>
                            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                                {isFirebaseActive 
                                  ? "Firebase üzerinde güncel kayıt bulunamadı."
                                  : "Google Drive'da 'RIFAT GÜRSES' için tanımlanmış güncel veya gelecek tarihli maç bulunamadı."
                                }
                                <br/><span className="text-xs text-gray-400 opacity-75">(Saati geçen maçlar otomatik olarak gizlenir)</span>
                            </p>
                        </div>
                    )}

                    {/* Matches List */}
                    {matches.length > 0 && (
                        <MatchList matches={matches} />
                    )}

                    {/* Actions */}
                     {matches.length > 0 && (
                        <WhatsAppSender matches={matches} />
                    )}
                </div>

                {/* Right Column: Notifications & Info (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    <NotificationPanel notifications={notifications} />
                    
                    {/* Real-time Traffic Logger */}
                    <TrafficLogger logs={trafficLogs} />

                    {/* System Status - Moved to background/subtle */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm">
                            <Activity size={16} className="text-gray-400" />
                            Sistem Durumu
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                <span>Bot Servisi</span>
                                <span className="flex items-center gap-1.5 text-green-600 font-bold">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseActive ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                                    {isFirebaseActive ? 'Firebase Live' : 'Drive Polling'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                <span>Filtreleme</span>
                                <span className="text-gray-700">Geçmiş & Tamamlanan Gizli</span>
                            </div>
                            <div className="flex items-center justify-between text-xs pb-2">
                                <span>Son Kontrol</span>
                                <span className="font-mono text-gray-600">{lastUpdated.split(' ')[1]}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )}

        {activeTab === 'automation' && (
           <ScriptGenerator />
        )}
      </main>

      {/* --- BOTTOM FOOTER (Fixed) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
            
            {/* Left: Version & Copyright */}
            <div className="text-gray-400 font-medium">
                Rıfat Gürses v9.2 &copy; 2025
            </div>

            {/* Center: Status Text */}
            <div className="text-gray-500 font-medium hidden md:block">
               {isAnalyzing ? (
                   <span className="flex items-center gap-2 text-blue-600">
                       <RefreshCw size={12} className="animate-spin" />
                       {progress}
                   </span>
               ) : (
                   <span className="opacity-50">Sistem hazır.</span>
               )}
            </div>

            {/* Right: Controls (Background) */}
            <div className="flex items-center gap-4">
                 <button
                    onClick={() => setIsFirebaseOpen(true)}
                    className="flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors"
                    title="Firebase Ayarları"
                 >
                    <Flame size={14} className={isFirebaseActive ? "text-orange-500 fill-orange-500" : ""} />
                 </button>

                 {!isFirebaseActive && (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 hover:text-gray-900 transition-colors">
                        <input 
                        type="checkbox" 
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 w-3.5 h-3.5" 
                        />
                        Otomatik Yenile
                    </label>
                 )}
                
                <button 
                    onClick={handleRefresh}
                    disabled={isAnalyzing}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded border border-gray-200 flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                    {isAnalyzing ? "Taranıyor" : "Yenile"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;