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
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-3 mb-4">
            <h3 className="text-gray-800 font-bold text-sm mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1 rounded-lg">💰</span>
                Ücret Tablosu (Haftalık Maçlar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Toplam Hakediş - Green */}
                <div className="bg-green-500 p-2 rounded-lg border border-green-600 shadow-md">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wide mb-0.5">Toplam Hakediş</div>
                    <div className="text-base font-black text-black">
                        {formatCurrency(totalPayable)}
                    </div>
                    <div className="text-[9px] text-black mt-0.5">
                        {eligibleCount} Maç x ({PAYMENT_RATES.GSB} + {PAYMENT_RATES.EK}) ₺
                    </div>
                </div>

                {/* Ödenen - Black */}
                <div className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wide mb-0.5">Toplam Ödenen</div>
                    <div className="text-base font-black text-black">
                        {formatCurrency(totalPaid)}
                    </div>
                    <div className="text-[9px] text-black mt-0.5">
                        GSB: {paidGsbCount} | Ek: {paidEkCount}
                    </div>
                </div>

                {/* Kalan - Black */}
                <div className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wide mb-0.5">Kalan Ödeme</div>
                    <div className="text-base font-black text-black">
                        {formatCurrency(remaining)}
                    </div>
                    <div className="text-[9px] text-black mt-0.5">
                        Bekleyen
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeTable;
