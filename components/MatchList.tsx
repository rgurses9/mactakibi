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
        className={`group bg-white rounded-xl border-2 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 relative
          ${isGreenMode ? 'border-green-400 ring-2 ring-green-50 shadow-green-100' : 'border-black bg-gray-50'}
        `}
      >
        {/* Payment Status Checkboxes - Top Right (Clickable) */}
        {isEligibleForPayment && onTogglePayment && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-black">
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
                  <span className="text-xs font-semibold text-gray-900">GSB</span>
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
                  <span className="text-xs font-semibold text-gray-900">EK</span>
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-black bg-white px-3 py-1.5 rounded-lg border border-black">
            <FileText size={12} />
            <span className="truncate max-w-[200px]">{match.sourceFile}</span>
          </div>
        )}
      </div>

      {/* Bottom: Match Details */}
      <div className="p-4">
        {/* Category + Time/Date + Hall + Teams - All in one row */}
        <div className="flex items-center justify-center gap-4 mb-3 bg-white p-3 rounded-lg">
          {/* Left: Category & Hall */}
          <div className="flex flex-col gap-2 items-center">
            <div className={`text-xs font-semibold uppercase flex items-center gap-0 text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isGreenMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {match.category} {match.group ? `• ${match.group}` : ''}
            </div>
            <div className={`flex items-center gap-0 text-xs font-semibold text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>
              <MapPin size={12} />
              {match.hall}
            </div>
          </div>

          {/* Center: Time & Date */}
          <div className="flex flex-col items-center gap-2">
            <div className={`text-xs font-semibold text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>
              {match.time}
            </div>
            <div className={`text-xs font-semibold bg-white border border-black px-2 py-0.5 rounded text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(match.date)}
            </div>
          </div>

          {/* Right: Teams */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>{match.teamA}</span>
            <div className={`bg-gray-100 text-xs font-semibold px-1.5 py-0.5 rounded text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>VS</div>
            <span className={`text-xs font-semibold text-center ${paymentStatus.gsbPaid || paymentStatus.ekPaid ? 'text-red-600' : 'text-gray-900'}`}>{match.teamB}</span>
          </div>
        </div>

        {/* Duties (Grid) */}
        <div className={`grid ${isEligibleForPayment && showPaymentButtons && paymentType === PaymentType.STANDARD ? 'grid-cols-1 sm:grid-cols-5' :
          isEligibleForPayment && showPaymentButtons && paymentType === PaymentType.GSB_ONLY ? 'grid-cols-1 sm:grid-cols-4' :
            isEligibleForPayment && showPaymentButtons && paymentType === PaymentType.CUSTOM_FEE ? 'grid-cols-1 sm:grid-cols-5' :
              'grid-cols-1 sm:grid-cols-3'
          } gap-2`}>
          {[
            { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
            { label: match.timerLabel || 'Görevli 2', value: match.timer },
            { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
          ].map((duty, i) => {
            const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
            const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');

            // Visual logic for duty boxes
            let boxClass = 'bg-white border-black';
            let textClass = 'text-gray-900';
            let labelClass = 'text-gray-700';

            if (isRifat) {
              if (isGreenMode) {
                // Basketball orange background with black text
                boxClass = 'bg-orange-500 border-orange-600 shadow-xl transform scale-110 z-10 ring-2 ring-orange-400';
                textClass = 'text-black font-black';
                labelClass = 'text-orange-900 font-bold';
              } else {
                // Basketball orange background with black text
                boxClass = 'bg-orange-400 border-orange-500 shadow-lg';
                textClass = 'text-black font-black';
                labelClass = 'text-orange-900 font-bold';
              }
            }

            return (
              <div
                key={i}
                className={`
                          relative px-2 py-1.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all duration-300
                          ${boxClass}
                `}
              >
                <span className={`text-[7px] uppercase font-bold tracking-wider mb-0.5 ${labelClass}`}>
                  {duty.label}
                </span>
                <span className={`text-[10px] font-bold ${textClass}`}>
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
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-green-800">Ödemesi Tamamlandı</span>
              </div>

              {/* Duty Assignments */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
                  { label: match.timerLabel || 'Görevli 2', value: match.timer },
                  { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
                ].map((duty, i) => (
                  <div key={i} className="bg-white rounded p-2 border border-green-300">
                    <div className="text-[8px] uppercase font-bold text-green-700 mb-1">
                      {duty.label}
                    </div>
                    <div className="text-[10px] font-semibold text-gray-900">
                      {duty.value || '-'}
                    </div>
                  </div>
                ))}
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
    <div className={`space-y-0 ${variant === 'past' ? 'opacity-70 grayscale-[0.8]' : ''}`}>
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isGreenMode ? 'text-green-700' : 'text-gray-600'}`}>
          {isGreenMode ? <CheckCircle2 className="text-green-600" size={20} /> : <History className="text-gray-500" size={20} />}
          {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isGreenMode ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {sortedMatches.length} Maç
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0">
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