'use client';

import React, { useState, useEffect } from 'react';
import { CupCategory, CupEditionResults, CupTeamRegistration, CupTeamMember, CupScheduleInfo } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Users, 
  ClipboardList, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Filter,
  Sparkles
} from 'lucide-react';

interface MemberFormItem {
  name: string;
  isVik: boolean;
  isBme: boolean;
  isFemale: boolean;
}

export default function RopikupaPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'nevezes' | 'eredmenyek'>('nevezes');
  const [teams, setTeams] = useState<CupTeamRegistration[]>([]);
  const [results, setResults] = useState<CupEditionResults[]>([]);
  const [scheduleInfo, setScheduleInfo] = useState<CupScheduleInfo | null>(null);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('Összes');
  const [loading, setLoading] = useState(true);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [category, setCategory] = useState<CupCategory>('Casual');
  const [edition, setEdition] = useState('IV. VRK 2026');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Team members with the 3 checkboxes: isVik, isBme, isFemale
  const [members, setMembers] = useState<MemberFormItem[]>([
    { name: '', isVik: true, isBme: true, isFemale: false },
    { name: '', isVik: true, isBme: true, isFemale: true },
    { name: '', isVik: false, isBme: true, isFemale: false },
    { name: '', isVik: false, isBme: true, isFemale: true },
    { name: '', isVik: true, isBme: true, isFemale: false },
    { name: '', isVik: false, isBme: false, isFemale: false },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingMembers, setEditingMembers] = useState<CupTeamMember[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Accordion open states for previous results
  const [openEditions, setOpenEditions] = useState<Record<string, boolean>>({
    'III. VRK 2025': true,
  });

  const toggleEdition = (editionName: string) => {
    setOpenEditions((prev) => ({
      ...prev,
      [editionName]: !prev[editionName],
    }));
  };

  const loadData = async () => {
    try {
      const [teamsData, resultsData, sched] = await Promise.all([
        api.cup.getTeams(),
        api.cup.getResults(),
        api.cup.getSchedule(),
      ]);
      setTeams(teamsData);
      setResults(resultsData);
      setScheduleInfo(sched);
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

  const updateMember = (index: number, updates: Partial<MemberFormItem>) => {
    setMembers((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...updates };
        // If VIK is checked, BME should also be checked automatically
        if (updates.isVik === true) {
          updated.isBme = true;
        }
        return updated;
      })
    );
  };

  const addMemberSlot = () => {
    setMembers((current) => [
      ...current,
      { name: '', isVik: false, isBme: false, isFemale: false },
    ]);
  };

  const removeMemberSlot = (index: number) => {
    if (members.length <= 1) return;
    setMembers((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!isAuthenticated) {
      setFormError('A nevezéshez előbb be kell jelentkezned, hogy a csapatkapitány később módosíthassa a névsort.');
      return;
    }

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

    const validMembers = members
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name.length > 0);

    if (validMembers.length < 6) {
      setFormError('Legalább 6 csapattag nevét add meg a keretben!');
      return;
    }

    // Check at least 1 female player for vegyes kupa
    const femaleCount = validMembers.filter((m) => m.isFemale).length;
    if (femaleCount < 1) {
      setFormError('A vegyes kategóriában legalább 1 lány játékos kötelező! Kérjük pipáld be a lány játékos(oka)t.');
      return;
    }

    if (!rulesAccepted) {
      setFormError('A versenyszabályzat és a feltételek elfogadása kötelező a nevezéshez!');
      return;
    }

    setSubmitting(true);

    try {
      const newRegistration = await api.cup.registerTeam({
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim(),
        members: validMembers,
        category,
        type: 'Vegyes',
        edition,
        rulesAccepted: true,
      });

      setFormSuccess(`Gratulálunk! A "${newRegistration.teamName}" csapat sikeresen elküldte a nevezést a ${edition} bajnokságra!`);
      // Reset form
      setTeamName('');
      setCaptainName('');
      setCaptainEmail('');
      setCategory('Casual');
      setMembers([
        { name: '', isVik: true, isBme: true, isFemale: false },
        { name: '', isVik: true, isBme: true, isFemale: true },
        { name: '', isVik: false, isBme: true, isFemale: false },
        { name: '', isVik: false, isBme: true, isFemale: true },
        { name: '', isVik: true, isBme: true, isFemale: false },
        { name: '', isVik: false, isBme: false, isFemale: false },
      ]);
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

  // Distinct round options present in the registered teams
  const availableRounds = Array.from(new Set(teams.map((t) => t.edition).filter(Boolean)));
  if (!availableRounds.includes('IV. VRK 2026')) availableRounds.unshift('IV. VRK 2026');
  if (!availableRounds.includes('V. VRK 2027')) availableRounds.push('V. VRK 2027');

  const filteredTeams = teams.filter((t) => {
    if (selectedRoundFilter === 'Összes') return true;
    return t.edition === selectedRoundFilter;
  });

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
            Regisztrálj vegyes csapatoddal a soron következő fordulóra, vagy böngészd a korábbi kupák eredményeit!
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
                  Töltsd ki az alábbi űrlapot vegyes csapatod nevezéséhez a Villanykari Röpikupa fordulójára!
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
                      Csapatkapitány e-mail címe <span className="text-red-500">*</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategória és típus */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kategória <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CupCategory)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white font-medium"
                    >
                      <option value="Casual">Casual</option>
                      <option value="Pro">Pro</option>
                    </select>
                    <div className="mt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Típus
                      </label>
                      <div className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-slate-50 font-semibold text-slate-800 flex items-center justify-between gap-2">
                        <span>Vegyes</span>
                        <span className="text-[11px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-medium">min. 1 lány kötelező</span>
                      </div>
                    </div>
                  </div>

                  {/* Kupa forduló (No kiírás, No zárójeles előzetes/aktuális) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kupa forduló <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white font-medium"
                    >
                      <option value="IV. VRK 2026">IV. VRK 2026</option>
                      <option value="V. VRK 2027">V. VRK 2027</option>
                    </select>
                  </div>
                </div>

                {/* Csapatnévsor with Checkboxes for every player */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Csapatnévsor & Játékos adatok <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                      Minimum 6 fő (legalább 1 lány kötelező)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            placeholder={`${index + 1}. játékos teljes neve`}
                            value={member.name}
                            onChange={(e) => updateMember(index, { name: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white"
                          />
                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMemberSlot(index)}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Játékos törlése"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* 3 Checkboxes: Villanykaros, BME-s, Lány */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pl-1 pt-0.5">
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={member.isVik}
                              onChange={(e) => updateMember(index, { isVik: e.target.checked })}
                              className="w-4 h-4 rounded text-vik-blue-700 border-slate-300 focus:ring-vik-blue-500"
                            />
                            <span>⚡ Villanykaros (VIK-es)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={member.isBme}
                              onChange={(e) => updateMember(index, { isBme: e.target.checked })}
                              className="w-4 h-4 rounded text-vik-blue-700 border-slate-300 focus:ring-vik-blue-500"
                            />
                            <span>🎓 BME-s hallgató</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={member.isFemale}
                              onChange={(e) => updateMember(index, { isFemale: e.target.checked })}
                              className="w-4 h-4 rounded text-pink-600 border-slate-300 focus:ring-pink-500"
                            />
                            <span className="text-pink-800 font-semibold">♀ Lány</span>
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addMemberSlot}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-vik-blue-700 hover:text-vik-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ További játékos hozzáadása</span>
                    </button>
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
                        <span>Csapat nevezése a fordulóra</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Tournament Schedule section: Lebonyolítás táblázat ITT */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-vik-blue-700" />
                  <span>Kupa lebonyolítása</span>
                </h3>

                {scheduleInfo?.hasSchedule ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <span>Lebonyolítás táblázat ITT</span>
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Elérhető
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Letölthető menetrend és meccsbeosztás: <span className="font-mono text-slate-800">{scheduleInfo.fileName}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => api.cup.downloadSchedule()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Táblázat letöltése</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-semibold">Jelenleg nem elérhető a kupa lebonyolítása</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Submitted Teams List with Round Selector */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-vik-blue-700" />
                    <span>Nevezett csapatok</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-vik-blue-800 rounded-full">
                    {filteredTeams.length} csapat
                  </span>
                </div>

                {/* Round selector filter as requested */}
                <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Forduló:
                  </label>
                  <select
                    value={selectedRoundFilter}
                    onChange={(e) => setSelectedRoundFilter(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-vik-blue-500"
                  >
                    <option value="Összes">Összes forduló ({teams.length})</option>
                    {availableRounds.map((ed) => (
                      <option key={ed} value={ed}>
                        {ed}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredTeams.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">
                    Erre a fordulóra még nem nevezett csapat. Nevezd be te az elsőt!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredTeams.map((t) => {
                      const memberList: CupTeamMember[] = t.members || [];
                      const femaleCount = memberList.filter((m) => m.isFemale).length;
                      const vikCount = memberList.filter((m) => m.isVik).length;
                      const bmeCount = memberList.filter((m) => m.isBme).length;
                      const isExpanded = expandedTeamId === (t.id || t.teamName);

                      return (
                        <div
                          key={t.id || t.teamName}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{t.teamName}</h4>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              {t.category}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 mb-2">
                            <span>Kapitány: <strong className="text-slate-800">{t.captainName}</strong></span>
                          </div>

                          {/* Beautiful summary badges as requested */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-2">
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-vik-blue-800">
                              👥 {memberList.length || t.playerCount || 0} fős keret
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-pink-100 text-pink-800">
                              ♀ {femaleCount} lány
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800">
                              ⚡ {vikCount} VIK-es
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800">
                              🎓 {bmeCount} BME-s
                            </span>
                          </div>

                          {/* Member roster accordion */}
                          <div className="pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => setExpandedTeamId(isExpanded ? null : (t.id || t.teamName))}
                              className="flex items-center justify-between w-full text-xs font-semibold text-vik-blue-700 hover:text-vik-blue-900 transition-colors"
                            >
                              <span>Csapattagok névsora ({memberList.length})</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded && (
                              <ul className="mt-2 space-y-1.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                                {memberList.map((m, idx) => (
                                  <li key={m.id || idx} className="flex items-center justify-between gap-2 py-0.5">
                                    <span className="font-medium text-slate-800">
                                      {idx + 1}. {m.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {m.isFemale && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-pink-700">
                                          Lány
                                        </span>
                                      )}
                                      {m.isVik && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                          VIK
                                        </span>
                                      )}
                                      {m.isBme && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-vik-blue-800">
                                          BME
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Captain roster edit button */}
                          {user && t.captainUserId === Number(user.id) && t.id && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              {editingTeamId === t.id ? (
                                <div className="space-y-2">
                                  {editingMembers.map((member, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <input
                                        value={member.name}
                                        onChange={(e) =>
                                          setEditingMembers((current) =>
                                            current.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                                          )
                                        }
                                        className="w-full px-2 py-1 text-xs border rounded"
                                      />
                                    </div>
                                  ))}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        await api.cup.updateMembers(t.id!, editingMembers);
                                        setEditingTeamId(null);
                                        setTeams(await api.cup.getTeams());
                                      }}
                                      className="text-xs font-semibold px-2 py-1 rounded bg-emerald-600 text-white"
                                    >
                                      Mentés
                                    </button>
                                    <button
                                      onClick={() => setEditingTeamId(null)}
                                      className="text-xs text-slate-500 hover:underline"
                                    >
                                      Mégse
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingTeamId(t.id!);
                                    setEditingMembers(t.members || []);
                                  }}
                                  className="text-xs font-semibold text-vik-blue-700 hover:underline"
                                >
                                  Névsor módosítása kapitányként
                                </button>
                              )}
                            </div>
                          )}

                          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-medium text-slate-600">{t.edition}</span>
                            <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              {t.status || 'Regisztrálva'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tournament Highlights info box with schedule link */}
              <div className="bg-gradient-to-br from-vik-blue-800 to-vik-blue-900 text-white p-6 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-vik-gold-400 font-bold text-sm">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Lebonyolítás táblázat</span>
                </div>
                {scheduleInfo?.hasSchedule ? (
                  <div>
                    <p className="text-xs text-blue-100 leading-relaxed mb-3">
                      A bajnokság fordulójának részletes meccsbeosztása és csoportbeosztása letölthető az alábbi linken:
                    </p>
                    <button
                      onClick={() => api.cup.downloadSchedule()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-vik-gold-500 hover:bg-vik-gold-400 text-slate-900 font-bold text-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Lebonyolítás táblázat ITT</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-200 italic leading-relaxed">
                    Jelenleg nem elérhető a kupa lebonyolítása. Kérjük nézz vissza később!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Korábbi eredmények Tab - ONLY Vegyes */
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-vik-gold-500" />
                  <span>Dicsőségcsarnok & Korábbi Röpikupák</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  A Villanykari Röpikupa korábbi éveinek dobogós vegyes csapatai és bajnokai.
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
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
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
