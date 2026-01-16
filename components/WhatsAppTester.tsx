import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { BotConfig } from '../types';

interface WhatsAppTesterProps {
    config: BotConfig;
}

const WhatsAppTester: React.FC<WhatsAppTesterProps> = ({ config }) => {
    const [testMessage, setTestMessage] = useState('🧪 Test Mesajı - Merhaba! Bu bir test mesajıdır.');
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<{
        status: 'idle' | 'success' | 'error' | 'warning';
        message: string;
        details?: any;
    }>({ status: 'idle', message: '' });

    const testWhatsApp = async () => {
        setTesting(true);
        setResult({ status: 'idle', message: 'Test başlatılıyor...' });

        try {
            // Validate configuration
            if (!config.phone || !config.apiKey) {
                setResult({
                    status: 'error',
                    message: 'Telefon numarası veya API key eksik!'
                });
                setTesting(false);
                return;
            }

            // Check phone format
            const phoneRegex = /^\d{10,15}$/;
            if (!phoneRegex.test(config.phone)) {
                setResult({
                    status: 'warning',
                    message: `Telefon numarası formatı hatalı olabilir: ${config.phone}. Ülke kodu ile birlikte 10-15 rakam olmalı (örn: 905307853007)`
                });
            }

            // Build the test URL
            const encodedMessage = encodeURIComponent(testMessage);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${config.phone}&text=${encodedMessage}&apikey=${config.apiKey}`;

            setResult({
                status: 'idle',
                message: 'CallMeBot API\'ye bağlanılıyor...',
                details: { url: url.substring(0, 100) + '...' }
            });

            // Try to fetch with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Since we can't read response with no-cors, we assume success if no error thrown
            setResult({
                status: 'success',
                message: '✅ İstek başarıyla gönderildi! WhatsApp\'ınızı kontrol edin.',
                details: {
                    phone: config.phone.replace(/.(?=.{4})/g, '*'),
                    timestamp: new Date().toLocaleTimeString('tr-TR'),
                    responseType: response.type
                }
            });

        } catch (error: any) {
            console.error('WhatsApp Test Error:', error);

            let errorMessage = 'Bilinmeyen bir hata oluştu';
            let errorDetails: any = {};

            if (error.name === 'AbortError') {
                errorMessage = '⏱️ İstek zaman aşımına uğradı. CallMeBot servisi yavaş yanıt veriyor olabilir.';
                errorDetails.suggestion = 'Birkaç dakika bekleyip tekrar deneyin.';
            } else if (error.message.includes('network')) {
                errorMessage = '🌐 Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin.';
            } else {
                errorMessage = `❌ Hata: ${error.message}`;
                errorDetails = { error: error.toString() };
            }

            setResult({
                status: 'error',
                message: errorMessage,
                details: errorDetails
            });
        } finally {
            setTesting(false);
        }
    };

    const getStatusIcon = () => {
        switch (result.status) {
            case 'success':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'error':
                return <XCircle className="text-red-500" size={20} />;
            case 'warning':
                return <AlertCircle className="text-yellow-500" size={20} />;
            default:
                return <AlertCircle className="text-gray-400" size={20} />;
        }
    };

    const getStatusColor = () => {
        switch (result.status) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    return (
        <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-blue-800">
                <AlertCircle size={18} />
                <h3 className="font-bold text-sm">WhatsApp Bağlantı Testi</h3>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Test Mesajı
                    </label>
                    <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="Test mesajınızı girin..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border">
                        <span className="text-gray-500">Telefon:</span>
                        <div className="font-mono font-bold text-gray-800">
                            {config.phone || 'Belirlenmemiş'}
                        </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                        <span className="text-gray-500">API Key:</span>
                        <div className="font-mono font-bold text-gray-800">
                            {config.apiKey ? '•'.repeat(config.apiKey.length) : 'Belirlenmemiş'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={testWhatsApp}
                    disabled={testing || !config.phone || !config.apiKey}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {testing ? (
                        <>
                            <Loader className="animate-spin" size={18} />
                            Test Ediliyor...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Test Mesajı Gönder
                        </>
                    )}
                </button>

                {result.message && (
                    <div className={`p-4 rounded-lg border-2 ${getStatusColor()} transition-all`}>
                        <div className="flex items-start gap-2">
                            {getStatusIcon()}
                            <div className="flex-1">
                                <p className="text-sm font-bold">{result.message}</p>
                                {result.details && (
                                    <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-2">📋 Sorun Giderme Kontrol Listesi</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                        <span>1.</span>
                        <span>CallMeBot'a <strong>+34 644 71 81 99</strong> numarasından API key almayı denediniz mi?</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>2.</span>
                        <span>Gönderdiğiniz mesaj: <code className="bg-gray-100 px-1 rounded">I allow callmebot to send me messages</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>3.</span>
                        <span>Telefon numaranız ülke kodu ile başlıyor mu? (örn: 905307853007)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>4.</span>
                        <span>API key'iniz CallMeBot'tan gelen mesajda yazıyor mu?</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>5.</span>
                        <span>Son 24 saat içinde çok fazla mesaj göndermediniz mi? (CallMeBot günlük limiti var)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default WhatsAppTester;
