import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';

interface MatchPaymentDetail {
    id: string;
    teamA: string;
    teamB: string;
    date: string;
    gsbAmount: number;
    gsbPaid: boolean;
    ekAmount: number;
    ekPaid: boolean;
    total: number;
}

interface FeeTableProps {
    eligibleCount: number;
    totalAmount: number;
    paidAmount: number;
    pendingCount: number;
    details: MatchPaymentDetail[];
}

const FeeTable: React.FC<FeeTableProps> = ({ eligibleCount, totalAmount, paidAmount, pendingCount, details }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const remaining = totalAmount - paidAmount;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 2
        }).format(val);
    };

    if (eligibleCount === 0) return (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="text-3xl mb-2">📒</div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Hakediş Verisi Bulunmuyor</div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 px-6">
                Size atanmış geçmiş bir müsabaka bulunamadığı için hesaplama yapılamıyor.
            </p>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header Info */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tighter">Otomatik Hakediş Özeti</h3>
                </div>
                <div className="flex gap-2">
                    <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                        {eligibleCount} Toplam Maç
                    </span>
                    {pendingCount > 0 && (
                        <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                            {pendingCount} Bekleyen Ödeme
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. TOPLAM HAKEDİŞ */}
                <div
                    style={{
                        backgroundColor: '#ee6730',
                        backgroundImage: 'radial-gradient(rgba(0,0,0,0.2) 15%, transparent 16%)',
                        backgroundSize: '6px 6px'
                    }}
                    className="p-4 rounded-2xl border-2 border-orange-800 shadow-lg text-white"
                >
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Toplam Hakediş</div>
                    <div className="text-2xl font-black drop-shadow-md">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-[8px] font-bold uppercase mt-1 opacity-70">
                        Atanan Tüm Maçların Toplamı
                    </div>
                </div>

                {/* 2. TOPLAM ÖDENEN */}
                <div
                    style={{
                        backgroundColor: '#334155',
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 15%, transparent 16%)',
                        backgroundSize: '6px 6px'
                    }}
                    className="p-4 rounded-2xl border-2 border-slate-900 shadow-lg text-white"
                >
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Toplam Ödenen</div>
                    <div className="text-2xl font-black text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        {formatCurrency(paidAmount)}
                    </div>
                </div>

                {/* 3. KALAN ALACAK */}
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border-2 border-red-100 dark:border-red-900 shadow-sm transition-colors">
                    <div className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Kalan Alacak</div>
                    <div className="text-2xl font-black text-red-700 dark:text-red-300 drop-shadow-sm">
                        {formatCurrency(remaining)}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full py-1.5 px-4 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between text-[6px] font-black uppercase text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <span>Maç Bazlı Detayları Gör</span>
                {showBreakdown ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>

            {showBreakdown && (
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 animate-in slide-in-from-top-2 duration-300 custom-scrollbar">
                    {details.map((item) => (
                        <div key={item.id} className="bg-gray-50/50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="flex-1 min-w-0">
                                <div className="text-[8px] text-gray-400 uppercase font-black mb-0.5">{item.date}</div>
                                <div className="font-bold text-gray-900 dark:text-white truncate pr-2">
                                    {item.teamA} vs {item.teamB}
                                </div>
                            </div>
                            <div className="flex gap-2.5 text-right shrink-0">
                                {item.gsbAmount > 0 && (
                                    <div>
                                        <div className="text-[7px] text-gray-400 uppercase font-black">GSB</div>
                                        <div className={`font-black flex items-center gap-0.5 ${item.gsbPaid ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formatCurrency(item.gsbAmount)}
                                            {item.gsbPaid ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                                        </div>
                                    </div>
                                )}
                                {item.ekAmount > 0 && (
                                    <div>
                                        <div className="text-[7px] text-gray-400 uppercase font-black">EK/ÖZEL</div>
                                        <div className={`font-black flex items-center gap-0.5 ${item.ekPaid ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formatCurrency(item.ekAmount)}
                                            {item.ekPaid ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                                        </div>
                                    </div>
                                )}
                                <div className="pl-2.5 border-l border-gray-200 dark:border-gray-800 ml-0.5">
                                    <div className="text-[7px] text-gray-400 uppercase font-black">TOPLAM</div>
                                    <div className="text-gray-900 dark:text-white font-black">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}</style>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-3">
                <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-tight">
                    💡 Hakedişler size atanan tüm maçlar baz alınarak otomatik hesaplanır. Kartlardaki ödeme kutuları ise sadece cebinize giren parayı (Ödenen) takip etmeniz içindir.
                </p>
            </div>
        </div>
    );
};

export default FeeTable;
