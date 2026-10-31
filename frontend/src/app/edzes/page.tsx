'use client';

import React, { useState, useEffect } from 'react';
import { Training } from '@/types';
import { api } from '@/lib/api';
import TrainingCard from '@/components/TrainingCard';
import { 
  CalendarDays, 
  Filter, 
  MapPin, 
  Search, 
  Info, 
  Loader2 
} from 'lucide-react';

type LocationFilter = 'Összes' | 'BME' | 'Bercsényi' | 'Kármán' | 'Óbudai' | 'Strand';

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<LocationFilter>('Összes');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTrainings = async () => {
    try {
      const data = await api.trainings.getAll();
      setTrainings(data);
    } catch (err) {
      console.error('Hiba az edzések betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const filterTabs: LocationFilter[] = ['Összes', 'BME', 'Bercsényi', 'Kármán', 'Óbudai', 'Strand'];

  const filteredTrainings = trainings.filter((training) => {
    // Filter tab condition
    let matchesTab = true;
    if (selectedFilter === 'BME') {
      matchesTab = training.location.toLowerCase().includes('bme') && !training.location.toLowerCase().includes('strand');
    } else if (selectedFilter === 'Óbudai') {
      matchesTab = training.location.toLowerCase().includes('óbudai') || training.location.toLowerCase().includes('obudai');
    } else if (selectedFilter === 'Strand') {
      matchesTab = training.location.toLowerCase().includes('strand') || training.title.toLowerCase().includes('strand');
    } else if (selectedFilter === 'Bercsényi') {
      matchesTab = training.location.toLowerCase().includes('bercsényi');
    } else if (selectedFilter === 'Kármán') {
      matchesTab = training.location.toLowerCase().includes('kármán');
    }

    // Search query condition
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.type.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
            <CalendarDays className="w-4 h-4 text-vik-gold-500" />
            <span>Heti Menetrend</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Edzés & Foglalások
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
            Itt találod a héten induló edzéseinket. A terem és pálya befogadóképessége véges: amennyiben egy edzés megtelik, a jelentkezésed automatikusan várólistára kerül!
          </p>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Location Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block shrink-0" />
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedFilter === tab
                    ? 'bg-vik-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Keresés edzésre, helyszínre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vik-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Rule explanation alert */}
        <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 flex items-start gap-3">
          <Info className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-semibold text-vik-blue-900">Fontos tudnivaló:</span> Ha már nem tudsz megjelenni egy korábban lefoglalt edzésen, kérjük mielőbb kattints a{' '}
            <strong className="text-red-700">Lejelentkezem</strong> gombra, hogy a várólista első helyezettje automatikusan bekerülhessen a helyedre!
          </div>
        </div>

        {/* Training Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-vik-blue-700 mb-3" />
            <p className="text-slate-600 font-medium">Edzés betöltése...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">Nem található edzés</h3>
            <p className="text-sm text-slate-500 mb-4">
              A megadott szűrési feltételeknek vagy keresésnek egyetlen edzés sem felel meg.
            </p>
            <button
              onClick={() => {
                setSelectedFilter('Összes');
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-lg bg-vik-blue-700 text-white text-sm font-semibold hover:bg-vik-blue-800 transition-colors"
            >
              Szűrők törlése
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainings.map((t) => (
              <TrainingCard key={t.id} training={t} onRefresh={fetchTrainings} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
