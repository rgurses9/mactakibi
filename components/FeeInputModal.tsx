import React, { useState, useEffect, useRef } from 'react';
import { X, Check, DollarSign } from 'lucide-react';

interface FeeInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fee: number) => void;
    initialFee?: number;
    title?: string;
}

const FeeInputModal: React.FC<FeeInputModalProps> = ({ isOpen, onClose, onSave, initialFee = 0, title = "Maç Ücreti Giriniz" }) => {
    const [fee, setFee] = useState<string>(initialFee > 0 ? initialFee.toString() : '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFee(initialFee > 0 ? initialFee.toString() : '');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialFee]);

    const handleSave = () => {
        const numFee = parseFloat(fee);
        if (!isNaN(numFee) && numFee > 0) {
            onSave(numFee);
            onClose();
        } else {
            // Optional: Shake animation or error message
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={20} className="text-purple-600" />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ücret Miktarı (TL)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold">₺</span>
                        </div>
                        <input
                            ref={inputRef}
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="0.00"
                            className="block w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 transition-all shadow-sm"
                        />
                    </div>
                    <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                        Bu maç için belirlenen özel ücreti giriniz.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-all shadow-sm"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!fee || parseFloat(fee) <= 0}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeeInputModal;
