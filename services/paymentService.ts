import { MatchDetails } from '../types';

export interface PaymentStatus {
    gsbPaid: boolean;
    ekPaid: boolean;
}

const STORAGE_KEY_PREFIX = 'payment_status_';

export const PAYMENT_RATES = {
    GSB: 348.4,
    EK: 300
};

export const getMatchId = (match: MatchDetails): string => {
    // Create a unique ID based on immutable match properties
    // Sanitizing to ensure safe key
    const safeDate = match.date.replace(/\s/g, '');
    const safeTime = match.time.replace(/\s/g, '');
    const safeTeamA = match.teamA.replace(/\s/g, '').substring(0, 10);
    const safeTeamB = match.teamB.replace(/\s/g, '').substring(0, 10);
    return `${safeDate}_${safeTime}_${safeTeamA}_${safeTeamB}`;
};

export const getPaymentStatus = (userEmail: string, matchId: string): PaymentStatus => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${userEmail}`;
        const stored = localStorage.getItem(key);
        if (!stored) return { gsbPaid: false, ekPaid: false };

        const allStatuses = JSON.parse(stored);
        return allStatuses[matchId] || { gsbPaid: false, ekPaid: false };
    } catch (e) {
        console.error('Error reading payment status', e);
        return { gsbPaid: false, ekPaid: false };
    }
};

export const savePaymentStatus = (userEmail: string, matchId: string, status: PaymentStatus) => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${userEmail}`;
        const stored = localStorage.getItem(key);
        const allStatuses = stored ? JSON.parse(stored) : {};

        allStatuses[matchId] = status;
        localStorage.setItem(key, JSON.stringify(allStatuses));
    } catch (e) {
        console.error('Error saving payment status', e);
    }
};

export const getAllPaymentStatuses = (userEmail: string): Record<string, PaymentStatus> => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${userEmail}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

export const isMatchEligibleForPayment = (match: MatchDetails): boolean => {
    if (!match.sourceFile) return false;
    const fileNameUpper = match.sourceFile.toLocaleUpperCase('tr-TR');
    return fileNameUpper.includes('HAFTA');
};
