import React, { useState, useEffect, useMemo } from 'react';
// v4.0 - Latest Design 200px
import MatchList from './components/MatchListV4';
import WhatsAppSender from './components/WhatsAppSender';
import ScriptGenerator from './components/ScriptGenerator';
import FirebaseSettings from './components/FirebaseSettings';
import FileUpload from './components/FileUpload';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel'; // Import Admin Panel
import { MatchDetails, AnalysisResult } from './types';
import { getMatchId, getAllPaymentStatuses, savePaymentStatus, isMatchEligibleForPayment, getPaymentType, PaymentType, PAYMENT_RATES, PaymentStatus } from './services/paymentService';
import { autoScanDriveFolder } from './services/driveService';
import { findMatchesInExcel, findMatchesInRawData } from './services/excelService';
import { initFirebase, subscribeToMatches, subscribeToAuthChanges, logoutUser, updateUserBotConfig } from './services/firebaseService';
import { isPastDate, parseDate } from './utils/dateHelpers';
import FeeTable from './components/FeeTable';
import {
    Search, RefreshCw, Filter, Settings, Shield, User as UserIcon, LogOut, Check, X,
    Briefcase, AlertCircle, Upload, ShieldAlert, Bot, History as HistoryIcon,
    Folder, Calendar, Flame, ChevronDown, ChevronUp
} from 'lucide-react';
import firebase from 'firebase/compat/app';

