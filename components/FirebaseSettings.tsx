import React, { useState, useEffect } from 'react';
import { Flame, Save, X, Database } from 'lucide-react';

interface FirebaseSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCILoR2i6TtjpMl6pW0OOBhc3naQHAd12Q",
  authDomain: "mactakibi-50e0b.firebaseapp.com",
  projectId: "mactakibi-50e0b",
  storageBucket: "mactakibi-50e0b.firebasestorage.app",
  messagingSenderId: "529275453572",
  appId: "1:529275453572:web:4d6102920b55724e5902d1",
  measurementId: "G-V793VBMXF7",
  databaseURL: "https://mactakibi-50e0b.firebaseio.com"
};

const FirebaseSettings: React.FC<FirebaseSettingsProps> = ({ isOpen, onClose, onSave }) => {
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('firebase_config');
    if (saved) {
      // Prettify JSON for display
      try {
        setConfigJson(JSON.stringify(JSON.parse(saved), null, 2));
      } catch (e) {
        setConfigJson(saved);
      }
    } else {
      // Use default if nothing saved
      setConfigJson(JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
  }, [isOpen]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(configJson);
      if (!parsed.databaseURL && !parsed.projectId) {
        throw new Error("Geçersiz Firebase yapılandırması.");
      }
      localStorage.setItem('firebase_config', JSON.stringify(parsed));
      onSave(parsed);
      onClose();
    } catch (e) {
      setError("Geçersiz JSON formatı. Lütfen Firebase konsolundan aldığınız config objesini olduğu gibi yapıştırın.");
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-orange-600 p-4 flex items-center justify-between text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Flame size={20} className="fill-orange-400 text-white" />
            Firebase Canlı Veri Ayarları
          </h3>
          <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Gerçek zamanlı veri akışı için Firebase Projenizin yapılandırma kodunu (JSON) aşağıya yapıştırın.
          </p>

          <div className="relative mb-4">
            <textarea
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value);
                setError(null);
              }}
              placeholder='{ "apiKey": "...", "authDomain": "...", "databaseURL": "..." }'
              className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium text-sm hover:bg-gray-100 rounded-lg"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-orange-600 text-white font-bold text-sm rounded-lg hover:bg-orange-700 shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              Kaydet & Bağlan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSettings;