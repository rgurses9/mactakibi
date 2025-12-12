import React, { useState } from 'react';
import { Save, Phone, Key, HelpCircle } from 'lucide-react';

interface BotConfig {
    phone: string;
    apiKey: string;
}

interface ScriptGeneratorProps {
    initialConfig: BotConfig;
    onSave: (config: BotConfig) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ initialConfig, onSave }) => {
  const [phone, setPhone] = useState(initialConfig.phone);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);

  const handleSave = () => {
      onSave({ phone, apiKey });
  };

  return (
    <div className="space-y-6">
        <p className="text-gray-600 text-sm">
            Aşağıdaki bilgileri girerek otomatik WhatsApp bildirim sistemini yapılandırın. 
            Bu bilgiler cihazınızda saklanır ve maç bildirimlerini göndermek için kullanılır.
        </p>

        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Phone size={14} className="text-green-600" />
                    WhatsApp Telefon Numarası
                </label>
                <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Örn: 905xxxxxxxxx"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                    Ülke kodu ile birlikte boşluksuz yazın.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Key size={14} className="text-green-600" />
                    CallMeBot API Key
                </label>
                <input 
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API Key"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                <div className="mt-2 bg-blue-50 p-2 rounded text-[10px] text-blue-800 flex items-start gap-1">
                    <HelpCircle size={12} className="shrink-0 mt-0.5" />
                    <p>
                        API Key almak için WhatsApp üzerinden <strong>+34 644 10 52 15</strong> numarasına 
                        <br/><code>I allow callmebot to send me messages</code> yazıp gönderin.
                    </p>
                </div>
            </div>
        </div>

        <button 
            onClick={handleSave}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
            <Save size={18} />
            Ayarları Kaydet
        </button>
    </div>
  );
};

export default ScriptGenerator;