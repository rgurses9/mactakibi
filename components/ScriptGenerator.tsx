import React, { useState } from 'react';
import { Save, Phone, Key, HelpCircle, Send, MessageSquare } from 'lucide-react';
import { BotConfig } from '../types';

interface ScriptGeneratorProps {
    initialConfig: BotConfig;
    onSave: (config: BotConfig) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ initialConfig, onSave }) => {
    const [platform, setPlatform] = useState<'whatsapp' | 'telegram'>(initialConfig.platform);
    const [phone, setPhone] = useState(initialConfig.phone);
    const [whatsappApiKey, setWhatsappApiKey] = useState(initialConfig.whatsappApiKey);
    const [telegramUserId, setTelegramUserId] = useState(initialConfig.telegramUserId);
    const [telegramApiKey, setTelegramApiKey] = useState(initialConfig.telegramApiKey);

    const handleSave = () => {
        onSave({
            platform,
            phone,
            whatsappApiKey,
            telegramUserId,
            telegramApiKey
        });
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-600 text-sm">
                Bildirim almak istediğiniz platformu seçin ve gerekli bilgileri girin.
            </p>

            {/* Platform Selection */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setPlatform('whatsapp')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${platform === 'whatsapp'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare size={16} />
                    WhatsApp
                </button>
                <button
                    onClick={() => setPlatform('telegram')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${platform === 'telegram'
                            ? 'bg-white text-blue-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Send size={16} />
                    Telegram
                </button>
            </div>

            <div className="space-y-4">
                {platform === 'whatsapp' ? (
                    <>
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
                                CallMeBot WhatsApp API Key
                            </label>
                            <input
                                type="text"
                                value={whatsappApiKey}
                                onChange={(e) => setWhatsappApiKey(e.target.value)}
                                placeholder="API Key"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                            <div className="mt-2 bg-blue-50 p-2 rounded text-[10px] text-blue-800 flex items-start gap-1">
                                <HelpCircle size={12} className="shrink-0 mt-0.5" />
                                <p>
                                    API Key almak için WhatsApp üzerinden <strong>+34 644 10 52 15</strong> numarasına
                                    <br /><code>I allow callmebot to send me messages</code> yazıp gönderin.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2">
                                <Send size={14} className="text-blue-500" />
                                Telegram Kullanıcı Adı veya ID
                            </label>
                            <input
                                type="text"
                                value={telegramUserId}
                                onChange={(e) => setTelegramUserId(e.target.value)}
                                placeholder="Örn: @kullaniciadi veya Chat ID"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2">
                                <Key size={14} className="text-blue-500" />
                                CallMeBot Telegram API Key
                            </label>
                            <input
                                type="text"
                                value={telegramApiKey}
                                onChange={(e) => setTelegramApiKey(e.target.value)}
                                placeholder="API Key"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <div className="mt-2 bg-blue-50 p-2 rounded text-[10px] text-blue-800 flex items-start gap-1">
                                <HelpCircle size={12} className="shrink-0 mt-0.5" />
                                <p>
                                    Telegram'da <strong>@CallMeBot_Bot</strong> botuna mesaj atarak API key alabilirsiniz.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button
                onClick={handleSave}
                className={`w-full text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${platform === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
            >
                <Save size={18} />
                Ayarları Kaydet
            </button>
        </div>
    );
};

export default ScriptGenerator;