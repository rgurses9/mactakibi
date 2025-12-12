import React from 'react';
import { MatchDetails } from '../types';
import { Calendar, Clock, MapPin, FileText, AlertCircle, Users, Trophy } from 'lucide-react';
import { parseDate, isPastDate } from '../utils/dateHelpers';

interface MatchListProps {
  matches: MatchDetails[];
}

const MatchList: React.FC<MatchListProps> = ({ matches }) => {
  if (matches.length === 0) return null;

  // Sort matches by date ascending
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Maç Programı
        </h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
            {sortedMatches.length} Maç
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedMatches.map((match, index) => {
          const isPast = isPastDate(match.date);
          
          return (
            <div 
              key={index} 
              className={`group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all ${isPast ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <div className="flex flex-col md:flex-row">
                
                {/* Left Side: Time & Date (Ticket Stub style) */}
                <div className="md:w-32 bg-gray-50 border-b md:border-b-0 md:border-r border-dashed border-gray-300 flex flex-row md:flex-col items-center justify-center p-4 gap-3 md:gap-1 text-center">
                    <div className="text-2xl font-black text-gray-800 tracking-tight">
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
                             <div className="text-xs font-bold text-blue-600 tracking-wide uppercase mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
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
                        <span className="text-lg font-bold text-gray-900 flex-1 text-right">{match.teamA}</span>
                        <div className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-1 rounded">VS</div>
                        <span className="text-lg font-bold text-gray-900 flex-1 text-left">{match.teamB}</span>
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
                            
                            return (
                                <div 
                                key={i} 
                                className={`
                                    relative px-3 py-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all
                                    ${isRifat 
                                        ? 'bg-blue-600 border-blue-600 shadow-md transform scale-105 z-10' 
                                        : 'bg-white border-gray-100'
                                    }
                                `}
                                >
                                    <span className={`text-[9px] uppercase font-bold tracking-wider mb-0.5 ${isRifat ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {duty.label}
                                    </span>
                                    <span className={`text-xs font-bold ${isRifat ? 'text-white' : 'text-gray-700'}`}>
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