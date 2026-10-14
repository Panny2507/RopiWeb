'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  CircleDot,
  Loader2 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/edzes');
      }
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Add meg az e-mail címedet!');
      return;
    }
    if (!password) {
      setError('Add meg a jelszavadat!');
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      router.push('/edzes');
    } catch (err: any) {
      setError(err.message || 'Hibás e-mail cím vagy jelszó!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('secret123');
    setLoading(true);
    setError(null);
    try {
      await login({ email: demoEmail, password: 'secret123' });
      router.push('/edzes');
    } catch (err: any) {
      setError(err.message || 'Hiba a bejelentkezés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md">
        {/* Brand header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-vik-gold-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CircleDot className="w-7 h-7 text-vik-blue-900" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bejelentkezés
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Lépj be a fiókodba az edzésjelentkezésekhez és profilodhoz.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              E-mail cím
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="kovacs.peter@ropikor.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Jelszó
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-vik-blue-700 hover:bg-vik-blue-800 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Bejelentkezés folyamatban...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-vik-gold-400" />
                  <span>Bejelentkezés</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Gyors tesztfiókok (Demó mód)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('kovacs.peter@ropikor.hu')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium text-left truncate flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-vik-gold-600 shrink-0" />
              <span className="truncate">Admin (Kovács Péter)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('vendeg@bme.hu')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium text-left truncate flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">Tag (Teszt Vendég)</span>
            </button>
          </div>
        </div>

        {/* Link to Registration */}
        <div className="text-center text-xs sm:text-sm text-slate-600">
          Még nincs fiókod?{' '}
          <Link
            href="/regisztracio"
            className="font-bold text-vik-blue-700 hover:text-vik-blue-800 underline underline-offset-2"
          >
            Regisztrálj itt!
          </Link>
        </div>
      </div>
    </div>
  );
}
