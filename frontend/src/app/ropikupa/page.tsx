'use client';

import React, { useState, useEffect } from 'react';
import { CupCategory, CupEditionResults, CupTeamRegistration } from '@/types';
import { api } from '@/lib/api';
import { 
  Trophy, 
  Users, 
  ClipboardList, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Award, 
  ShieldCheck, 
  Info,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

export default function RopikupaPage() {
  const [activeTab, setActiveTab] = useState<'nevezes' | 'eredmenyek'>('nevezes');
  const [teams, setTeams] = useState<CupTeamRegistration[]>([]);
  const [results, setResults] = useState<CupEditionResults[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [category, setCategory] = useState<CupCategory>('Vegyes');
  const [edition, setEdition] = useState('IV. VRK 2026');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Accordion open states for previous results
  const [openEditions, setOpenEditions] = useState<Record<string, boolean>>({
    'III. VRK (2025)': true,
  });

  const toggleEdition = (editionName: string) => {
    setOpenEditions((prev) => ({
      ...prev,
      [editionName]: !prev[editionName],
    }));
  };

  const loadData = async () => {
    try {
      const [teamsData, resultsData] = await Promise.all([
        api.cup.getTeams(),
        api.cup.getResults(),
      ]);
      setTeams(teamsData);
      setResults(resultsData);
    } catch (err) {
      console.error('Hiba a Röpikupa adatok betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!teamName.trim()) {
      setFormError('A csapatnév megadása kötelező!');
      return;
    }
    if (!captainName.trim()) {
      setFormError('A csapatkapitány nevének megadása kötelező!');
      return;
    }
    if (!captainEmail.trim() || !validateEmail(captainEmail)) {
      setFormError('Kérjük, érvényes e-mail címet adj meg a csapatkapitánynak!');
      return;
    }
    if (!playerCount || playerCount < 6 || playerCount > 14) {
      setFormError('A játékosok létszáma 6 és 14 fő között kell legyen!');
      return;
    }
    if (!rulesAccepted) {
      setFormError('A versenyszabályzat és a házirend elfogadása kötelező a nevezéshez!');
      return;
    }

    setSubmitting(true);

    try {
      const newRegistration = await api.cup.registerTeam({
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim(),
        playerCount: Number(playerCount),
        category,
        edition,
        rulesAccepted: true,
      });

      setFormSuccess(`Gratulálunk! A "${newRegistration.teamName}" csapat sikeresen elküldte a nevezést a ${edition} bajnokságra!`);
      // Reset form
      setTeamName('');
      setCaptainName('');
      setCaptainEmail('');
      setPlayerCount(6);
      setRulesAccepted(false);

      // Refresh list
      const updatedTeams = await api.cup.getTeams();
      setTeams(updatedTeams);
    } catch (err: any) {
      setFormError(err.message || 'Hiba történt a nevezés beküldése során.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMedalIcon = (placement: number) => {
    if (placement === 1) return <span className="text-xl">🥇</span>;
    if (placement === 2) return <span className="text-xl">🥈</span>;
    if (placement === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-bold text-slate-500 w-5 text-center">{placement}.</span>;
  };

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 text-vik-gold-500" />
            <span>Kari Bajnokság</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Villanykari Röpikupa (VRK)
          </h1>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base">
            A Villanykari Röpikupa a BME VIK legnagyobb hagyománnyal bíró röplabda megmérettetése. Regisztrálj csapatoddal a soron következő tornára, vagy böngészd a korábbi kupák aranyérmeseit!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('nevezes')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm sm:text-base transition-colors ${
              activeTab === 'nevezes'
                ? 'border-vik-blue-700 text-vik-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Nevezés & Nevezett Csapatok</span>
          </button>

          <button
            onClick={() => setActiveTab('eredmenyek')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm sm:text-base transition-colors ${
              activeTab === 'eredmenyek'
                ? 'border-vik-blue-700 text-vik-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Korábbi eredmények</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Loader2 className="w-10 h-10 animate-spin text-vik-blue-700 mb-3" />
            <p className="font-medium text-sm">Röpikupa adatok betöltése...</p>
          </div>
        ) : activeTab === 'nevezes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Registration Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-vik-blue-700" />
                  <span>Csapat nevezése</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Töltsd ki az alábbi űrlapot a csapatod nevezéséhez a IV. Villanykari Röpikupára!
                </p>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Csapatnév */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Csapatnév <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pl. Villany Ászok"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Csapatkapitány neve */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Csapatkapitány neve <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Teljes név"
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                    />
                  </div>

                  {/* Csapatkapitány email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kapitány e-mail címe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="kapitany@edu.bme.hu"
                      value={captainEmail}
                      onChange={(e) => setCaptainEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Létszám */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Létszám (fő) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={6}
                      max={14}
                      value={playerCount}
                      onChange={(e) => setPlayerCount(parseInt(e.target.value) || 6)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Min. 6, max. 14 fő</span>
                  </div>

                  {/* Kategória */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kategória <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CupCategory)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white"
                    >
                      <option value="Vegyes">Vegyes (min. 2 lány a pályán)</option>
                      <option value="Férfi">Férfi</option>
                      <option value="Női">Női</option>
                    </select>
                  </div>

                  {/* Kupa kiadás */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kupa kiadás <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white"
                    >
                      <option value="IV. VRK 2026">IV. VRK 2026 (Aktuális)</option>
                      <option value="V. VRK 2027">V. VRK 2027 (Előzetes)</option>
                    </select>
                  </div>
                </div>

                {/* Szabályzat elfogadása checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesAccepted}
                      onChange={(e) => setRulesAccepted(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-300 text-vik-blue-700 focus:ring-vik-blue-500"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 leading-normal">
                      Elolvastam és elfogadom a <strong className="text-slate-900">Villanykari Röpikupa Versenyszabályzatát</strong> és a torna sportszerűségi feltételeit.
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 rounded-xl font-bold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 disabled:opacity-50 shadow-md shadow-vik-gold-500/20 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Nevezés küldése...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5" />
                        <span>Csapat nevezése</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Submitted Teams List */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-vik-blue-700" />
                    <span>Nevezett csapatok</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-vik-blue-800 rounded-full">
                    {teams.length} regisztrált csapat
                  </span>
                </div>

                {teams.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">
                    Még nem nevezett csapat. Nevezd be te az elsőt!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {teams.map((t) => (
                      <div
                        key={t.id || t.teamName}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{t.teamName}</h4>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              t.category === 'Vegyes'
                                ? 'bg-purple-100 text-purple-700'
                                : t.category === 'Férfi'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-pink-100 text-pink-700'
                            }`}
                          >
                            {t.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-1">
                          <span>Kapitány: {t.captainName}</span>
                          <span>{t.playerCount} fős keret</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{t.edition}</span>
                          <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {t.status || 'Regisztrálva'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tournament Highlights info box */}
              <div className="bg-gradient-to-br from-vik-blue-800 to-vik-blue-900 text-white p-6 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-vik-gold-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>A torna lebonyolítása</span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Csoportmérkőzések után egyenes kieséses rendszerben dől el a trófea sorsa. Minden mérkőzést hivatalos egyetemi játékvezetők vezetnek. Az első három helyezett éremdíjazásban részesül!
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Korábbi eredmények Tab */
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-vik-gold-500" />
                  <span>Dicsőségcsarnok & Korábbi Röpikupák</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  A Villanykari Röpikupa korábbi éveinek dobogósai és bajnokai.
                </p>
              </div>

              <div className="space-y-4">
                {results.map((ed) => {
                  const isOpen = !!openEditions[ed.edition];
                  return (
                    <div
                      key={ed.edition}
                      className="border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm"
                    >
                      <button
                        onClick={() => toggleEdition(ed.edition)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-vik-gold-500" />
                          <div>
                            <span className="font-bold text-slate-900 text-base">{ed.edition}</span>
                            <span className="text-xs text-slate-500 block">{ed.date}</span>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-200 divide-y divide-slate-100">
                          {ed.results.map((res, i) => (
                            <div
                              key={i}
                              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 flex items-center justify-center">
                                  {getMedalIcon(res.placement)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                                    {res.teamName}
                                  </span>
                                  {res.notes && (
                                    <span className="text-xs text-slate-500 block">{res.notes}</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    res.category === 'Vegyes'
                                      ? 'bg-purple-100 text-purple-700'
                                      : res.category === 'Férfi'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-pink-100 text-pink-700'
                                  }`}
                                >
                                  {res.category}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
