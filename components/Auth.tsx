import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Clock, Check } from 'lucide-react';
import { loginUser, registerUser } from '../services/firebaseService';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPendingApproval(false);

    try {
      if (isLogin) {
        // LOGIN LOGIC
        await loginUser(email, password);
      } else {
        // REGISTER LOGIC
        if (password !== confirmPassword) {
          throw new Error("Şifreler eşleşmiyor.");
        }
        if (password.length < 6) {
          throw new Error("Şifre en az 6 karakter olmalıdır.");
        }

        await registerUser(email, password, firstName, lastName, username);
        setVerificationSent(true);
        // Switch to login view is handled by changing component state, but since verificationSent is true, it shows that screen first.
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Registration/Login Error:', err);
      let msg = "Bir hata oluştu.";

      if (err.message === "ACCOUNT_PENDING_APPROVAL") {
        setPendingApproval(true);
        setLoading(false);
        return;
      }

      if (err.message.includes("auth/invalid-email")) msg = "Geçersiz e-posta adresi.";
      if (err.message.includes("auth/user-not-found")) msg = "Kullanıcı bulunamadı.";
      if (err.message.includes("auth/wrong-password")) msg = "Hatalı şifre.";
      if (err.message.includes("auth/email-already-in-use")) msg = "Bu e-posta zaten kullanımda.";
      if (err.message.includes("Şifreler eşleşmiyor")) msg = err.message;
      if (err.message.includes("en az 6 karakter")) msg = err.message;

      // Show actual error message if no specific match found
      if (msg === "Bir hata oluştu." && err.message) {
        msg = `Hata: ${err.message}`;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-basketball-theme p-4 transition-colors duration-300">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-white/20">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-orange-50">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hesap Onayı Bekleniyor</h2>
          <p className="text-gray-600 mb-8 font-medium leading-relaxed">
            Hesabınız başarıyla oluşturuldu ancak henüz yönetici onayı almadı. Yöneticiniz kaydınızı onayladığında sistem erişiminize açılacaktır.
          </p>
          <button
            onClick={() => setPendingApproval(false)}
            className="w-full bg-basketball-theme text-white font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg uppercase tracking-widest text-sm"
          >
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-basketball-theme p-4 transition-colors duration-300">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-white/20">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50">
            <Check size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Kaydınız Alınmıştır</h2>
          <p className="text-gray-600 mb-8 font-medium leading-relaxed">
            Kaydınız onaylanınca <strong>{email}</strong> mail adresinize bilgi verilecektir.
          </p>
          <button
            onClick={() => setVerificationSent(false)}
            className="w-full bg-basketball-theme text-white font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg uppercase tracking-widest text-sm"
          >
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-basketball-theme p-4 transition-colors duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-white/20 backdrop-blur-sm">

        {/* Header Banner */}
        <div className="bg-basketball-theme p-10 text-white text-center relative overflow-hidden transition-colors duration-300 border-b-4 border-orange-800">
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-lg animate-bounce">
              <span className="text-3xl">🏀</span>
            </div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter drop-shadow-lg">Maç Takip Sistemi</h1>
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest opacity-80">
              Basketbol Görev Takip Platformu
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 bg-white transition-colors duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {isLogin ? 'Tekrar Hoş Geldiniz' : 'Hesap Oluştur'}
            </h2>
            <p className="text-gray-500 text-sm text-center">
              {isLogin ? 'Devam etmek için lütfen giriş yapın.' : 'Görevlerinize erişmek için kayıt olun.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-6">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ad</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="Adınız"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Soyad</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kullanıcı Adı</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                      placeholder="kullaniciadi"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-Posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Şifre Doğrula</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-200 mt-4 disabled:opacity-70"
            >
              {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setFirstName('');
                  setLastName('');
                  setUsername('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="ml-2 font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                {isLogin ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            © 2025 Güvenli Veri Altyapısı
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;