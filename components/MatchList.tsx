import React from 'react';
import { MatchDetails } from '../types';
import { MapPin, FileText, Trophy, History, CheckCircle2 } from 'lucide-react';
import { parseDate, isPastDate, formatDate } from '../utils/dateHelpers';

interface MatchListProps {
  matches: MatchDetails[];
  title?: string;
  variant?: 'active' | 'past';
}

const MatchList: React.FC<MatchListProps> = ({ matches, title = "Maç Programı", variant = 'active' }) => {
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
              {/* Top: Time & Date Header */}
              <div className={`border-b border-dashed flex items-center justify-between px-4 py-3 transition-colors
                  ${isGreenMode ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700'}
              `}>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black tracking-tight ${isGreenMode ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                    {match.time}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded">
                    {formatDate(match.date)}
                  </div>
                </div>
                {match.sourceFile && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FileText size={12} />
                    <span className="truncate max-w-[200px]">{match.sourceFile}</span>
                  </div>
                )}
              </div>

              {/* Bottom: Match Details */}
              <div className="p-4">
                {/* Category & Group & Hall */}
                <div className="mb-3">
                  <div className={`text-xs font-bold tracking-wide uppercase mb-2 flex items-center gap-1.5 ${isGreenMode ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isGreenMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {match.category} {match.group ? `• ${match.group}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-white text-sm font-medium">
                    <MapPin size={14} />
                    {match.hall}
                  </div>
                </div>

                {/* Teams */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold flex-1 text-right ${isGreenMode ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{match.teamA}</span>
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-[9px] font-black px-1.5 py-0.5 rounded">VS</div>
                  <span className={`text-sm font-bold flex-1 text-left ${isGreenMode ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{match.teamB}</span>
                </div>

                {/* Duties (Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: match.scorerLabel || 'Görevli 1', value: match.scorer },
                    { label: match.timerLabel || 'Görevli 2', value: match.timer },
                    { label: match.shotClockLabel || 'Görevli 3', value: match.shotClock },
                  ].map((duty, i) => {
                    const upperValue = duty.value?.toLocaleUpperCase('tr-TR') || '';
                    const isRifat = upperValue.includes('RIFAT') || upperValue.includes('GÜRSES');

                    // Visual logic for duty boxes
                    let boxClass = 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600';
                    let textClass = 'text-gray-900 dark:text-white';
                    let labelClass = 'text-gray-700 dark:text-gray-300';

                    if (isRifat) {
                      if (isGreenMode) {
                        // Basketball orange background with black text
                        boxClass = 'bg-[#FF8C00] border-[#D97706] dark:bg-[#FF8C00] dark:border-[#D97706] shadow-lg transform scale-105 z-10';
                        textClass = 'text-black dark:text-black font-extrabold';
                        labelClass = 'text-[#7C2D12] dark:text-[#7C2D12]';
                      } else {
                        boxClass = 'bg-[#FFA500] border-[#FF8C00] dark:bg-[#FFA500] dark:border-[#FF8C00]';
                        textClass = 'text-black dark:text-black font-extrabold';
                        labelClass = 'text-[#7C2D12] dark:text-[#7C2D12]';
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;