
export interface PaymentStatus {
    gsbPaid: boolean;
    ekPaid: boolean;
    customFee?: number; // For special leagues
    isCustomFeeSet?: boolean; // To check if fee has been entered
}

export enum PaymentType {
    STANDARD = 'STANDARD', // Generic HAFTA matches (GSB + Ek)
    GSB_ONLY = 'GSB_ONLY', // OKUL matches (Only GSB)
    CUSTOM_FEE = 'CUSTOM_FEE', // ÖZEL LİG matches (Custom fee input)
    GELISIM_LIGI = 'GELISIM_LIGI', // GELİŞİM LİGİ matches (600 TL)
    NONE = 'NONE' // Not eligible
}

export const PAYMENT_RATES = {
    GSB: 348.4,
    EK: 300,
    GELISIM: 600
};

export const getMatchId = (match: any): string => {
    // Create a unique ID based on immutable match properties
    // Using date, time, teams, and hall to ensure uniqueness
    const str = `${match.date}_${match.time}_${match.teamA}_${match.teamB}_${match.hall}`;
    return btoa(unescape(encodeURIComponent(str))).replace(/[^a-zA-Z0-9]/g, '');
};

export const getPaymentStatus = (userEmail: string, matchId: string): PaymentStatus => {
    try {
        const key = `payment_${userEmail}_${matchId}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : { gsbPaid: false, ekPaid: false };
    } catch (e) {
        return { gsbPaid: false, ekPaid: false };
    }
};

export const savePaymentStatus = (userEmail: string, matchId: string, status: PaymentStatus) => {
    const key = `payment_${userEmail}_${matchId}`;
    localStorage.setItem(key, JSON.stringify(status));
};

export const getAllPaymentStatuses = (userEmail: string): Record<string, PaymentStatus> => {
    const statuses: Record<string, PaymentStatus> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`payment_${userEmail}_`)) {
            const matchId = key.replace(`payment_${userEmail}_`, '');
            try {
                statuses[matchId] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                // ignore error
            }
        }
    }
    return statuses;
};

export const getPaymentType = (match: any): PaymentType => {
    const source = match.sourceFile?.toLocaleUpperCase('tr-TR') || '';
    const category = match.category?.toLocaleUpperCase('tr-TR') || '';

    if (source.includes('GELİŞİM LİGİ') || category.includes('GELİŞİM LİGİ')) {
        return PaymentType.GELISIM_LIGI;
    }

    if (source.includes('OKUL İL VE İLÇE')) {
        return PaymentType.GSB_ONLY;
    }

    if (source.includes('ÖZEL LİG') || source.includes('ÜNİVERSİTE')) {
        return PaymentType.CUSTOM_FEE;
    }

    if (source.includes('HAFTA')) {
        return PaymentType.STANDARD;
    }

    return PaymentType.NONE;
};

export const isMatchEligibleForPayment = (match: any): boolean => {
    return getPaymentType(match) !== PaymentType.NONE;
};
