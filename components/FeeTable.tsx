import React from 'react';
import { PAYMENT_RATES } from '../services/paymentService';

interface PaymentStatus {
    gsbPaid: boolean;
    ekPaid: boolean;
    customFee?: number;
}

interface FeeTableProps {
    eligibleCount: number;
    paidGsbCount: number;
    paidEkCount: number;
    paymentStatuses: Record<string, PaymentStatus>;
}

const FeeTable: React.FC<FeeTableProps> = ({ eligibleCount, paidGsbCount, paidEkCount, paymentStatuses }) => {
    // Calculate totals
    const totalGsbPayable = Object.values(paymentStatuses).filter(s => s.gsbPaid).length * PAYMENT_RATES.GSB;

    // Calculate total Ek including custom fees
    const totalEkPayable = Object.values(paymentStatuses).reduce((acc, curr) => {
        if (curr.ekPaid) {
            // If it has a custom fee, use that, otherwise use standard rate
            return acc + (curr.customFee || PAYMENT_RATES.EK);
        }
        return acc;
    }, 0);

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
                {/* Toplam Hakediş - Green */}
                <div className="bg-green-500 dark:bg-green-600 p-3 rounded-lg border border-green-600 dark:border-green-700 shadow-md">
                    <div className="text-xs text-black dark:text-black font-bold uppercase tracking-wide mb-1">Toplam Hakediş</div>
                    <div className="text-xl font-black text-black dark:text-black">
                        {formatCurrency(totalPayable)}
                    </div>
                    <div className="text-xs text-black dark:text-black mt-1">
                        {eligibleCount} Maç x ({PAYMENT_RATES.GSB} + {PAYMENT_RATES.EK}) ₺
                    </div>
                </div>

                {/* Ödenen - Black */}
                <div className="bg-gray-900 dark:bg-gray-900 p-3 rounded-lg border border-gray-800 dark:border-gray-800">
                    <div className="text-xs text-white dark:text-white font-bold uppercase tracking-wide mb-1">Toplam Ödenen</div>
                    <div className="text-xl font-black text-white dark:text-white">
                        {formatCurrency(totalPaid)}
                    </div>
                    <div className="text-xs text-white dark:text-white mt-1">
                        GSB: {paidGsbCount} | Ek: {paidEkCount}
                    </div>
                </div>

                {/* Kalan - Black */}
                <div className="bg-gray-900 dark:bg-gray-900 p-3 rounded-lg border border-gray-800 dark:border-gray-800">
                    <div className="text-xs text-white dark:text-white font-bold uppercase tracking-wide mb-1">Kalan Ödeme</div>
                    <div className="text-xl font-black text-white dark:text-white">
                        {formatCurrency(remaining)}
                    </div>
                    <div className="text-xs text-white dark:text-white mt-1">
                        Bekleyen
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeTable;
