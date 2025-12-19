import React, { useState } from 'react';
import { Send, Check, AlertCircle, Settings } from 'lucide-react';
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

  return (
    <div className="mt-6">
      {!isConfigured ? (
        <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">WhatsApp Yapılandırılmadı</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Bildirim göndermek için Bot Ayarlarını yapın.</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={sendToWhatsApp}
          disabled={sending || matches.length === 0}
          className={`w-full py-4 px-6 rounded-xl font-bold text-black flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${status === 'success'
            ? 'bg-green-500'
            : sending
              ? 'bg-green-400'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
            }`}
        >
          {sending ? (
            <span className="animate-pulse">Gönderiliyor...</span>
          ) : status === 'success' ? (
            <><Check size={24} /> Başarıyla İletildi</>
          ) : (
            <><Send size={24} /> Listeyi WhatsApp'a Gönder</>
          )}
        </button>
      )}

      {isConfigured && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-black dark:text-white font-bold uppercase">
            Hedef: {config.phone.replace(/.(?=.{4})/g, '*')} • Servis: CallMeBot
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSender;