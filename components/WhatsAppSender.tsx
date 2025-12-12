import React, { useState } from 'react';
import { Send, Phone, Key, Check, AlertCircle } from 'lucide-react';
import { MatchDetails } from '../types';

interface WhatsAppSenderProps {
  matches: MatchDetails[];
}

const WhatsAppSender: React.FC<WhatsAppSenderProps> = ({ matches }) => {
  const [phoneNumber, setPhoneNumber] = useState('905307853007');
  const [apiKey, setApiKey] = useState('7933007');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendToWhatsApp = async () => {
    if (matches.length === 0) return;
    
    setSending(true);
    setStatus('idle');

    try {
      // Build message exactly like the Google Apps Script provided
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
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;

      // Using mode: 'no-cors' because CallMeBot doesn't send CORS headers. 
      // We assume success if no network error is thrown.
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

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-green-600 p-2 rounded-lg text-white">
          <Send size={20} />
        </div>
        <h3 className="text-lg font-bold text-green-900">WhatsApp Bildirimi Gönder</h3>
      </div>
      
      <p className="text-sm text-green-800 mb-4">
        Bulunan {matches.length} maçı aşağıdaki numara ve API anahtarı ile WhatsApp'a gönderin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
            <Phone size={12} /> Telefon Numarası
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
            <Key size={12} /> CallMeBot API Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
      </div>

      <button
        onClick={sendToWhatsApp}
        disabled={sending || matches.length === 0}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
          status === 'success' 
            ? 'bg-green-500' 
            : sending 
              ? 'bg-green-400' 
              : 'bg-green-700 hover:bg-green-800 shadow-md hover:shadow-lg'
        }`}
      >
        {sending ? (
          <>Gönderiliyor...</>
        ) : status === 'success' ? (
          <><Check size={20} /> Başarıyla Gönderildi</>
        ) : (
          <><Send size={20} /> WhatsApp'a Gönder</>
        )}
      </button>

      <div className="mt-3 text-xs text-green-700 flex items-start gap-1">
        <AlertCircle size={12} className="mt-0.5 shrink-0" />
        <p>Mesaj CallMeBot servisi kullanılarak gönderilir. Ücretsiz API olduğu için bazen gecikme yaşanabilir.</p>
      </div>
    </div>
  );
};

export default WhatsAppSender;