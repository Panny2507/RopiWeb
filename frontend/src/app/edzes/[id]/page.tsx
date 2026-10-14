'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Training } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  ShieldCheck, 
  User as UserIcon,
  Loader2 
} from 'lucide-react';

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated } = useAuth();

  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTraining = async () => {
    try {
      const data = await api.trainings.getById(id);
      if (data) {
        setTraining(data);
      } else {
        setTraining(null);
      }
    } catch (err) {
      console.error('Hiba az edzés betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTraining();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-vik-blue-700 mb-3" />
        <p className="font-medium text-sm">Edzés adatainak betöltése...</p>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Edzés nem található</h2>
        <p className="text-slate-600 mb-6 max-w-md">
          A keresett edzésazonosító nem létezik vagy az edzés törlésre került a rendszerből.
        </p>
        <Link
          href="/edzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vissza az edzések listájához</span>
        </Link>
      </div>
    );
  }

  const isFull = training.participants.length >= training.maxParticipants;
  const isRegistered = !!user && training.participants.some((p) => p.id === user.id);
  const isWaitlisted = !!user && training.waitlist.some((w) => w.id === user.id);
  const waitlistIndex = isWaitlisted
    ? training.waitlist.findIndex((w) => w.id === user?.id) + 1
    : 0;

  const trainingDate = new Date(training.date);
  const formattedDate = trainingDate.toLocaleDateString('hu-HU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = trainingDate.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const occupancy = Math.min(
    100,
    Math.round((training.participants.length / training.maxParticipants) * 100)
  );

  const handleRegister = async () => {
    if (!isAuthenticated || !user) {
      router.push('/bejelentkezes');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.trainings.register(training.id, user);
      if (res.status === 'waitlisted') {
        setSuccessMessage('A keret betelt! Sikeresen felkerültél a várólistára.');
      } else {
        setSuccessMessage('Sikeres jelentkezés! Helyed biztosítva az edzésen.');
      }
      await fetchTraining();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba történt a jelentkezés során.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    if (!confirm('Biztosan lemondod a jelentkezésedet erről az edzésről?')) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.trainings.cancel(training.id, user.id);
      setSuccessMessage('A jelentkezést sikeresen lemondtad.');
      await fetchTraining();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba történt a lemondás során.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/edzes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-vik-blue-700 hover:text-vik-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vissza az edzésekhez</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-vik-blue-800 to-vik-blue-900 p-6 sm:p-8 text-white relative">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-vik-gold-500 text-slate-900">
                {training.type}
              </span>

              {isRegistered && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Már regisztráltál erre az edzésre
                </span>
              )}

              {isWaitlisted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  <Clock3 className="w-4 h-4 text-amber-400" />
                  Várólistán vagy ({waitlistIndex}. hely)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {training.title}
            </h1>
            {training.description && (
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl">
                {training.description}
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Notifications */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Helyszín</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{training.location}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Dátum</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{formattedDate}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Kezdés</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{formattedTime}</div>
                </div>
              </div>
            </div>

            {/* Capacity status bar */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  Kapacitás és foglaltság
                </span>
                <span className={isFull ? 'text-red-600' : 'text-emerald-700'}>
                  {training.participants.length} / {training.maxParticipants} fő ({occupancy}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    occupancy >= 100
                      ? 'bg-red-500'
                      : occupancy >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>Szabad helyek: {Math.max(0, training.maxParticipants - training.participants.length)}</span>
                {training.waitlist.length > 0 && (
                  <span className="text-amber-600 font-semibold">
                    Várólistán várakozik: {training.waitlist.length} fő
                  </span>
                )}
              </div>
            </div>

            {/* Registered Participants List */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-vik-blue-700" />
                  <span>Jelentkezett játékosok névsora</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {training.participants.length} / {training.maxParticipants} játékos
                </span>
              </div>

              {training.participants.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4 text-center">
                  Még senki nem regisztrált erre az edzésre. Légy te az első!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {training.participants.map((participant, index) => {
                    const isCurrentUser = user?.id === participant.id;
                    return (
                      <div
                        key={participant.id || index}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                          isCurrentUser
                            ? 'bg-blue-50/80 border-blue-300 font-bold text-vik-blue-900'
                            : 'bg-slate-50 border-slate-100 text-slate-800'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                          {index + 1}
                        </span>
                        <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{participant.name}</span>
                        {isCurrentUser && (
                          <span className="ml-auto text-[11px] bg-vik-blue-700 text-white px-2 py-0.5 rounded-full font-medium">
                            Te
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Waitlist Section */}
            {training.waitlist.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200">
                  <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-amber-600" />
                    <span>Várólista ({training.waitlist.length} fő)</span>
                  </h3>
                  <span className="text-xs text-amber-600">
                    Lemondás esetén a sorrend szerint kerülnek be
                  </span>
                </div>

                <div className="space-y-2">
                  {training.waitlist.map((waitItem, index) => {
                    const isCurrentUser = user?.id === waitItem.id;
                    return (
                      <div
                        key={waitItem.id || index}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${
                          isCurrentUser
                            ? 'bg-amber-50 border-amber-300 font-bold text-amber-900'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                            #{index + 1}
                          </span>
                          <span>{waitItem.name}</span>
                        </div>
                        {isCurrentUser && (
                          <span className="text-[11px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full font-bold">
                            Te (várólistán)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                {!isAuthenticated ? (
                  <span>A jelentkezéshez bejelentkezés szükséges.</span>
                ) : isRegistered ? (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Helyed regisztrálva van ezen az edzésen.
                  </span>
                ) : isWaitlisted ? (
                  <span className="text-amber-700 font-semibold">
                    ⏳ Várólistán vagy a #{waitlistIndex}. helyen.
                  </span>
                ) : isFull ? (
                  <span>A keret betelt, de feliratkozhatsz a várólistára.</span>
                ) : (
                  <span>Még van szabad hely az edzésen!</span>
                )}
              </div>

              <div>
                {isRegistered || isWaitlisted ? (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    {actionLoading ? 'Feldolgozás...' : 'Jelentkezés lemondása'}
                  </button>
                ) : !isAuthenticated ? (
                  <button
                    onClick={() => router.push('/bejelentkezes')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-vik-blue-700 hover:bg-vik-blue-800 shadow-sm transition-colors"
                  >
                    Bejelentkezés a jelentkezéshez
                  </button>
                ) : isFull ? (
                  <button
                    onClick={handleRegister}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    {actionLoading ? 'Feldolgozás...' : 'Feliratkozás a várólistára'}
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    {actionLoading ? 'Feldolgozás...' : 'Jelentkezés az edzésre'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
