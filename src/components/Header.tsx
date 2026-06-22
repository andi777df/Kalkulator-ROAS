import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, X, Info, LogIn, LogOut, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { User, signInWithEmail, signUpWithEmail } from '../auth';

interface HeaderProps {
  user?: User | null;
  onLogin?: (user: User) => void;
  onLogout?: () => void;
  isLoggingIn?: boolean;
  chosenPlatform?: 'shopee' | 'tiktok' | null;
  onBackToLanding?: () => void;
}

export default function Header({ 
  user, 
  onLogin, 
  onLogout, 
  isLoggingIn = false,
  chosenPlatform = null,
  onBackToLanding
}: HeaderProps) {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const result = await signInWithEmail(email, password);
        if (result) {
          onLogin?.(result.user);
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const result = await signUpWithEmail(email, password);
        if (result) {
          setSuccessMsg('✅ Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi, lalu login.');
          setAuthMode('login');
          setPassword('');
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau kata sandi salah. Silakan coba lagi.');
      } else if (msg.includes('User already registered')) {
        setError('Email ini sudah terdaftar. Silakan login atau gunakan email lain.');
      } else if (msg.includes('Password should be at least')) {
        setError('Kata sandi minimal 6 karakter.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-200 relative">
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <div>
            <span
              onClick={onBackToLanding}
              className="text-xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition block"
              style={{ color: '#1e3a5f' }}
            >
              Digifolium
            </span>
            <p className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase mt-0.5">
              {chosenPlatform === 'shopee' && "Kalkulator ROAS Shopee"}
              {chosenPlatform === 'tiktok' && "Kalkulator ROAS TikTok Shop"}
              {chosenPlatform === null && "Kalkulator ROAS Shopee & TikTok"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center px-3 py-1.5 bg-green-50 rounded-full border border-green-200 shadow-sm">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase tracking-tight">
                  {user.email}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer outline-none shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 shadow-sm">
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-2"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-tight">
                  Belum Login
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-[10px] sm:text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow active:scale-95 cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn size={13} className="shrink-0" />
                <span>Masuk / Daftar</span>
              </button>
            </div>
          )}

          <div className="relative flex items-center gap-3 text-xs text-slate-500 font-semibold bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[11px] text-slate-600 font-semibold">Secure Connection</span>
            </div>
            <div className="h-3 w-px bg-slate-200"></div>
            <button 
              type="button"
              className="flex items-center gap-1 hover:text-indigo-600 hover:opacity-85 transition cursor-pointer font-semibold outline-none" 
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            >
              <HelpCircle size={14} className="text-indigo-500" />
              <span className="text-[11px] text-slate-600">Cara Hitung</span>
            </button>

            {showFormulaInfo && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-left space-y-3 animate-fade-in text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Info size={13} className="text-indigo-600" /> Formulas & Mekanisme ROAS
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowFormulaInfo(false)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-[11px] space-y-2 leading-relaxed">
                  <p>
                    Aplikasi ini menghitung <strong>Break-Even ROAS</strong> berdasarkan formula dasar keuangan:
                  </p>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-center text-indigo-700 font-bold">
                    BEP ROAS = Harga Jual / Margin Bersih Sebelum Iklan
                  </div>
                  <p>
                    Di mana <span className="font-semibold text-slate-800">Margin Bersih Sebelum Iklan</span> dihitung dari 
                    harga jual dikurangi HPP produk dan dikurangi total biaya potongan administrasi e-commerce (Shopee).
                  </p>
                  <div className="h-px bg-slate-100 my-1.5" />
                  <p>
                    Sedangkan <span className="font-semibold text-teal-600">Target ROAS</span> merupakan rasio efisiensi iklan minimum yang 
                    harus dipenuhi agar target margin bersih yang Anda rancang dapat tercapai.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAuthModal(false); setError(null); setSuccessMsg(null); }}}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => { setShowAuthModal(false); setError(null); setSuccessMsg(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-2xl font-extrabold" style={{ color: '#1e3a5f' }}>Digifolium</span>
              <p className="text-slate-500 text-sm mt-1">
                {authMode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${authMode === 'login' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LogIn size={14} className="inline mr-1.5" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${authMode === 'register' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserPlus size={14} className="inline mr-1.5" />
                Daftar
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Alamat Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="contoh@email.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder={authMode === 'register' ? 'Minimal 6 karakter' : '••••••••'}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error / Success Messages */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg px-3 py-2">
                  ⚠️ {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg px-3 py-2">
                  {successMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : authMode === 'login' ? (
                  <><LogIn size={15} /> Masuk</>
                ) : (
                  <><UserPlus size={15} /> Daftar Sekarang</>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-400 mt-5">
              Data Anda dienkripsi dan aman tersimpan di Supabase.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