// Default configuration provided by user
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
    authDomain: "mactakibi-50e0b.firebaseapp.com",
    projectId: "mactakibi-50e0b",
    storageBucket: "mactakibi-50e0b.firebaseapp.com",
    messagingSenderId: "529275453572",
    appId: "1:529275453572:web:4d6102920b55724e5902d1",
    measurementId: "G-V793VBMXF7",
    databaseURL: "https://mactakibi-50e0b-default-rtdb.firebaseio.com"
};



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

    // Fee List Modal State
    const [isFeeListOpen, setIsFeeListOpen] = useState(false);

    // Payment State
    const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentStatus>>({});
    const [paymentStats, setPaymentStats] = useState<{
        eligible: number;
        totalAmount: number;
        paidAmount: number;
        pendingCount: number;
        details: any[];
    }>({ eligible: 0, totalAmount: 0, paidAmount: 0, pendingCount: 0, details: [] });



    // Manual Upload Mode
    const [showManualUpload, setShowManualUpload] = useState(false);

    // Accordion State
    const [activeExpanded, setActiveExpanded] = useState(true);
    const [pastExpanded, setPastExpanded] = useState(false);

    // Force Light Mode
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
    }, []);

    // Internal logging
    const addLog = (message: string, type: string = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    };

    const handleBotConfigSave = (newConfig: { phone: string, apiKey: string }) => {
        setBotConfig(newConfig);
        localStorage.setItem('bot_config', JSON.stringify(newConfig));
        if (user) {
            updateUserBotConfig(user.uid, newConfig).catch(err => addLog(`Bot ayarları kaydedilemedi: ${err.message}`, 'error'));
        }
        setIsBotSettingsOpen(false);
    };

    /**
     * Dynamically filters matches based on the logged-in user's name.
     */
    const filterForUser = (list: MatchDetails[], currentUser: firebase.User | null) => {
        if (!currentUser || !currentUser.displayName) return [];

        // Enhanced normalize function for Turkish characters, dots, spaces
        const norm = (str: string) => str ? str
            .toLocaleUpperCase('tr-TR')
            .replace(/\./g, '')
            .replace(/\s+/g, ' ')
            .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
            .replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
            .replace(/ğ/g, 'G').replace(/ü/g, 'U').replace(/ş/g, 'S')
            .replace(/ı/g, 'I').replace(/ö/g, 'O').replace(/ç/g, 'C')
            .trim() : "";

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

                    // Load payment statuses immediately after user is identified
                    if (currentUser && currentUser.email) {
                        const statuses = getAllPaymentStatuses(currentUser.email);
                        setPaymentStatuses(statuses);
                    }
                });

                return () => {
                    unsubscribeAuth();
                };
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Bilinmeyen bir hata oluştu.");
            addLog(`Tarama Hatası: ${e.message}`, 'error');
            sendBotMessage(`❌ *SİSTEM HATASI (Drive)*\n\nHata: ${e.message}`);
        } finally {
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

            // Check for NEW matches in Firebase mode too
            const currentIds = new Set(matches.map(m => getMatchId(m)));
            const newMatchesDeep = myMatches.filter(m => !currentIds.has(getMatchId(m)));
            if (newMatchesDeep.length > 0 && matches.length > 0) {
                let notifyMsg = `🔥 *VERİTABANINA YENİ MAÇ GELDİ!*\n\n`;
                newMatchesDeep.forEach(m => {
                    notifyMsg += `🏀 ${m.teamA} vs ${m.teamB}\n📅 ${m.date} | ⏰ ${m.time}\n\n`;
                });
                sendBotMessage(notifyMsg);
            }

            addLog(`🔥 Veri Güncelleme: Toplam ${count}, ${user.displayName} için ${myMatches.length} maç bulundu`, 'network');
            setMatches(myMatches);
            setLastUpdated(new Date().toLocaleString('tr-TR'));
            setError(null);
        }, (errMsg) => {
            addLog(`Firebase Hatası: ${errMsg}`, 'error');
            sendBotMessage(`⚠️ *SİSTEM HATASI (Firebase)*\n\nMesaj: ${errMsg}`);
        });

        return () => unsubscribeData();
    }, [isFirebaseActive, user]);

    useEffect(() => {
        // Only auto scan if user is logged in
        if (!user) return;

        // Always check for new matches only - no full scan of old matches
        addLog(`👤 ${user.displayName} için giriş yapıldı. Yeni müsabaka kontrolü yapılacak.`, 'info');

        if (!hasAutoScanned && !isFirebaseActive) {
            handleAutoScan(); // Always check for new matches only
            setHasAutoScanned(true);
        }
        if (!lastUpdated) setLastUpdated(new Date().toLocaleString('tr-TR'));

        // Otomatik yenileme: Her 15 dakikada bir kontrol
        const interval = setInterval(() => {
            if (autoRefresh && !isAnalyzing && !isFirebaseActive) {
                handleAutoScan(); // Regular refresh checks for new matches every 15 minutes
            }
        }, 15 * 60 * 1000); // 15 dakika = 900000 ms

        return () => clearInterval(interval);
    }, [autoRefresh, hasAutoScanned, isFirebaseActive, user]);

    // Calculate Payment Stats whenever matches or statuses change
    useEffect(() => {
        let eligible = 0;
        let pendingCount = 0;
        let totalAmount = 0;
        let paidAmount = 0;
        const details: any[] = [];

        const seenIds = new Set<string>();

        matches.forEach(match => {
            const isPast = isPastDate(match.date, match.time);
            if (isPast && isMatchEligibleForPayment(match)) {
                const id = getMatchId(match);

                // PREVENT DUPLICATE COUNTING
                if (seenIds.has(id)) return;
                seenIds.add(id);

                const status = paymentStatuses[id] || { gsbPaid: false, ekPaid: false };

                eligible++;
                const pType = getPaymentType(match);
                let mGsbHakedis = 0;
                let mEkHakedis = 0;
                let mGsbOdenen = 0;
                let mEkOdenen = 0;

                // GSB Logic
                if (pType === PaymentType.STANDARD || pType === PaymentType.GSB_ONLY) {
                    mGsbHakedis = PAYMENT_RATES.GSB;
                    if (status.gsbPaid) mGsbOdenen = PAYMENT_RATES.GSB;
                }

                // EK Logic
                if (pType === PaymentType.STANDARD || pType === PaymentType.CUSTOM_FEE || pType === PaymentType.GELISIM_LIGI) {
                    let rate = PAYMENT_RATES.EK;
                    if (pType === PaymentType.CUSTOM_FEE) {
                        rate = status.customFee || 0;
                    } else if (pType === PaymentType.GELISIM_LIGI) {
                        rate = PAYMENT_RATES.GELISIM;
                    }

                    mEkHakedis = rate;
                    if (status.ekPaid) mEkOdenen = rate;
                }

                const mTotalHakedis = mGsbHakedis + mEkHakedis;
                const mTotalOdenen = mGsbOdenen + mEkOdenen;

                totalAmount += mTotalHakedis;
                paidAmount += mTotalOdenen;
                if (mTotalOdenen < mTotalHakedis) pendingCount++;

                details.push({
                    id,
                    teamA: match.teamA,
                    teamB: match.teamB,
                    date: match.date,
                    gsbAmount: mGsbHakedis,
                    gsbPaid: !!status.gsbPaid,
                    ekAmount: mEkHakedis,
                    ekPaid: !!status.ekPaid,
                    total: mTotalHakedis
                });
            }
        });

        setPaymentStats({
            eligible,
            totalAmount,
            paidAmount,
            pendingCount, // Add pendingCount here
            details: details.sort((a, b) => {
                const dateA = parseDate(a.date)?.getTime() || 0;
                const dateB = parseDate(b.date)?.getTime() || 0;
                return dateB - dateA;
            })
        });
    }, [matches, paymentStatuses, currentTime]);

    // Toggle payment status handler
    const togglePaymentStatus = (matchId: string, type: 'gsb' | 'ek', customFee?: number) => {
        if (!user || !user.email) return;

        setPaymentStatuses(prev => {
            const currentStatus = prev[matchId] || { gsbPaid: false, ekPaid: false };
            let newStatus: PaymentStatus;

            if (type === 'gsb') {
                newStatus = { ...currentStatus, gsbPaid: !currentStatus.gsbPaid };
            } else {
                newStatus = {
                    ...currentStatus,
                    ekPaid: !currentStatus.ekPaid,
                    // If custom fee is provided, update it. If unchecking, keep it or handle as needed.
                    // For now resetting if unpaying? No, keep it.
                    customFee: customFee !== undefined ? customFee : currentStatus.customFee,
                    isCustomFeeSet: customFee !== undefined ? true : currentStatus.isCustomFeeSet
                };
            }

            savePaymentStatus(user.email!, matchId, newStatus);
            return { ...prev, [matchId]: newStatus };
        });
    };

    const sendBotMessage = async (msg: string) => {
        if (!botConfig.phone || !botConfig.apiKey) return;
        try {
            const encoded = encodeURIComponent(msg);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${botConfig.phone}&text=${encoded}&apikey=${botConfig.apiKey}`;
            await fetch(url, { method: 'GET', mode: 'no-cors' });
        } catch (e) {
            console.error("Bot mesajı gönderilemedi", e);
        }
    };

    const handleAutoScan = async (forceRefresh = false) => {
        if (isFirebaseActive) {
            return;
        }

        const cacheKey = `matches_cache_${user?.email}`;
        const lastScanKey = `last_scan_${user?.email}`;
        const cachedData = localStorage.getItem(cacheKey);
        const lastScanTime = localStorage.getItem(lastScanKey);

        // Baseline matches for NEW match detection
        let baselineMatches = matches;

        // ALWAYS load from cache first if it exists, for instant UI
        if (cachedData && !forceRefresh) {
            try {
                const cached = JSON.parse(cachedData);
                setMatches(cached);
                baselineMatches = cached; // Update baseline for detector
                if (lastScanTime) {
                    setLastUpdated(new Date(parseInt(lastScanTime)).toLocaleString('tr-TR'));
                }
                addLog(`📦 Önbellekten ${cached.length} maç anında yüklendi. Arka planda güncelleniyor...`, 'info');
            } catch (e) {
                console.error('Cache parse error:', e);
            }
        }

        // Proceed to background scan
        setIsAnalyzing(true);
        setError(null);
        setProgress(cachedData ? "Yeni müsabakalar kontrol ediliyor..." : "İlk tarama yapılıyor...");

        // Extract user name parts for filtering
        const userNameParts = user?.displayName
            ? user.displayName.toLocaleUpperCase('tr-TR')
                .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
                .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
                .split(' ').filter(p => p.length > 1)
            : undefined;

        try {
            const driveMatches = await autoScanDriveFolder((msg, type) => {
                setProgress(msg);
                addLog(msg, type);
            }, userNameParts);

            // Check for NEW matches against baseline
            const currentIds = new Set(baselineMatches.map(m => getMatchId(m)));
            const newMatchesFound = driveMatches.filter(m => !currentIds.has(getMatchId(m)));

            if (newMatchesFound.length > 0 && baselineMatches.length > 0) {
                let notifyMsg = `🚀 *YENİ MÜSABAKA EKLENDİ!*\n\n`;
                newMatchesFound.forEach(m => {
                    notifyMsg += `🏀 ${m.teamA} vs ${m.teamB}\n📅 ${m.date} | ⏰ ${m.time}\n🏟️ ${m.hall}\n\n`;
                });
                notifyMsg += `_Sistem tarafından otomatik algılandı._`;
                addLog(`📱 ${newMatchesFound.length} yeni maç için bildirim gönderiliyor...`, 'success');
                sendBotMessage(notifyMsg);
            }

            setMatches(driveMatches);

            // Initialize payment statuses
            if (user?.email) {
                const statuses = getAllPaymentStatuses(user.email);
                setPaymentStatuses(statuses);
            }

            setLastUpdated(new Date().toLocaleString('tr-TR'));

            // Cache the results
            localStorage.setItem(cacheKey, JSON.stringify(driveMatches));
            localStorage.setItem(lastScanKey, Date.now().toString());

            setShowManualUpload(false);
        } catch (err: any) {
            console.error(err);
            if (matches.length === 0 && !cachedData) {
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
            // Force refresh without clearing screen first
            addLog("🔄 Müsabakalar güncelleniyor...", 'info');
            handleAutoScan(true);
        }
    };

    // Remove duplicate matches and split into active/past
    const { activeMatches, pastMatches } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Season cutoff: September 1, 2025
        const SEASON_CUTOFF = new Date(2025, 8, 1);

        const uniqueMatches = new Map<string, MatchDetails>();
        matches.forEach(m => {
            const id = getMatchId(m);
            if (!uniqueMatches.has(id)) {
                uniqueMatches.set(id, m);
            }
        });

        const dedupedBySeason = Array.from(uniqueMatches.values()).filter(m => {
            const mDate = parseDate(m.date);
            return mDate && mDate >= SEASON_CUTOFF;
        });

        const active: MatchDetails[] = [];
        const past: MatchDetails[] = [];

        dedupedBySeason.forEach(m => {
            if (isPastDate(m.date, m.time)) {
                past.push(m);
            } else {
                active.push(m);
            }
        });

        return { activeMatches: active, pastMatches: past };
    }, [matches, currentTime]);

    const activeMatchCount = activeMatches.length;

    // Check if logged in user is admin
    const adminEmails = ['admin@admin.com', 'rifatgurses@gmail.com'];
    const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

    // Escape key listener for all modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFirebaseOpen(false);
                setIsBotSettingsOpen(false);
                setIsFeeListOpen(false);
                setIsAdminPanelOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!authInitialized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Sistem Hazırlanıyor...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Auth />;
    }

    return (
        <div className="min-h-screen bg-gray-50 transition-colors duration-300">
            {/* Firebase Settings Component */}
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
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsBotSettingsOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-green-600 p-4 flex items-center justify-between text-black">
                            <h3 className="font-bold flex items-center gap-2">
                                <Settings size={20} className="text-black" />
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

            {/* Fee List Modal */}
            {isFeeListOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsFeeListOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-green-600 p-4 flex items-center justify-between text-black">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-base">💰</span>
                                Ücret Listesi
                            </h3>
                            <button onClick={() => setIsFeeListOpen(false)} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <FeeTable
                                eligibleCount={paymentStats.eligible}
                                totalAmount={paymentStats.totalAmount}
                                paidAmount={paymentStats.paidAmount}
                                pendingCount={paymentStats.pendingCount}
                                details={paymentStats.details}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER SECTION - Theme Toggle Moved Here */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-black p-2 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h1 className="font-bold text-gray-900 text-sm leading-tight hidden sm:block">
                            Maç Takip Sistemi <span className="text-[10px] text-blue-500 ml-1">v10.9</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Fee List Button - Only visible when eligible matches exist */}
                        {matches.length > 0 && (
                            <button
                                onClick={() => setIsFeeListOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-green-200"
                            >
                                <span className="text-base">💰</span>
                                <span className="hidden sm:inline">Ücret Listesi</span>
                            </button>
                        )}

                        {/* Admin Button - Only visible to admin */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminPanelOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-red-200"
                            >
                                <ShieldAlert size={14} />
                                <span className="hidden sm:inline">Yönetici Paneli</span>
                            </button>
                        )}



                        <div className="flex items-center gap-2 text-sm text-gray-700 font-bold border-l border-r border-gray-200 px-3 h-8">
                            <UserIcon size={16} className="text-blue-600" />
                            <span className="hidden sm:inline">{user.displayName?.toLocaleUpperCase('tr-TR')}</span>
                        </div>

                        <button
                            onClick={logoutUser}
                            className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={14} />
                            Çıkış
                        </button>
                    </div>
                </div>
            </div>

            {/* WELCOME HERO SECTION */}
            <div className="bg-white border-b border-gray-200 transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ring-4 ring-blue-50">
                                {user.displayName ?
                                    user.displayName.split(' ').map(name => name[0]).join('').toUpperCase()
                                    : 'UR'
                                }
                            </div>
                        </div>
                        <div>
                            {/* Updated Welcome Message */}
                            <h2 className="text-lg font-bold text-gray-800">
                                Hoş Geldiniz, {user.displayName?.toLocaleUpperCase('tr-TR')}
                            </h2>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Hesabınız onaylandı. Sistemde <strong>{user.displayName?.toLocaleUpperCase('tr-TR')}</strong> adına tanımlı maçlar listelenmektedir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8">

                {/* Removed FeeTable from here, moved to modal */}

                <div className="space-y-6">

                    <div className="flex flex-col gap-3">
                        {/* Aktif Görevler Banner Button */}
                        <button
                            onClick={() => setActiveExpanded(!activeExpanded)}
                            style={{
                                backgroundColor: '#ee6730',
                                backgroundImage: 'radial-gradient(rgba(0,0,0,0.3) 15%, transparent 16%)',
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0'
                            }}
                            className="py-3 px-6 rounded-2xl border-2 border-orange-800 shadow-lg flex items-center justify-between transform hover:scale-[1.01] transition-all duration-300 w-full group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-black/20 p-2 rounded-lg border border-white/10 text-white">
                                    <Briefcase size={18} />
                                </div>
                                <span className="text-white text-sm font-black uppercase tracking-widest drop-shadow-md">
                                    Aktif Görevler
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-black/30 px-5 py-1 rounded-xl border border-white/20">
                                    {activeMatches.length}
                                </div>
                                <div className="text-white/70 group-hover:text-white transition-colors">
                                    {activeExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>
                        </button>

                        {/* Aktif Müsabakalar List */}
                        {activeExpanded && activeMatches.length > 0 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <MatchList
                                    matches={activeMatches}
                                    title=""
                                    variant="active"
                                    paymentStatuses={paymentStatuses}
                                    onTogglePayment={togglePaymentStatus}
                                    userEmail={user.email}
                                />
                            </div>
                        )}

                        {/* Geçmiş Müsabakalar Banner Button */}
                        <button
                            onClick={() => setPastExpanded(!pastExpanded)}
                            style={{
                                backgroundColor: '#334155',
                                backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 15%, transparent 16%)',
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0'
                            }}
                            className="py-3 px-6 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-between transform hover:scale-[1.01] transition-all duration-300 w-full opacity-90 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg border border-white/5 text-white">
                                    <HistoryIcon size={18} />
                                </div>
                                <span className="text-white text-sm font-black uppercase tracking-widest drop-shadow-md">
                                    Geçmiş Müsabakalar
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-white/10 px-5 py-1 rounded-xl border border-white/10">
                                    {pastMatches.length}
                                </div>
                                <div className="text-white/50 group-hover:text-white transition-colors">
                                    {pastExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>
                        </button>

                        {/* Geçmiş Müsabakalar List */}
                        {pastExpanded && pastMatches.length > 0 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <MatchList
                                    matches={pastMatches}
                                    title=""
                                    variant="past"
                                    paymentStatuses={paymentStatuses}
                                    onTogglePayment={togglePaymentStatus}
                                    userEmail={user.email}
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
                            <div className="bg-red-100 p-1.5 rounded-full mt-0.5"><Bot size={16} /></div>
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
                        <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-4 text-orange-700">
                                <Upload size={20} />
                                <h3 className="font-bold">Manuel Dosya Yükle</h3>
                            </div>
                            <FileUpload onFilesSelect={handleManualFiles} isAnalyzing={isAnalyzing} />
                        </div>
                    )}

                    {!isAnalyzing && matches.length === 0 && !error && !showManualUpload && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center transition-colors duration-300">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Folder size={32} className="text-gray-900" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Aktif Maç Bulunamadı</h3>
                            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                                {isFirebaseActive
                                    ? `Firebase veritabanında '${user.displayName}' adına kayıtlı maç bulunamadı.`
                                    : `Google Drive'da '${user.displayName}' için tanımlanmış herhangi bir maç bulunamadı.`
                                }
                            </p>
                        </div>
                    )}

                    {activeMatches.length > 0 && (
                        <WhatsAppSender matches={activeMatches} config={botConfig} />
                    )}

                </div>

            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Sistem v10.6 &copy; 2025
                    </div>
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
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsBotSettingsOpen(true)} className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors">
                            <Settings size={14} />
                            <span className="hidden sm:inline">Bot Ayarları</span>
                        </button>
                        {!isFirebaseActive && (
                            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 hover:text-gray-900 transition-colors">
                                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Oto. Yenile</span>
                            </label>
                        )}
                        <button onClick={handleRefresh} disabled={isAnalyzing} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded border border-gray-200 flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
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