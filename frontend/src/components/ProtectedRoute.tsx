'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/bejelentkezes');
      } else if (adminOnly && !isAdmin) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, adminOnly, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-vik-blue-700 mb-3" />
        <p className="text-sm font-medium">Jogosultságok ellenőrzése...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Bejelentkezés szükséges</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          Ennek az oldalnak a megtekintéséhez be kell jelentkezned a fiókodba.
        </p>
        <button
          onClick={() => router.push('/bejelentkezes')}
          className="px-5 py-2.5 rounded-lg bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-semibold text-sm transition-colors"
        >
          Tovább a bejelentkezéshez
        </button>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Nincs adminisztrátori jogosultságod</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          Ez az oldal kizárólag a Körvezetőség (adminisztrátorok) számára érhető el.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-lg bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-semibold text-sm transition-colors"
        >
          Vissza a kezdőlapra
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
