import React from 'react';
import { PAYMENT_RATES } from '../services/paymentService';

interface FeeTableProps {
    eligibleCount: number;
    paidGsbCount: number;
    paidEkCount: number;
}

const FeeTable: React.FC<FeeTableProps> = ({ eligibleCount, paidGsbCount, paidEkCount }) => {
    const totalGsbPayable = eligibleCount * PAYMENT_RATES.GSB;
    const totalEkPayable = eligibleCount * PAYMENT_RATES.EK;
    const totalPayable = totalGsbPayable + totalEkPayable;

    const totalGsbPaid = paidGsbCount * PAYMENT_RATES.GSB;
    const totalEkPaid = paidEkCount * PAYMENT_RATES.EK;
    const totalPaid = totalGsbPaid + totalEkPaid;

    const remaining = totalPayable - totalPaid;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    if (eligibleCount === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm p-4 mb-6">
            <h3 className="text-gray-800 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">💰</span>
                Ücret Tablosu (Haftalık Maçlar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Toplam Hakediş */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Toplam Hakediş</div>
                    <div className="text-xl font-black text-gray-800 dark:text-white">
                        {formatCurrency(totalPayable)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {eligibleCount} Maç x ({PAYMENT_RATES.GSB} + {PAYMENT_RATES.EK}) ₺
                    </div>
                </div>

                {/* Ödenen */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide mb-1">Toplam Ödenen</div>
                    <div className="text-xl font-black text-green-600 dark:text-green-400">
                        {formatCurrency(totalPaid)}
                    </div>
                    <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                        GSB: {paidGsbCount} | Ek: {paidEkCount}
                    </div>
                </div>

                {/* Kalan */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                    <div className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide mb-1">Kalan Ödeme</div>
                    <div className="text-xl font-black text-orange-600 dark:text-orange-400">
                        {formatCurrency(remaining)}
                    </div>
                    <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                        Bekleyen
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeTable;
