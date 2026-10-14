'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Training } from '@/types';
import { api } from '@/lib/api';
import TrainingCard from '@/components/TrainingCard';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Award,
  ChevronRight,
  Flame
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
        {/* Background decorative patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vik-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vik-blue-800/80 border border-blue-400/30 text-vik-gold-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-vik-gold-400" />
              <span>BME VIK hivatalos kari sportköre 2026</span>
            </div>

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
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/ropikupa"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all transform hover:-translate-y-0.5"
              >
                <Trophy className="w-5 h-5 text-vik-gold-400" />
                <span>Röpikupa nevezés</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="bg-white py-8 border-b border-slate-200 shadow-sm relative -mt-4 z-10 max-w-6xl mx-auto rounded-2xl px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Stat 1 */}
          <div className="flex items-center gap-4 py-2 md:py-0 md:px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-vik-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">120+</div>
              <div className="text-sm font-medium text-slate-600">Aktív tag és hallgató</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-4 py-2 md:py-0 md:px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">4 alkalom / hét</div>
              <div className="text-sm font-medium text-slate-600">Heti edzéslehetőség</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-4 py-2 md:py-0 md:px-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">IV. VRK 2026</div>
              <div className="text-sm font-medium text-slate-600">Sikeres kupa kiadás</div>
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
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Miért érdemes csatlakoznod hozzánk?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Kezdőtől a profi szintig minden villanykaros és BME hallgató számára nyitva állunk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-vik-blue-100 text-vik-blue-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hivatalos PEK Tagság</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Körünk tagjaként igazolt közösségi és sporttevékenységet folytathatsz, amely a Schönherz Kollégiumi felvételinél is plusz pontot ér.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Villanykari Röpikupa</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Minden félévben megrendezzük az egyetem egyik legnagyobb amatőr röplabdatornáját több kategóriában, érmekkel, kupákkal és szurkolótáborral.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Kiváló Sportlétesítmények</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A BME Sportközpont modern termeiben és a nyári strandröplabda pályákon a legjobb felszerelésekkel és labdákkal játszhatsz.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
