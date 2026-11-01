'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Training } from '@/types';
import { api } from '@/lib/api';
import TrainingCard from '@/components/TrainingCard';
import { 
  Trophy, 
  Calendar, 
  Volleyball, 
  ChevronRight,
  Flame,
  Mail,
  Instagram
} from 'lucide-react';

export default function HomePage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.trainings.getAll();
      setTrainings(data.slice(0, 3));
    } catch (err) {
      console.error('Hiba az edzések betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section with Volleyball Gradient */}
      <section className="relative hero-gradient text-white overflow-hidden py-16 sm:py-24 border-b-4 border-vik-gold-500">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vik-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="absolute right-0 bottom-[-3rem] hidden lg:block w-[26rem] h-[34rem] pointer-events-none opacity-90" aria-hidden="true">
            <Image
              src="/landing_kep.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 26rem, 0px"
              className="object-contain object-bottom"
            />
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Üdvözlünk a <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vik-gold-400 via-yellow-200 to-vik-gold-500">
                BME VIK Röplabda Kör
              </span>{' '}
              oldalán!
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
              Csatlakozz egyetemünk egyik legpörgősebb és legösszetartóbb sportközösségéhez! Heti teremedzések, nyári strandröplabda, Villanykari Röpikupák és életre szóló barátságok a Schönherzben és a pályán.
            </p>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/edzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 shadow-lg shadow-vik-gold-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <span>Jelentkezz edzésre!</span>
                <Volleyball className="w-5 h-5" />
              </Link>

              <Link
                href="/ropikupa"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all transform hover:-translate-y-0.5"
              >
                <span>Röpikupa nevezés</span>
                <Trophy className="w-5 h-5 text-vik-gold-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Trainings Preview */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-vik-blue-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-vik-gold-500" />
                <span>Ne maradj le</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Következő edzések
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                A helyek száma korlátozott! Jelentkezz mielőbb, hogy biztosítsd a helyed a pályán.
              </p>
            </div>
            <Link
              href="/edzes"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-vik-blue-700 hover:text-vik-blue-800 transition-colors group"
            >
              <span>Összes edzés és időpont</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Jelenleg nincs meghirdetett edzés.</p>
              <p className="text-sm text-slate-400">Nézz vissza később vagy kövess minket a közösségi médián!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((t) => (
                <TrainingCard key={t.id} training={t} onRefresh={loadData} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Highlights / Features Banner */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Csatlakozz hozzánk!
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              Nem csak BME-s és villanykaros hallgatóknak van lehetősége csatlakozni: a részvétel elsősorban BME Villanykarosoknak szól, de nyitva áll bármely BME-s hallgatónak, vagy akár külsős barátoknak is, akik szeretnének velünk játszani.
            </p>

            {/* Direct Social / Email contacts underneath */}
            <div className="inline-flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <a
                href="https://instagram.com/ropikor_vik"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 text-sm font-bold transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>@ropikor_vik</span>
              </a>
              <a
                href="mailto:ropikorvik@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-vik-blue-700 hover:bg-blue-100 border border-blue-200 text-sm font-bold transition-colors"
              >
                <Mail className="w-4 h-4 text-vik-blue-700" />
                <span>ropikorvik@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
