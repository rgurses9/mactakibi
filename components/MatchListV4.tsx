import React from 'react';
import { MapPin, History, CheckCircle2 } from 'lucide-react';
import { MatchDetails } from '../types';
import { parseDate, formatDate } from '../utils/dateHelpers';
import { PaymentStatus, PaymentType, isMatchEligibleForPayment, getMatchId, getPaymentType } from '../services/paymentService';

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
}> = ({ match, isGreenMode, paymentStatus = { gsbPaid: false, ekPaid: false }, onTogglePayment }) => {

  const matchId = getMatchId(match);
  const paymentType = getPaymentType(match);

  const handleCustomFeeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentFee = paymentStatus.customFee || 0;
    const feeStr = window.prompt("Lütfen maç ücretini giriniz (TL):", currentFee.toString());
    if (feeStr !== null) {
      const fee = parseFloat(feeStr);
      if (!isNaN(fee) && fee > 0 && onTogglePayment) {
        onTogglePayment(matchId, 'ek', fee);
      }
    }
  };

  const handleToggle = (type: 'gsb' | 'ek') => {
    if (onTogglePayment) {
      onTogglePayment(matchId, type);
    }
  };

  // MINI VERSION - COMPACT DESIGN
  return (
    <div
      style={{
        backgroundColor: isGreenMode ? '#ffffff' : '#f9fafb',
        borderColor: isGreenMode ? '#e5e7eb' : '#d1d5db',
      }}
      className={`group rounded-lg border shadow-sm overflow-hidden mb-2 dark:bg-gray-900 dark:border-gray-800 p-3 transition-all duration-300 relative
        ${isGreenMode ? 'ring-1 ring-gray-100 dark:ring-gray-800' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-0.5 truncate">
            {match.category} {match.group ? `• ${match.group}` : ''}
          </div>
          <div className="text-sm font-black text-black dark:text-white leading-tight mb-1">
            {match.teamA} vs {match.teamB}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-0.5"><MapPin size={10} />{match.hall}</span>
            <span>• {match.time}</span>
            <span>• {formatDate(match.date)}</span>
          </div>
        </div>

        {/* Mini Buttons Column */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* GSB Mini */}
          <button
            onClick={() => handleToggle('gsb')}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${paymentStatus.gsbPaid ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`}>
              {paymentStatus.gsbPaid && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className={`text-[10px] font-black w-6 ${paymentStatus.gsbPaid ? 'text-red-600 line-through decoration-1' : 'text-black dark:text-white'}`}>
              GSB
            </span>
          </button>

          {/* EK Mini */}
          <button
            onClick={(e) => {
              if (paymentType === PaymentType.CUSTOM_FEE && !paymentStatus.isCustomFeeSet) {
                handleCustomFeeClick(e);
              } else {
                handleToggle('ek');
              }
            }}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${paymentStatus.ekPaid ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`}>
              {paymentStatus.ekPaid && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className={`text-[10px] font-black w-6 text-center ${paymentStatus.ekPaid ? 'text-red-600 line-through decoration-1' : 'text-black dark:text-white'}`}>
              EK
            </span>
          </button>
        </div>
      </div>

      {/* Mini Duty Indicator */}
      {(() => {
        const duties = [
          { value: match.scorer },
          { value: match.timer },
          { value: match.shotClock },
        ];
        const rifatDuty = duties.find(d => {
          const val = d.value?.toLocaleUpperCase('tr-TR') || '';
          return val.includes('RIFAT') || val.includes('GÜRSES');
        });

        if (!rifatDuty) return null;

        const isFullyPaid = (paymentType === PaymentType.STANDARD && paymentStatus.gsbPaid && paymentStatus.ekPaid) ||
          (paymentType === PaymentType.GSB_ONLY && paymentStatus.gsbPaid) ||
          (paymentType === PaymentType.CUSTOM_FEE && paymentStatus.ekPaid);

        return (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            {isGreenMode ? (
              <span className="bg-yellow-300 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">
                GÖREVLİSİN ✅
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-red-700 dark:text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/30">
                  {isFullyPaid ? 'ÖDEME ALINDI' : 'GÖREV TAMAMLANDI'}
                </span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const MatchList: React.FC<MatchListProps> = ({ matches, title = "Maç Programı", variant = 'active', paymentStatuses, onTogglePayment }) => {
  if (matches.length === 0) return null;
  const isGreenMode = variant === 'active';
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className={`${variant === 'past' ? 'opacity-80' : ''} mb-6`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-1.5">
          {variant === 'active' ? <CheckCircle2 size={14} className="text-green-600" /> : <History size={14} className="text-gray-500" />}
          {title}
        </h2>
        <span className={`text-[10px] font-black ${variant === 'active' ? 'bg-[#ee6730] text-white' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded shadow-sm`}>
          {sortedMatches.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {sortedMatches.map((match, index) => {
          const id = getMatchId(match);
          return (
            <MatchCard
              key={index}
              match={match}
              isGreenMode={isGreenMode}
              paymentStatus={paymentStatuses?.[id]}
              onTogglePayment={onTogglePayment}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;