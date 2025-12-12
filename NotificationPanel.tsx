import React from 'react';
import { Bell, FileText, Clock } from 'lucide-react';

interface Notification {
  id: string;
  file: string;
  count: number;
  time: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Bell size={18} className="text-blue-600" />
          Bildirimler
        </h3>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.length}
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <Bell size={24} className="opacity-20" />
            <span>Yeni bildirim bulunmuyor.</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors group cursor-default">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={notif.file}>
                    {notif.file}
                  </h4>
                  <p className="text-xs text-green-600 font-bold mt-0.5 flex items-center gap-1">
                    +{notif.count} Maç Eklendi
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                    <Clock size={10} />
                    {notif.time}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;