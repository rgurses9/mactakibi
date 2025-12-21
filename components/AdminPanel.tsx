import React, { useEffect, useState } from 'react';
import { X, Trash2, User, ShieldAlert, Search, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { getAllUsers, deleteUser } from '../services/firebaseService';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserEmail?: string | null;
}

interface UserData {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isApproved: boolean;
    createdAt: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, currentUserEmail }) => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data as UserData[]);
        } catch (error) {
            console.error("Kullanıcılar çekilemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const handleDelete = async (uid: string, email: string) => {
        if (confirm(`${email} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            try {
                await deleteUser(uid);
                // Remove from local state
                setUsers(prev => prev.filter(u => u.uid !== uid));
            } catch (error) {
                alert("Silme işlemi başarısız oldu.");
            }
        }
    };

    // Helper to calculate membership duration
    const calculateDuration = (dateStr: string) => {
        if (!dateStr) return "Bilinmiyor";
        const start = new Date(dateStr);
        const now = new Date();
        // Handle invalid dates
        if (isNaN(start.getTime())) return "Bilinmiyor";

        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) return "Bugün Katıldı";
        if (diffDays < 30) return `${diffDays} Gündür Üye`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} Aydır Üye`;
        return `${Math.floor(diffDays / 365)} Yıldır Üye`;
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-red-700 p-4 flex items-center justify-between text-white shrink-0">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <ShieldAlert size={24} className="text-red-200" />
                        Yönetici Paneli
                    </h3>
                    <button onClick={onClose} className="hover:bg-red-800 p-1.5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white">Kullanıcı Yönetimi</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sisteme kayıtlı kullanıcıları görüntüleyin ve yönetin.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Kullanıcı ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-800 dark:text-gray-200"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">E-Posta</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kayıt & Süre</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">Kullanıcı bulunamadı.</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => {
                                            const adminEmails = ['admin@admin.com', 'rifatgurses@gmail.com'];
                                            const isAdmin = user.role === 'admin' || adminEmails.includes(user.email.toLowerCase());
                                            const isMe = currentUserEmail === user.email;
                                            const joinDate = user.createdAt ? new Date(user.createdAt) : null;

                                            return (
                                                <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}>
                                                                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                                    {user.firstName} {user.lastName}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                    <User size={10} />
                                                                    {isAdmin ? 'Yönetici' : 'Üye'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                                                        {user.email}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            {joinDate ? (
                                                                <>
                                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                                                        <Calendar size={12} className="text-gray-400" />
                                                                        {joinDate.toLocaleDateString('tr-TR')}
                                                                        <span className="text-gray-400 font-normal">{joinDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {calculateDuration(user.createdAt)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Tarih Bilgisi Yok</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {isAdmin ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30">
                                                                <ShieldCheck size={12} /> Admin
                                                            </span>
                                                        ) : user.isApproved ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30">
                                                                Onaylı
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/30">
                                                                Bekliyor
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {!isMe && (
                                                            <button
                                                                onClick={() => handleDelete(user.uid, user.email)}
                                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Kullanıcıyı Sil"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="mt-4 text-xs text-gray-400 text-center">
                        Not: Bir kullanıcıyı sildiğinizde veritabanı kaydı kaldırılır ve sisteme giriş yapamaz.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;