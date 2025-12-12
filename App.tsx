import React, { useState, useEffect, useMemo } from 'react';
import MatchList from './components/MatchList';
import WhatsAppSender from './components/WhatsAppSender';
import ScriptGenerator from './components/ScriptGenerator';
import NotificationPanel from './components/NotificationPanel';
import { autoScanDriveFolder } from './services/driveService';
import { MatchDetails } from './types';
import { isPastDate } from './utils/dateHelpers';
import { 
  RefreshCw, Bot, Folder, User, 
  Calendar, CheckCircle, Briefcase, Clock, Shield
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automation'>('dashboard');
  
  const [matches, setMatches] = useState<MatchDetails[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);

  // Auto-scan on mount
  useEffect(() => {
    if (!hasAutoScanned) {
        handleAutoScan();
        setHasAutoScanned(true);
    }
    setLastUpdated(new Date().toLocaleString('tr-TR'));
    
    // Auto refresh interval if enabled
    const interval = setInterval(() => {
        if (autoRefresh && !isAnalyzing) {
            handleAutoScan();
        }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, hasAutoScanned]);

  const handleAutoScan = async () => {
      setIsAnalyzing(true);
      setError(null);
      setProgress("Veriler güncelleniyor...");
      
      try {
          const driveMatches = await autoScanDriveFolder((msg) => setProgress(msg));
          setMatches(driveMatches);
          setLastUpdated(new Date().toLocaleString('tr-TR'));
      } catch (err: any) {
          console.error(err);
          setError(`Hata: ${err.message}`);
      } finally {
          setIsAnalyzing(false);
          setProgress("");
      }
  };

  const handleRefresh = () => {
     handleAutoScan();
  };

  // Stats
  const totalMatches = matches.length;
  const pastMatches = matches.filter(m => isPastDate(m.date)).length;
  const futureMatches = totalMatches - pastMatches;

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
    <div className="min-h-screen bg-gray-50/50 font-sans pb-12">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Shield size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight">Maç Takip Paneli</h1>
                    <div className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Rıfat Gürses v9.0</div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Clock size={12} />
                    Son Güncelleme: <span className="font-semibold text-gray-700">{lastUpdated}</span>
                </div>
                
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

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
                        Bot Ayarları
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- HERO / CONTROLS --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white">
                            RG
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-gray-800">Hoş Geldiniz, Rifat Bey</h2>
                        <p className="text-gray-500 text-sm">Güncel maç programınız ve görevleriniz aşağıdadır.</p>
                     </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm select-none">
                        <input 
                        type="checkbox" 
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                        />
                        <span className={autoRefresh ? "text-blue-600" : "text-gray-500"}>Otomatik Yenile</span>
                    </label>
                    <button 
                        onClick={handleRefresh}
                        disabled={isAnalyzing}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-md active:scale-95 transform duration-150"
                    >
                        <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
                        {isAnalyzing ? "Taranıyor..." : "Programı Yenile"}
                    </button>
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
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                            <div>
                                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Toplam Görev</div>
                                <div className="text-3xl font-extrabold text-gray-900">{totalMatches}</div>
                            </div>
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Briefcase size={24} />
                            </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-green-300 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">Gelecek Maçlar</div>
                                <div className="text-3xl font-extrabold text-gray-900">{futureMatches}</div>
                            </div>
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg relative z-10 group-hover:bg-green-100 transition-colors">
                                <Calendar size={24} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-gray-300 transition-colors">
                            <div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Tamamlanan</div>
                                <div className="text-3xl font-extrabold text-gray-900">{pastMatches}</div>
                            </div>
                            <div className="bg-gray-100 text-gray-500 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Scanning Indicator */}
                    {isAnalyzing && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                            <div className="animate-spin text-blue-600 bg-white p-2 rounded-full shadow-sm"><RefreshCw size={20} /></div>
                            <div>
                                <div className="text-blue-900 font-bold text-sm">{progress}</div>
                                <div className="text-xs text-blue-600">Google Drive verileri çekiliyor...</div>
                            </div>
                        </div>
                    )}

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
                            <h3 className="text-lg font-bold text-gray-800">Maç Bulunamadı</h3>
                            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                                Google Drive klasöründe "RIFAT GÜRSES" ismine sahip herhangi bir maç ataması bulunamadı.
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
                    <div className="sticky top-24 space-y-6">
                        <NotificationPanel notifications={notifications} />
                        
                        {/* Additional Info Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                             <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                <Bot size={120} />
                             </div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2 relative z-10">
                                <Bot size={18} className="text-blue-300" />
                                Sistem Durumu
                            </h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                                    <span className="text-blue-200">Bot Durumu</span>
                                    <span className="flex items-center gap-1.5 text-green-400 font-bold">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                        Aktif
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                                    <span className="text-blue-200">Tarama Aralığı</span>
                                    <span className="text-white">5 Dakika</span>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">İzlenen Klasör</div>
                                    <div className="text-xs text-blue-100 bg-black/20 px-2 py-1.5 rounded font-mono break-all border border-white/10">
                                        0ByPao_qBUjN-YXJZSG5Fancybmc
                                    </div>
                                </div>
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
    </div>
  );
};

export default App;