import React, { useState, useEffect, useMemo } from 'react';
import MatchList from './components/MatchList';
import WhatsAppSender from './components/WhatsAppSender';
import ScriptGenerator from './components/ScriptGenerator';
import FirebaseSettings from './components/FirebaseSettings';
import { autoScanDriveFolder } from './services/driveService';
import { initFirebase, subscribeToMatches } from './services/firebaseService';
import { MatchDetails } from './types';
import { isPastDate, parseDate } from './utils/dateHelpers';
import { 
  RefreshCw, Bot, Folder, 
  Calendar, Briefcase, Shield,
  Settings, Flame, X
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
  
  // Bot Settings State
  const [isBotSettingsOpen, setIsBotSettingsOpen] = useState(false);
  const [botConfig, setBotConfig] = useState<{phone: string, apiKey: string}>(() => {
    const saved = localStorage.getItem('bot_config');
    return saved ? JSON.parse(saved) : { phone: '905307853007', apiKey: '7933007' };
  });
  
  // Internal logging (console only now)
  const addLog = (message: string, type: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  };

  const handleBotConfigSave = (newConfig: {phone: string, apiKey: string}) => {
      setBotConfig(newConfig);
      localStorage.setItem('bot_config', JSON.stringify(newConfig));
      setIsBotSettingsOpen(false);
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
            
            // Store ALL matches, do not filter out past ones here
            setMatches(liveMatches);
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
              addLog(msg, type);
          });
          
          addLog(`${driveMatches.length} adet ham veri çekildi.`, 'success');

          // Store ALL matches found, separation happens in render
          setMatches(driveMatches);
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
       addLog("Veri canlı (Firebase). Manuel yenilemeye gerek yok.", 'success');
     } else {
       handleAutoScan();
     }
  };

  // Split matches into Active and Past
  const { upcomingMatches, pastMatches } = useMemo(() => {
      const upcoming: MatchDetails[] = [];
      const past: MatchDetails[] = [];
      
      matches.forEach(m => {
          // Changed: Passed m.time to isPastDate to check time for today's matches
          if (isPastDate(m.date, m.time)) {
              past.push(m);
          } else {
              upcoming.push(m);
          }
      });
      
      return { upcomingMatches: upcoming, pastMatches: past };
  }, [matches]);
  
  const activeMatchCount = upcomingMatches.length;

  const nextMatchDate = useMemo(() => {
      if (upcomingMatches.length === 0) return "-";
      // Sort to find the earliest date
      const sorted = [...upcomingMatches].sort((a, b) => {
          const da = parseDate(a.date);
          const db = parseDate(b.date);
          if (!da || !db) return 0;
          return da.getTime() - db.getTime();
      });
      return sorted[0].date;
  }, [upcomingMatches]);

  // Notifications logic removed as per user request

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans pb-24">
      
      {/* --- MODALS --- */}
      <FirebaseSettings 
        isOpen={isFirebaseOpen} 
        onClose={() => setIsFirebaseOpen(false)} 
        onSave={(config) => {
            if(initFirebase(config)) {
                setIsFirebaseActive(true);
                window.location.reload();
            }
        }}
      />

      {/* Bot Settings Modal */}
      {isBotSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-green-600 p-4 flex items-center justify-between text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Settings size={20} className="text-white" />
                        Bot Ayarları
                    </h3>
                    <button onClick={() => setIsBotSettingsOpen(false)} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <ScriptGenerator 
                        initialConfig={botConfig}
                        onSave={handleBotConfigSave}
                    />
                </div>
            </div>
        </div>
      )}

      {/* --- TOP HEADER --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Shield size={20} />
                </div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">Maç Takip Paneli</h1>
            </div>
        </div>
      </div>

      {/* --- HERO --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
                    <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md ring-4 ring-blue-50">
                        RG
                    </div>
                    </div>
                    <div>
                    <h2 className="text-2xl font-bold text-gray-800">Hoş Geldiniz, Rıfat Bey</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Bugün (saati gelmeyen) ve sonraki maçlar aktif, saati geçenler pasif listelenir.</p>
                    </div>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="space-y-6">
            
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
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
                                ? "Firebase üzerinde kayıt bulunamadı."
                                : "Google Drive'da 'RIFAT GÜRSES' için tanımlanmış herhangi bir maç bulunamadı."
                            }
                        </p>
                    </div>
                )}

                {/* Active Matches List */}
                {upcomingMatches.length > 0 && (
                    <MatchList 
                        matches={upcomingMatches} 
                        title="Aktif Görevler" 
                        variant="active" 
                    />
                )}

                {/* Past Matches List */}
                {pastMatches.length > 0 && (
                    <MatchList 
                        matches={pastMatches} 
                        title="Geçmiş Müsabakalar" 
                        variant="past" 
                    />
                )}

                {/* Actions */}
                {upcomingMatches.length > 0 && (
                    <WhatsAppSender matches={upcomingMatches} config={botConfig} />
                )}

        </div>

      </main>

      {/* --- BOTTOM FOOTER (Fixed) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
            
            {/* Left: Version & Copyright */}
            <div className="text-gray-400 font-medium">
                Rıfat Gürses v9.8 &copy; 2025
            </div>

            {/* Center: Status Text */}
            <div className="text-gray-500 font-medium hidden md:block">
               {isAnalyzing ? (
                   <span className="flex items-center gap-2 text-blue-600">
                       <RefreshCw size={12} className="animate-spin" />
                       {progress}
                   </span>
               ) : (
                   <span className="opacity-50">
                       {isFirebaseActive 
                        ? "Canlı Veri Modu" 
                        : (lastUpdated ? `Son Güncelleme: ${lastUpdated}` : "Sistem Hazır")}
                   </span>
               )}
            </div>

            {/* Right: Controls (Background) */}
            <div className="flex items-center gap-4">
                 <button
                    onClick={() => setIsBotSettingsOpen(true)}
                    className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors"
                    title="Bot Ayarları"
                 >
                    <Settings size={14} />
                    <span className="hidden sm:inline">Bot Ayarları</span>
                 </button>

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
                        <span className="hidden sm:inline">Oto. Yenile</span>
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