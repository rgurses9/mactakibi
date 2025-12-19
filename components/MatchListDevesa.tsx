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
    console.log(`Toggling ${type} for match ${matchId}`);
    if (onTogglePayment) {
      onTogglePayment(matchId, type);
    }
  };

  // REALLY MASSIVE VERSION - 500PX CHECKBOXES
  return (
    <div
      style={{
        backgroundColor: isGreenMode ? '#ffffff' : '#f9fafb',
        borderColor: isGreenMode ? '#e5e7eb' : '#d1d5db',
      }}
      className={`group rounded-[60px] border-[6px] shadow-2xl overflow-hidden mb-16 dark:bg-gray-900 dark:border-gray-800 p-12 transition-all duration-300 relative z-10
        ${isGreenMode ? 'ring-2 ring-gray-200 dark:ring-gray-700' : ''}
      `}
    >
      {/* Category & Details */}
      <div className="text-4xl font-black uppercase text-black dark:text-white mb-8 border-b-8 pb-6 border-orange-500">
        {match.category} {match.group ? `• ${match.group}` : ''} | {match.hall}
      </div>

      {/* Time & Date */}
      <div className="text-5xl font-black text-white mb-10 bg-black dark:bg-gray-700 inline-block px-10 py-4 rounded-3xl shadow-lg">
        {match.time} - {formatDate(match.date)}
      </div>

      {/* Teams Section */}
      <div className="flex flex-col items-center gap-6 mb-24 text-center">
        <span className="text-6xl font-black text-black dark:text-white">{match.teamA}</span>
        <div className="w-full flex items-center justify-center gap-4">
          <div className="h-2 flex-1 bg-gray-300 rounded"></div>
          <span className="bg-red-600 text-white px-12 py-3 rounded-full text-3xl font-black shadow-xl">VS</span>
          <div className="h-2 flex-1 bg-gray-300 rounded"></div>
        </div>
        <span className="text-6xl font-black text-black dark:text-white">{match.teamB}</span>
      </div>

      {/* THE DEVESA BUTTONS AREA - ALWAYS SHOW BOTH FOR MAX COMPATIBILITY */}
      {onTogglePayment && (
        <div className="flex flex-col items-center gap-40 w-full relative z-20">

          {/* GSB DEVESA BUTTON */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => handleToggle('gsb')}
              className="transform transition-all active:scale-95 hover:scale-105 cursor-pointer p-2"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-[200px] h-[200px] rounded-[32px] border-[16px] flex items-center justify-center shadow-xl transition-colors duration-300 pointer-events-none"
                style={{
                  backgroundColor: paymentStatus.gsbPaid ? '#22c55e' : '#ffffff',
                  borderColor: paymentStatus.gsbPaid ? '#15803d' : '#9ca3af'
                }}>
                {paymentStatus.gsbPaid && (
                  <svg className="w-[140px] h-[140px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={8} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
            <span className={`text-6xl font-black uppercase tracking-tighter ${paymentStatus.gsbPaid ? 'text-red-600 line-through decoration-[8px]' : 'text-black dark:text-white'}`}>
              GSB
            </span>
          </div>

          {/* EK DEVESA BUTTON */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={(e) => {
                if (paymentType === PaymentType.CUSTOM_FEE && !paymentStatus.isCustomFeeSet) {
                  handleCustomFeeClick(e);
                } else {
                  handleToggle('ek');
                }
              }}
              className="transform transition-all active:scale-95 hover:scale-105 cursor-pointer p-2"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-[200px] h-[200px] rounded-[32px] border-[16px] flex items-center justify-center shadow-xl transition-colors duration-300 pointer-events-none"
                style={{
                  backgroundColor: paymentStatus.ekPaid ? '#22c55e' : '#ffffff',
                  borderColor: paymentStatus.ekPaid ? '#15803d' : '#9ca3af'
                }}>
                {paymentStatus.ekPaid && (
                  <svg className="w-[140px] h-[140px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={8} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
            <span className={`text-4xl font-black uppercase tracking-tighter text-center leading-none ${paymentStatus.ekPaid ? 'text-black line-through opacity-40 decoration-[6px]' : 'text-black dark:text-white'}`}>
              {paymentStatus.ekPaid ? 'Ödeme Tamamlandı' : 'EK'}
            </span>
          </div>
        </div>
      )}

      {/* DUTY BADGE (RIFAT GURSES) */}
      <div className="mt-20 pt-16 border-t-8 border-gray-200 dark:border-gray-800">
        {[
          { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
          { label: match.timerLabel || 'Görevli 2', value: match.timer },
          { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
        ].map((duty, i) => {
          const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
          const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');
          if (!isRifat) return null;

          return (
            <div key={i} className="bg-yellow-400 border-[12px] border-yellow-600 rounded-[50px] p-12 text-center shadow-2xl transform rotate-1">
              <div className="text-4xl font-black uppercase text-black mb-4 tracking-widest">{duty.label}</div>
              <div className="text-7xl font-black text-black">{duty.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MatchList: React.FC<MatchListProps> = ({ matches, title = "Maç Programı", variant = 'active', paymentStatuses, onTogglePayment, userEmail }) => {
  if (matches.length === 0) return null;

  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    const dateDiff = dateB.getTime() - dateA.getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.time || '').localeCompare(a.time || '');
  });

  const isGreenMode = variant === 'active';

  return (
    <div className={`${variant === 'past' ? 'opacity-90' : ''}`}>
      <div className="flex items-center justify-between mb-8 mt-12">
        <h2 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter">
          {title}
        </h2>
        <span className="text-3xl font-black bg-black text-white px-8 py-3 rounded-full">
          {sortedMatches.length} MAÇ
        </span>
      </div>

      <div className="grid grid-cols-1 gap-12">
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