'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Training } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Clock3,
  ExternalLink
} from 'lucide-react';

interface TrainingCardProps {
  training: Training;
  onRefresh?: () => void;
  showDetailsLink?: boolean;
}

export default function TrainingCard({
  training,
  onRefresh,
  showDetailsLink = true,
}: TrainingCardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isFull = training.participants.length >= training.maxParticipants;
  const isRegistered = !!user && training.participants.some((p) => p.id === user.id);
  const isWaitlisted = !!user && training.waitlist.some((w) => w.id === user.id);
  const waitlistIndex = isWaitlisted
    ? training.waitlist.findIndex((w) => w.id === user?.id) + 1
    : 0;

  // Format date and time
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

  // Calculate occupancy percentage
  const occupancyPercentage = Math.min(
    100,
    Math.round((training.participants.length / training.maxParticipants) * 100)
  );

  const getProgressBarColor = () => {
    if (occupancyPercentage >= 100) return 'bg-red-500';
    if (occupancyPercentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTypeBadgeColor = (type: Training['type']) => {
    switch (type) {
      case 'Gyakorlás':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Meccs':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Szabad edzés':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated || !user) {
      router.push('/bejelentkezes');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.trainings.register(training.id, user);
      if (res.status === 'waitlisted') {
        setSuccessMessage('Az edzés megtelt, sikeresen felkerültél a várólistára!');
      } else {
        setSuccessMessage('Sikeresen jelentkeztél az edzésre!');
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba történt a jelentkezés során.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    if (!confirm('Biztosan le szeretnéd mondani a jelentkezésedet?')) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.trainings.cancel(training.id, user.id);
      setSuccessMessage('A jelentkezést sikeresen lemondtad.');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba történt a lemondás során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col justify-between">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Top bar: Type badge + Registered status badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeColor(
              training.type
            )}`}
          >
            {training.type}
          </span>

          {isRegistered && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Már regisztráltál
            </span>
          )}

          {isWaitlisted && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              <Clock3 className="w-3.5 h-3.5" />
              Várólistán ({waitlistIndex}. hely)
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 group">
            {showDetailsLink ? (
              <Link
                href={`/edzes/${training.id}`}
                className="hover:text-vik-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{training.title}</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 text-vik-blue-600 transition-opacity" />
              </Link>
            ) : (
              training.title
            )}
          </h3>
          {training.description && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{training.description}</p>
          )}
        </div>

        {/* Info Grid: Location, Date, Time */}
        <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-vik-blue-700 shrink-0 mt-0.5" />
            <span className="font-medium text-slate-800">{training.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-vik-blue-700 shrink-0" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-vik-blue-700 shrink-0" />
            <span>Kezdés: {formattedTime}</span>
          </div>
        </div>

        {/* Capacity / Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-1.5">
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-400" />
              Létszám:
            </span>
            <span
              className={`font-semibold ${
                isFull ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {training.participants.length}/{training.maxParticipants} hely foglalt
              {training.waitlist.length > 0 && (
                <span className="text-amber-600 font-normal ml-1">
                  (+{training.waitlist.length} várólistán)
                </span>
              )}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Alert feedback messages */}
        {errorMessage && (
          <div className="p-2.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-2.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Expandable Registered Participants */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-vik-blue-700 transition-colors py-1 focus:outline-none"
          >
            <span>
              Jelentkezettek névsora ({training.participants.length} fő)
            </span>
            {showParticipants ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showParticipants && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
              {training.participants.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Még senki nem jelentkezett erre az edzésre.</p>
              ) : (
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Résztvevők ({training.participants.length}/{training.maxParticipants})
                  </h5>
                  <ul className="text-xs space-y-1 text-slate-700 max-h-36 overflow-y-auto pr-1">
                    {training.participants.map((participant, idx) => (
                      <li key={participant.id || idx} className="flex items-center gap-2">
                        <span className="w-4 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                        <span className={user?.id === participant.id ? 'font-bold text-vik-blue-700' : ''}>
                          {participant.name}
                          {user?.id === participant.id && ' (Te)'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {training.waitlist.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                    Várólista ({training.waitlist.length} fő)
                  </h5>
                  <ul className="text-xs space-y-1 text-slate-600">
                    {training.waitlist.map((waitItem, idx) => (
                      <li key={waitItem.id || idx} className="flex items-center gap-2">
                        <span className="w-4 text-amber-600 font-mono text-[10px]">{idx + 1}.</span>
                        <span className={user?.id === waitItem.id ? 'font-bold text-amber-700' : ''}>
                          {waitItem.name}
                          {user?.id === waitItem.id && ' (Te)'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        {showDetailsLink && (
          <Link
            href={`/edzes/${training.id}`}
            className="text-xs font-semibold text-vik-blue-700 hover:text-vik-blue-800 underline underline-offset-2"
          >
            Részletek megtekintése
          </Link>
        )}

        <div className="ml-auto">
          {isRegistered || isWaitlisted ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors focus:outline-none"
            >
              {loading ? 'Feldolgozás...' : 'Lejelentkezem'}
            </button>
          ) : !isAuthenticated ? (
            <button
              onClick={() => router.push('/bejelentkezes')}
              className="px-4 py-2 text-sm font-semibold text-white bg-vik-blue-700 hover:bg-vik-blue-800 rounded-lg shadow-sm transition-colors"
            >
              Jelentkezéshez lépj be
            </button>
          ) : isFull ? (
            <button
              onClick={handleRegister}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 disabled:opacity-50 rounded-lg shadow-sm transition-colors focus:outline-none"
            >
              {loading ? 'Feldolgozás...' : 'Várólistára feliratkozom'}
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors focus:outline-none"
            >
              {loading ? 'Feldolgozás...' : 'Jelentkezem'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
