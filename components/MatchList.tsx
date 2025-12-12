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
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isGreenMode ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {isGreenMode ? <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} /> : <History className="text-gray-500 dark:text-gray-400" size={20} />}
            {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isGreenMode ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {sortedMatches.length} Maç
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedMatches.map((match, index) => {
          
          return (
            <div 
              key={index} 
              className={`group bg-white dark:bg-gray-800 rounded-xl border-2 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300
                ${isGreenMode ? 'border-green-400 dark:border-green-800 ring-2 ring-green-50 dark:ring-green-900/20 shadow-green-100 dark:shadow-none' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}
              `}
            >
              <div className="flex flex-col md:flex-row">
                
                {/* Left Side: Time & Date */}
                <div className={`md:w-32 border-b md:border-b-0 md:border-r border-dashed flex flex-row md:flex-col items-center justify-center p-4 gap-3 md:gap-1 text-center transition-colors
                    ${isGreenMode ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700'}
                `}>
                    <div className={`text-2xl font-black tracking-tight ${isGreenMode ? 'text-green-800 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {match.time}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded uppercase">
                        {match.date}
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 p-5">
                    {/* Header: Category & Hall */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                        <div>
                             <div className={`text-xs font-bold tracking-wide uppercase mb-1 flex items-center gap-1.5 ${isGreenMode ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isGreenMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                {match.category} {match.group ? `• ${match.group}` : ''}
                             </div>
                             <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                <MapPin size={14} />
                                {match.hall}
                             </div>
                        </div>
                        {match.sourceFile && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600 max-w-[150px] truncate">
                                <FileText size={10} />
                                {match.sourceFile}
                            </div>
                        )}
                    </div>

                    {/* Teams */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className={`text-lg font-bold flex-1 text-right ${isGreenMode ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{match.teamA}</span>
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[10px] font-black px-2 py-1 rounded">VS</div>
                        <span className={`text-lg font-bold flex-1 text-left ${isGreenMode ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{match.teamB}</span>
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
                            let boxClass = 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600';
                            let textClass = 'text-gray-700 dark:text-gray-200';
                            let labelClass = 'text-gray-400 dark:text-gray-500';

                            if (isRifat) {
                                if (isGreenMode) {
                                    boxClass = 'bg-green-600 border-green-600 dark:bg-green-700 dark:border-green-700 shadow-md transform scale-105 z-10';
                                    textClass = 'text-white';
                                    labelClass = 'text-green-100 dark:text-green-200';
                                } else {
                                    boxClass = 'bg-gray-600 border-gray-600 dark:bg-gray-600 dark:border-gray-600';
                                    textClass = 'text-white';
                                    labelClass = 'text-gray-300';
                                }
                            }

                            return (
                                <div 
                                key={i} 
                                className={`
                                    relative px-3 py-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all duration-300
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