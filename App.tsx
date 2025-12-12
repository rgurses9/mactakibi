import React, { useState, useEffect, useMemo } from 'react';
import MatchList from './components/MatchList';
import WhatsAppSender from './components/WhatsAppSender';
import ScriptGenerator from './components/ScriptGenerator';
import FirebaseSettings from './components/FirebaseSettings';
import FileUpload from './components/FileUpload';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel'; // Import Admin Panel
import { autoScanDriveFolder } from './services/driveService';
import { findMatchesInExcel, findMatchesInRawData } from './services/excelService';
import { initFirebase, subscribeToMatches, subscribeToAuthChanges, logoutUser } from './services/firebaseService';
import { MatchDetails } from './types';
import { isPastDate, parseDate } from './utils/dateHelpers';
import {
    RefreshCw, Bot, Folder,
    Calendar, Briefcase, Shield,
    Settings, Flame, X, Upload, LogOut, User as UserIcon,
    Sun, Moon, Monitor, ShieldAlert
} from 'lucide-react';
import firebase from 'firebase/compat/app';

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

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<firebase.User | null>(null);
    const [authInitialized, setAuthInitialized] = useState(false);

    const [matches, setMatches] = useState<MatchDetails[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>("");

    // Time State for dynamic filtering
    const [currentTime, setCurrentTime] = useState(new Date());

    const [autoRefresh, setAutoRefresh] = useState(true);
    const [hasAutoScanned, setHasAutoScanned] = useState(false);

    // Firebase State
    const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
    const [isFirebaseActive, setIsFirebaseActive] = useState(false);

    // Bot Settings State
    const [isBotSettingsOpen, setIsBotSettingsOpen] = useState(false);
    const [botConfig, setBotConfig] = useState<{ phone: string, apiKey: string }>(() => {
        const saved = localStorage.getItem('bot_config');
        return saved ? JSON.parse(saved) : { phone: '905307853007', apiKey: '7933007' };
    });

    // Admin Panel State
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // Theme State
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'system';
    });

    // Manual Upload Mode
    const [showManualUpload, setShowManualUpload] = useState(false);

    // Theme Logic
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        const applyTheme = (t: Theme) => {
            if (t === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
            } else {
                root.classList.add(t);
            }
        };

        applyTheme(theme);
        localStorage.setItem('theme', theme);

        // Listen for system changes if theme is system
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                root.classList.remove('light', 'dark');
                root.classList.add(mediaQuery.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun size={18} className="text-orange-500" />;
        if (theme === 'dark') return <Moon size={18} className="text-blue-400" />;
        return <Monitor size={18} className="text-gray-500 dark:text-gray-400" />;
    };

    const getThemeLabel = () => {
        if (theme === 'light') return 'Açık';
        if (theme === 'dark') return 'Koyu';
        return 'Sistem';
    };

    // Internal logging
    const addLog = (message: string, type: string = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    };

    const handleBotConfigSave = (newConfig: { phone: string, apiKey: string }) => {
        setBotConfig(newConfig);
        localStorage.setItem('bot_config', JSON.stringify(newConfig));
        setIsBotSettingsOpen(false);
    };

    /**
     * Dynamically filters matches based on the logged-in user's name.
     */
    const filterForUser = (list: MatchDetails[], currentUser: firebase.User | null) => {
        if (!currentUser || !currentUser.displayName) return [];

        // Normalize function for Turkish characters
        const norm = (str: string) => str ? str.toLocaleUpperCase('tr-TR')
            .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
            .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C') : "";

        // Split user name into parts (e.g. "Rıfat Gürses" -> ["RIFAT", "GURSES"])
        const userParts = norm(currentUser.displayName).split(' ').filter(p => p.length > 1);

        return list.filter(m => {
            const scorer = norm(m.scorer);
            const timer = norm(m.timer);
            const shotClock = norm(m.shotClock);

            // Check if ALL parts of the user's name exist in any of the columns
            const containsName = (columnValue: string) => {
                return userParts.every(part => columnValue.includes(part));
            };

            return containsName(scorer) || containsName(timer) || containsName(shotClock);
        });
    };

    // Initialize Firebase Auth only (no data subscription - using Drive scanning instead)
    useEffect(() => {
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
                // Firebase is initialized but we're NOT setting isFirebaseActive to true
                // This means we'll use Google Drive scanning instead of Firebase data
                addLog("Firebase Auth başlatıldı. Drive taraması kullanılacak.", 'success');

                // Subscribe to Auth only
                const unsubscribeAuth = subscribeToAuthChanges((currentUser) => {
                    setUser(currentUser);
                    setAuthInitialized(true);
                });

                return () => {
                    unsubscribeAuth();
                };
            }
        } catch (e: any) {
            console.error(e);
            addLog(`Firebase Init Error: ${e.message}`, 'error');
            setAuthInitialized(true);
        }
    }, []);

    // Update current time every minute to refresh list filtering
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // 1 minute
        return () => clearInterval(timer);
    }, []);

    // Separate Effect for Data Subscription dependent on User
    useEffect(() => {
        if (!isFirebaseActive || !user) return;

        // Log that automatic scanning has started for this user
        addLog(`👤 ${user.displayName} için maç taraması başlatılıyor...`, 'info');

        const unsubscribeData = subscribeToMatches((liveMatches) => {
            const count = liveMatches.length;
            // Filter specifically for the logged in user
            const myMatches = filterForUser(liveMatches, user);

            addLog(`🔥 Veri Güncelleme: Toplam ${count}, ${user.displayName} için ${myMatches.length} maç bulundu`, 'network');
            setMatches(myMatches);
            setLastUpdated(new Date().toLocaleString('tr-TR'));
            setError(null);
        }, (errMsg) => {
            addLog(`Firebase Hatası: ${errMsg}`, 'error');
        });

        return () => unsubscribeData();
    }, [isFirebaseActive, user]);

    useEffect(() => {
        // Only auto scan if user is logged in
        if (!user) return;

        if (!hasAutoScanned && !isFirebaseActive) {
            handleAutoScan();
            setHasAutoScanned(true);
        }
        if (!lastUpdated) setLastUpdated(new Date().toLocaleString('tr-TR'));

        const interval = setInterval(() => {
            if (autoRefresh && !isAnalyzing && !isFirebaseActive) {
                handleAutoScan();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, hasAutoScanned, isFirebaseActive, user]);

    const handleAutoScan = async () => {
        if (isFirebaseActive) {
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setProgress("Arka planda taranıyor...");

        // Extract user name parts for filtering
        const userNameParts = user?.displayName
            ? user.displayName.toLocaleUpperCase('tr-TR')
                .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
                .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
                .split(' ').filter(p => p.length > 1)
            : undefined;

        addLog(`Otomatik Drive taraması başlatıldı: ${user?.displayName?.toLocaleUpperCase('tr-TR') || 'Kullanıcı belirsiz'}`, 'info');

        try {
            // Pass user name parts directly to Drive scanner for efficient filtering
            const driveMatches = await autoScanDriveFolder((msg, type) => {
                setProgress(msg);
                addLog(msg, type);
            }, userNameParts);

            addLog(`Tarama bitti. ${driveMatches.length} maç bulundu.`, 'success');
            setMatches(driveMatches);
            setLastUpdated(new Date().toLocaleString('tr-TR'));
            setShowManualUpload(false);
        } catch (err: any) {
            console.error(err);
            if (matches.length === 0) {
                setError(`Drive Bağlantı Hatası: ${err.message}`);
                setShowManualUpload(true);
            }
            addLog(`HATA: ${err.message}`, 'error');
        } finally {
            setIsAnalyzing(false);
            setProgress("");
        }
    };

    const handleManualFiles = async (files: File[]) => {
        setIsAnalyzing(true);
        setError(null);
        const newMatches: MatchDetails[] = [];

        try {
            for (const file of files) {
                setProgress(`${file.name} analiz ediliyor...`);
                let found: MatchDetails[] = [];

                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    found = await findMatchesInExcel(file);
                }

                newMatches.push(...found);
            }

            // Filter manually uploaded files for the user
            const myFoundMatches = filterForUser(newMatches, user);

            setMatches(prev => [...prev, ...myFoundMatches]);
            addLog(`Manuel yükleme: ${myFoundMatches.length} maç eklendi.`, 'success');
        } catch (e: any) {
            setError("Dosya işleme hatası: " + e.message);
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

    // Season cutoff: August 1, 2025
    const SEASON_CUTOFF = new Date(2025, 7, 1); // August is month 7 (0-indexed)

    const { currentSeasonMatches, pastSeasonMatches } = useMemo(() => {
        const currentSeason: MatchDetails[] = [];
        const pastSeason: MatchDetails[] = [];

        matches.forEach(m => {
            const matchDate = parseDate(m.date);
            if (matchDate && matchDate >= SEASON_CUTOFF) {
                currentSeason.push(m);
            } else {
                pastSeason.push(m);
            }
        });

        return { currentSeasonMatches: currentSeason, pastSeasonMatches: pastSeason };
    }, [matches]);

    const activeMatchCount = currentSeasonMatches.length;
    const pastMatchCount = pastSeasonMatches.length;

    // Check if logged in user is admin
    const isAdmin = user?.email === 'admin@admin.com';

    if (!authInitialized) {
        return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
            <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                <span className="text-gray-500 dark:text-gray-400 font-medium">Yükleniyor...</span>
            </div>
        </div>;
    }

    // If user is not logged in, show Auth Screen
    if (!user) {
        return <Auth />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 font-sans pb-24 transition-colors duration-300">

            <FirebaseSettings
                isOpen={isFirebaseOpen}
                onClose={() => setIsFirebaseOpen(false)}
                onSave={(config) => {
                    if (initFirebase(config)) {
                        setIsFirebaseActive(true);
                        window.location.reload();
                    }
                }}
            />

            {/* Admin Panel Component */}
            <AdminPanel
                isOpen={isAdminPanelOpen}
                onClose={() => setIsAdminPanelOpen(false)}
                currentUserEmail={user.email}
            />

            {isBotSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
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

            {/* HEADER SECTION - Theme Toggle Moved Here */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight hidden sm:block">Maç Takip Sistemi</h1>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Admin Button - Only visible to admin */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminPanelOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-red-200 dark:shadow-none"
                            >
                                <ShieldAlert size={14} />
                                <span className="hidden sm:inline">Yönetici Paneli</span>
                            </button>
                        )}

                        {/* Theme Toggle Button - Moved to Header */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={`Tema: ${getThemeLabel()}`}
                        >
                            {getThemeIcon()}
                        </button>

                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-bold border-l border-r border-gray-200 dark:border-gray-600 px-3 h-8">
                            <UserIcon size={16} className="text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">{user.displayName?.toLocaleUpperCase('tr-TR')}</span>
                        </div>

                        <button
                            onClick={logoutUser}
                            className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <LogOut size={14} />
                            Çıkış
                        </button>
                    </div>
                </div>
            </div>

            {/* WELCOME HERO SECTION */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md ring-4 ring-blue-50 dark:ring-blue-900">
                                {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'UR'}
                            </div>
                        </div>
                        <div>
                            {/* Updated Welcome Message */}
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Hoş Geldiniz, {user.displayName?.toLocaleUpperCase('tr-TR')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                                Hesabınız onaylandı. Sistemde <strong>{user.displayName?.toLocaleUpperCase('tr-TR')}</strong> adına tanımlı maçlar listelenmektedir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8">

                <div className="space-y-6">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors duration-300">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Aktif Görevler</div>
                                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{activeMatchCount}</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
                                <Briefcase size={24} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors duration-300">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pasif Görevler</div>
                                <div className="text-3xl font-extrabold text-gray-600 dark:text-gray-300">{pastMatchCount}</div>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded-lg">
                                <Calendar size={24} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
                            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full mt-0.5"><Bot size={16} /></div>
                            <div>
                                <strong>Bağlantı Hatası:</strong>
                                <p className="mt-1 opacity-90">{error}</p>
                                <p className="mt-2 text-xs opacity-75">
                                    Not: Google Drive API kotası dolmuş veya yetki eksik olabilir. Manuel yükleme alanını kullanabilirsiniz.
                                </p>
                            </div>
                        </div>
                    )}

                    {showManualUpload && !isFirebaseActive && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-4 text-orange-700 dark:text-orange-500">
                                <Upload size={20} />
                                <h3 className="font-bold">Manuel Dosya Yükle</h3>
                            </div>
                            <FileUpload onFilesSelect={handleManualFiles} isAnalyzing={isAnalyzing} />
                        </div>
                    )}

                    {!isAnalyzing && matches.length === 0 && !error && !showManualUpload && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-300">
                            <div className="bg-gray-50 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-600">
                                <Folder size={32} className="text-gray-300 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Aktif Maç Bulunamadı</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md mx-auto">
                                {isFirebaseActive
                                    ? `Firebase veritabanında '${user.displayName}' adına kayıtlı maç bulunamadı.`
                                    : `Google Drive'da '${user.displayName}' için tanımlanmış herhangi bir maç bulunamadı.`
                                }
                            </p>
                        </div>
                    )}

                    {currentSeasonMatches.length > 0 && (
                        <MatchList
                            matches={currentSeasonMatches}
                            title="2025-2026 Sezonu"
                            variant="active"
                        />
                    )}

                    {pastSeasonMatches.length > 0 && (
                        <MatchList
                            matches={pastSeasonMatches}
                            title="Geçmiş Sezonlar"
                            variant="past"
                        />
                    )}

                    {currentSeasonMatches.length > 0 && (
                        <WhatsAppSender matches={currentSeasonMatches} config={botConfig} />
                    )}

                </div>

            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
                    <div className="text-gray-400 font-medium">
                        Sistem v10.5 &copy; 2025
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 font-medium hidden md:block">
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
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
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsBotSettingsOpen(true)} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            <Settings size={14} />
                            <span className="hidden sm:inline">Bot Ayarları</span>
                        </button>
                        {!isFirebaseActive && (
                            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Oto. Yenile</span>
                            </label>
                        )}
                        <button onClick={handleRefresh} disabled={isAnalyzing} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
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