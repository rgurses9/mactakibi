import React, { useState } from 'react';
import { Send, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { MatchDetails } from '../types';

interface WhatsAppSenderProps {
  matches: MatchDetails[];
  config: {
    phone: string;
    apiKey: string;
  };
}

const WhatsAppSender: React.FC<WhatsAppSenderProps> = ({ matches, config }) => {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendToWhatsApp = async () => {
    if (matches.length === 0) return;
    if (!config.phone || !config.apiKey) {
      alert("Lütfen önce Bot Ayarları menüsünden telefon ve API anahtarınızı girin.");
      return;
    }

    setSending(true);
    setStatus('idle');

    try {
      // Build message
      let message = "🚨 *GÖREV BİLGİSİ (Manuel Kontrol)*\n";
      message += "👤 *İsim:* RIFAT GÜRSES\n";
      message += "⏰ *Tarih:* " + new Date().toLocaleTimeString("tr-TR") + "\n";
      message += "〰️〰️〰️〰️〰️〰️〰️〰️\n";

      matches.forEach(match => {
        message += "\n🏀 *MAÇ/GÖREV DETAYI:*\n";
        message += `📅 Tarih: ${match.date}\n`;
        message += `🏟️ Salon: ${match.hall}\n`;
        message += `⏰ Saat: ${match.time}\n`;
        message += `⚔️ Maç: ${match.teamA} 🆚 ${match.teamB}\n`;
        message += `🏷️ Kategori: ${match.category} / ${match.group}\n`;
        message += `📝 Sayı Grv: ${match.scorer}\n`;
        message += `⏱️ Saat Grv: ${match.timer}\n`;
        message += `⏳ Şut Saati: ${match.shotClock}\n`;
        message += "------------------------\n";
      });

      message += "\n✅ _Web uygulaması üzerinden gönderildi._";

      const encodedMessage = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${config.phone}&text=${encodedMessage}&apikey=${config.apiKey}`;

      await fetch(url, { method: 'GET', mode: 'no-cors' });

      setStatus('success');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  const isConfigured = config.phone && config.apiKey && config.phone.length > 5 && config.apiKey.length > 3;

  if (!isConfigured) {
    return (
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center">
        <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">WhatsApp Yapılandırılmadı</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bildirimler için Bot Ayarlarını kullanın.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full group">
      <button
        onClick={sendToWhatsApp}
        disabled={sending || matches.length === 0}
        style={{
          backgroundColor: status === 'success' ? '#16a34a' : '#25D366',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 15%, transparent 16%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0'
        }}
        className={`w-full py-4 px-6 rounded-2xl border-2 ${status === 'success' ? 'border-green-800' : 'border-green-700'} shadow-lg flex flex-col items-center justify-center gap-2 transform transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg border border-white/20 text-white shadow-sm">
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : status === 'success' ? (
                <Check size={20} className="text-white drop-shadow-md" />
              ) : (
                <MessageSquare size={20} className="text-white drop-shadow-md" />
              )}
            </div>
            <span className="text-white text-sm font-black uppercase tracking-widest drop-shadow-md">
              {sending ? 'GÖNDERİLİYOR...' : status === 'success' ? 'BAŞARIYLA İLETİLDİ!' : 'LİSTEYİ WHATSAPP\'A GÖNDER'}
            </span>
          </div>

          <div className="bg-black/20 p-2 rounded-lg border border-white/10 text-white group-hover:bg-black/30 transition-colors">
            <Send size={18} className={sending ? 'animate-bounce' : ''} />
          </div>
        </div>

        {/* BOTTOM INFO AREA INTEGRATED */}
        <div className="w-full mt-2 pt-2 border-t border-white/10 flex justify-center">
          <span className="text-[10px] text-white/90 font-black tracking-widest uppercase drop-shadow-sm">
            HEDEF: {config.phone.replace(/.(?=.{4})/g, '*')} • SERVİS: CALLMEBOT
          </span>
        </div>
      </button>
    </div>
  );
};

export default WhatsAppSender;