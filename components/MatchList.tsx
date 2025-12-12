import React from 'react';
import { MatchDetails } from '../types';
import { MapPin, FileText, Trophy, History, CheckCircle2 } from 'lucide-react';
import { parseDate, isPastDate } from '../utils/dateHelpers';

interface MatchListProps {
  matches: MatchDetails[];
  title?: string;
  variant?: 'active' | 'past';
}

const MatchList: React.FC<MatchListProps> = ({ matches, title = "Maç Programı", variant = 'active' }) => {
  if (matches.length === 0) return null;

  // Sorting logic:
  // Active matches: Ascending (Earliest date first)
  // Past matches: Descending (Most recent date first)
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA || !dateB) return 0;

    if (variant === 'past') {
      return dateB.getTime() - dateA.getTime();
    }
    return dateA.getTime() - dateB.getTime();
  });

  const isGreenMode = variant === 'active';

  return (
    <div className={`space-y-4 ${variant === 'past' ? 'opacity-70 grayscale-[0.8]' : ''}`}>
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className={`text-base font-bold flex items-center gap-2 ${isGreenMode ? 'text-green-700' : 'text-gray-600'}`}>
          {isGreenMode ? <CheckCircle2 className="text-green-600" size={18} /> : <History className="text-gray-500" size={18} />}
          {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isGreenMode ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {sortedMatches.length} Maç
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedMatches.map((match, index) => {

          return (
            <div
              key={index}
              className={`group bg-white rounded-xl border-2 shadow-sm overflow-hidden hover:shadow-md transition-all 
                ${isGreenMode ? 'border-green-400 ring-2 ring-green-50 shadow-green-100' : 'border-gray-200 bg-gray-50'}
              `}
            >
              <div className="flex flex-col md:flex-row">

                {/* Left Side: Time & Date */}
                <div className={`md:w-32 border-b md:border-b-0 md:border-r border-dashed flex flex-row md:flex-col items-center justify-center p-4 gap-3 md:gap-1 text-center
                    ${isGreenMode ? 'bg-green-50/50 border-green-200' : 'bg-gray-100/50 border-gray-300'}
                `}>
                  <div className={`text-xl font-black tracking-tight ${isGreenMode ? 'text-green-800' : 'text-gray-600'}`}>
                    {match.time}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded uppercase">
                    {match.date}
                  </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 p-5">
                  {/* Header: Category & Hall */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div>
                      <div className={`text-xs font-bold tracking-wide uppercase mb-1 flex items-center gap-1.5 ${isGreenMode ? 'text-green-700' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isGreenMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {match.category} {match.group ? `• ${match.group}` : ''}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                        <MapPin size={14} />
                        {match.hall}
                      </div>
                    </div>
                    {match.sourceFile && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 max-w-[150px] truncate">
                        <FileText size={10} />
                        {match.sourceFile}
                      </div>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-base font-bold flex-1 text-right ${isGreenMode ? 'text-gray-900' : 'text-gray-600'}`}>{match.teamA}</span>
                    <div className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-1 rounded">VS</div>
                    <span className={`text-base font-bold flex-1 text-left ${isGreenMode ? 'text-gray-900' : 'text-gray-600'}`}>{match.teamB}</span>
                  </div>

                  {/* Duties (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Sayı Görevlisi', value: match.scorer },
                      { label: 'Saat Görevlisi', value: match.timer },
                      { label: 'Şut Saati', value: match.shotClock },
                    ].map((duty, i) => {
                      const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
                      const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');

                      // Visual logic for duty boxes
                      let boxClass = 'bg-white border-gray-100';
                      let textClass = 'text-gray-700';
                      let labelClass = 'text-gray-400';

                      if (isRifat) {
                        if (isGreenMode) {
                          boxClass = 'bg-green-600 border-green-600 shadow-md transform scale-105 z-10';
                          textClass = 'text-white';
                          labelClass = 'text-green-100';
                        } else {
                          boxClass = 'bg-gray-600 border-gray-600';
                          textClass = 'text-white';
                          labelClass = 'text-gray-300';
                        }
                      }

                      return (
                        <div
                          key={i}
                          className={`
                                    relative px-3 py-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all
                                    ${boxClass}
                                `}
                        >
                          <span className={`text-[9px] uppercase font-bold tracking-wider mb-0.5 ${labelClass}`}>
                            {duty.label}
                          </span>
                          <span className={`text-xs font-bold ${textClass}`}>
                            {duty.value || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;