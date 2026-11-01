'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CircleDot, 
  Loader2 
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/edzes');
    }
  }, [isAuthenticated, router]);

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!name.trim()) {
      setError('A teljes név megadása kötelező!');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setError('Kérjük, érvényes e-mail címet adj meg!');
      return;
    }
    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakterből kell állnia!');
      return;
    }
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Auto-login succeeds, redirect to edzés page
      router.push('/edzes');
    } catch (err: any) {
      setError(err.message || 'Hiba történt a regisztráció során. Kérjük próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-vik-gold-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CircleDot className="w-7 h-7 text-vik-blue-900" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Regisztráció
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Hozz létre fiókot az edzésfoglalásokhoz és a Röpikupa nevezésekhez.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Név */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Teljes név <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Minta János"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              E-mail cím <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="janos.minta@edu.bme.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Jelszó */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Jelszó <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimum 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Regisztráció folyamatban...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Regisztráció befejezése</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100">
          Már rendelkezel fiókkal?{' '}
          <Link
            href="/bejelentkezes"
            className="font-bold text-vik-blue-700 hover:text-vik-blue-800 underline underline-offset-2"
          >
            Lépj be itt!
          </Link>
        </div>
      </div>
    </div>
  );
}
