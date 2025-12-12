import React, { useEffect, useRef } from 'react';
import { Activity, Terminal, Wifi } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'network';
}

interface TrafficLoggerProps {
  logs: LogEntry[];
}

const TrafficLogger: React.FC<TrafficLoggerProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom only if new logs appear
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-md flex flex-col h-[300px]">
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-green-400" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Canlı Ağ Trafiği</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
           <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 custom-scrollbar bg-black/50">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
            <Wifi size={24} className="opacity-20" />
            <span>Bağlantı bekleniyor...</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 animate-in slide-in-from-left-2 duration-300">
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span className={`break-all ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'network' ? 'text-blue-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-300'
              }`}>
                {log.type === 'network' && <span className="text-purple-400 mr-1">GET</span>}
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default TrafficLogger;