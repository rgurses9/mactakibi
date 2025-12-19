import React, { useState } from 'react';
import { MapPin, History, CheckCircle2, DollarSign, Edit, FileText } from 'lucide-react';
import { MatchDetails } from '../types';
import { parseDate, formatDate } from '../utils/dateHelpers';
import { PaymentStatus, PaymentType, PAYMENT_RATES, isMatchEligibleForPayment, getMatchId, getPaymentType } from '../services/paymentService';

interface MatchListProps {
  matches: MatchDetails[];
  title?: string;
  variant?: 'active' | 'past';
  paymentStatuses?: Record<string, PaymentStatus>;
  onTogglePayment?: (matchId: string, type: 'gsb' | 'ek', customFee?: number) => void;
  userEmail?: string | null;
}

const MatchCard: React.FC<{
  match: MatchDetails;
  isGreenMode: boolean;
  paymentStatus?: PaymentStatus;
  onTogglePayment?: (matchId: string, type: 'gsb' | 'ek', customFee?: number) => void;
  isEligibleForPayment: boolean;
}> = ({ match, isGreenMode, paymentStatus = { gsbPaid: false, ekPaid: false }, onTogglePayment, isEligibleForPayment }) => {
  const [showPaymentButtons, setShowPaymentButtons] = useState(false);

  const matchId = getMatchId(match);
  const paymentType = getPaymentType(match);

  const handleCustomFeeClick = () => {
    const currentFee = paymentStatus.customFee || 0;
    const feeStr = window.prompt("Lütfen maç ücretini giriniz (TL):", currentFee.toString());
    if (feeStr !== null) {
      const fee = parseFloat(feeStr);
      if (!isNaN(fee) && fee > 0 && onTogglePayment) {
        onTogglePayment(matchId, 'ek', fee);
      }
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: isGreenMode ? '#ffffff' : '#f9fafb',
          borderColor: isGreenMode ? '#e5e7eb' : '#d1d5db',
        }}
        className={`group rounded-xl border-2 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 relative dark:bg-gray-900 dark:border-gray-800
          ${isGreenMode ? 'ring-1 ring-gray-200 dark:ring-gray-700' : ''}
        `}
      >
        {/* Payment Status Checkboxes - Top Right (Clickable) */}
        {isEligibleForPayment && onTogglePayment && (
          <div className="absolute top-2 right-2 z-10">
            <div style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }} className="flex items-center gap-2 px-2 py-1 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              {/* GSB Checkbox - Clickable */}
              {(paymentType === PaymentType.STANDARD || paymentType === PaymentType.GSB_ONLY) && (
                <button
                  onClick={() => onTogglePayment(matchId, 'gsb')}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${paymentStatus.gsbPaid
                    ? 'bg-green-500 border-green-600'
                    : 'bg-white border-gray-400'
                    }`}>
                    {paymentStatus.gsbPaid && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">GSB</span>
                </button>
              )}

              {/* EK Checkbox - Clickable */}
              {(paymentType === PaymentType.STANDARD || paymentType === PaymentType.CUSTOM_FEE) && (
                <button
                  onClick={() => {
                    if (paymentType === PaymentType.CUSTOM_FEE && !paymentStatus.isCustomFeeSet) {
                      handleCustomFeeClick();
                    } else {
                      onTogglePayment(matchId, 'ek');
                    }
                  }}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${paymentStatus.ekPaid
                    ? 'bg-green-500 border-green-600'
                    : 'bg-white border-gray-400'
                    }`}>
                    {paymentStatus.ekPaid && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">EK</span>
                </button>
              )}

              {/* Completion Text - Shows when all payments complete */}
              {((paymentType === PaymentType.STANDARD && paymentStatus.gsbPaid && paymentStatus.ekPaid) ||
                (paymentType === PaymentType.GSB_ONLY && paymentStatus.gsbPaid) ||
                (paymentType === PaymentType.CUSTOM_FEE && paymentStatus.ekPaid)) && (
                  <span className="text-xs font-bold text-green-600">Ödeme Tamamlandı</span>
                )}
            </div>
          </div>
        )}

        {match.sourceFile && (
          <div style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
            <FileText size={12} />
            <span className="truncate max-w-[200px]">{match.sourceFile}</span>
          </div>
        )}
      </div>

      {/* Bottom: Match Details */}
      <div className="p-3">
        {/* Category + Time/Date + Hall + Teams - All in one row */}
        <div style={{ backgroundColor: '#f9fafb' }} className="flex items-center justify-center gap-3 mb-2 p-2.5 rounded-lg dark:bg-gray-800">
          {/* Left: Category & Hall */}
          <div className="flex flex-col gap-1 items-center">
            <div className="text-xs font-black uppercase flex items-center gap-0 text-center text-black">
              <span className={`w-1.5 h-1.5 rounded-full ${isGreenMode ? 'bg-green-500' : 'bg-orange-500'}`}></span>
              {match.category} {match.group ? `• ${match.group}` : ''}
            </div>
            <div className="flex items-center gap-0 text-xs font-black text-center text-black">
              <MapPin size={12} />
              {match.hall}
            </div>
          </div>

          {/* Center: Time & Date */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-black text-center text-black">
              {match.time}
            </div>
            <div className="text-xs font-black bg-orange-200 dark:bg-orange-700 border border-orange-400 dark:border-orange-600 px-2 py-0.5 rounded text-center text-black">
              {formatDate(match.date)}
            </div>
          </div>

          {/* Right: Teams */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-center text-black">{match.teamA}</span>
            <div className="bg-orange-200 dark:bg-orange-700 text-xs font-black px-1.5 py-0.5 rounded text-center text-black">VS</div>
            <span className="text-xs font-black text-center text-black">{match.teamB}</span>
          </div>
        </div>

        {/* Duties (Grid) - Only show Rıfat Gürses's duty */}
        <div className="flex justify-center">
          {[
            { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
            { label: match.timerLabel || 'Görevli 2', value: match.timer },
            { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
          ].map((duty, i) => {
            const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
            const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');

            // Only render if this is Rıfat Gürses's duty
            if (!isRifat) return null;

            // Visual logic for duty box
            let boxClass = 'bg-white border-black';

            if (isGreenMode) {
              // Yellow background for active matches
              boxClass = 'bg-yellow-400 border-yellow-600 shadow-xl ring-4 ring-yellow-300';
            } else {
              // Yellow background for past matches
              boxClass = 'bg-yellow-300 border-yellow-500 shadow-lg';
            }

            return (
              <div
                key={i}
                style={{
                  backgroundColor: isGreenMode ? '#facc15' : '#fde047',
                  borderColor: isGreenMode ? '#ca8a04' : '#eab308',
                }}
                className={`
                          relative px-4 py-2 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-all duration-300
                          ${boxClass}
                `}
              >
                <span className="text-xs uppercase font-black tracking-wider mb-1 text-black">
                  {duty.label}
                </span>
                <span className="text-sm font-black text-red-900">
                  {duty.value || '-'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Ödemesi Tamamlandı Section - Shows when both payments complete */}
        {((paymentType === PaymentType.STANDARD && paymentStatus.gsbPaid && paymentStatus.ekPaid) ||
          (paymentType === PaymentType.GSB_ONLY && paymentStatus.gsbPaid) ||
          (paymentType === PaymentType.CUSTOM_FEE && paymentStatus.ekPaid)) && (
            <div className="mt-3 bg-green-100 border-2 border-green-500 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-green-800">Ödemesi Tamamlandı</span>
              </div>

              {/* Duty Assignment - Only Rıfat Gürses's duty */}
              <div className="flex justify-center">
                {[
                  { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
                  { label: match.timerLabel || 'Görevli 2', value: match.timer },
                  { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
                ].map((duty, i) => {
                  const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
                  const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');

                  // Only show Rıfat Gürses's duty
                  if (!isRifat) return null;

                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#fde047',
                        borderColor: '#eab308',
                      }}
                      className="rounded-lg p-3 border-2 shadow-md"
                    >
                      <div className="text-xs uppercase font-black text-black mb-1">
                        {duty.label}
                      </div>
                      <div className="text-sm font-black text-red-900">
                        {duty.value || '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

    </>
  );
};

const MatchList: React.FC<MatchListProps> = ({ matches, title = "Maç Programı", variant = 'active', paymentStatuses, onTogglePayment, userEmail }) => {
  if (matches.length === 0) return null;

  // Sorting logic:
  // 1. Sort by date descending (newest date first)
  // 2. For same-day matches, sort by time descending (latest time first)
  // 3. Invalid dates are placed at the end
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);

    // If both dates are invalid, maintain original order
    if (!dateA && !dateB) return 0;

    // If only dateA is invalid, push it to the end
    if (!dateA) return 1;

    // If only dateB is invalid, push it to the end
    if (!dateB) return -1;

    // Both dates are valid, sort reverse chronologically (newest first)
    const dateDiff = dateB.getTime() - dateA.getTime();

    // If dates are different, use date sorting
    if (dateDiff !== 0) return dateDiff;

    // Same date - sort by time (latest time first)
    const timeA = a.time || '';
    const timeB = b.time || '';

    // Parse time strings (e.g., "14:00" or "14.00")
    const parseTime = (timeStr: string): number => {
      const cleaned = timeStr.replace(/[.:]/g, '');
      const hours = parseInt(cleaned.substring(0, 2)) || 0;
      const minutes = parseInt(cleaned.substring(2, 4)) || 0;
      return hours * 60 + minutes; // Convert to minutes for comparison
    };

    const minutesA = parseTime(timeA);
    const minutesB = parseTime(timeB);

    // Sort by time descending (later times first)
    return minutesB - minutesA;
  });

  const isGreenMode = variant === 'active';

  return (
    <div className={`${variant === 'past' ? 'opacity-70 grayscale-[0.8]' : ''}`}>
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isGreenMode ? 'text-orange-700 dark:text-orange-400' : 'text-orange-600 dark:text-orange-500'}`}>
          {isGreenMode ? <CheckCircle2 className="text-orange-600 dark:text-orange-400" size={20} /> : <History className="text-orange-500" size={20} />}
          {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isGreenMode ? 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200' : 'bg-orange-200 dark:bg-orange-700 text-orange-600 dark:text-orange-300'}`}>
          {sortedMatches.length} Maç
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sortedMatches.map((match, index) => {
          const isEligible = isMatchEligibleForPayment(match);
          const matchId = getMatchId(match);
          return (
            <MatchCard
              key={index}
              match={match}
              isGreenMode={isGreenMode}
              paymentStatus={paymentStatuses?.[matchId]}
              onTogglePayment={onTogglePayment}
              isEligibleForPayment={isEligible}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;