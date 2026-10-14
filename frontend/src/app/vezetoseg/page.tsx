import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  ExternalLink, 
  Award, 
  ShieldCheck, 
  HeartHandshake, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function LeadershipPage() {
  const leaders = [
    {
      name: 'Kovács Péter',
      role: 'Elnök',
      email: 'kovacs.peter@ropikor.hu',
      bio: 'Ötödéves mérnökinformatikus hallgató, felelős a kör általános működéséért, a teremfoglalásokért és az egyetemi vezetéssel való kapcsolattartásért.',
      department: 'BME VIK - Villamosmérnöki és Informatikai Kar',
      avatarColor: 'bg-blue-600',
    },
    {
      name: 'Nagy Anna',
      role: 'Alelnök',
      email: 'nagy.anna@ropikor.hu',
      bio: 'Negyedéves villamosmérnök hallgató. Fő feladata az edzéstervek és edzésidőpontok koordinációja, valamint a bajnokságok lebonyolítása.',
      department: 'BME VIK - Villamosmérnöki és Informatikai Kar',
      avatarColor: 'bg-emerald-600',
    },
    {
      name: 'Kiss Bence',
      role: 'Gazdasági felelős',
      email: 'kiss.bence@ropikor.hu',
      bio: 'Harmadéves gazdaságinformatikus hallgató, aki a köri költségvetésért, a labdák, mezek és kupadíjak beszerzéséért, valamint az elszámolásokért felel.',
      department: 'BME VIK - Gazdaságinformatikus',
      avatarColor: 'bg-amber-600',
    },
    {
      name: 'Szabó Eszter',
      role: 'PR felelős',
      email: 'szabo.eszter@ropikor.hu',
      bio: 'Harmadéves mérnökinformatikus hallgató, a közösségi média felületek, hírlevelek kezelője és a Röpikupa promóciójának vezetője.',
      department: 'BME VIK - Villamosmérnöki és Informatikai Kar',
      avatarColor: 'bg-purple-600',
    },
  ];

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
            <Users className="w-4 h-4 text-vik-gold-500" />
            <span>Közösségi Vezetés</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Tagjaink
          </h1>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Ismerd meg a BME VIK Röplabda Kör tagjait! Fordulj hozzánk bizalommal teremhasználattal, edzéssel vagy a Röpikupával kapcsolatos kérdésekben.
          </p>
        </div>

        {/* Member list */}
        <div className="bg-white border-y border-slate-200 mb-16 divide-y divide-slate-200">
          {leaders.map((leader) => (
            <div
              key={leader.email}
              className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center gap-5"
            >
              <div className="flex items-center gap-4 lg:w-72 shrink-0">
                  <div
                    className="w-12 h-12 rounded-full bg-black text-vik-gold-400 font-extrabold text-lg flex items-center justify-center"
                  >
                    {leader.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{leader.name}</h3>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-vik-gold-700 mt-0.5">
                      <Award className="w-3.5 h-3.5" />
                      {leader.role}
                    </div>
                  </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">
                {leader.bio}
              </p>
              <div className="flex flex-col gap-1 text-xs text-slate-500 lg:w-64 shrink-0">
                <span className="font-medium text-slate-700">{leader.department}</span>
                <a href={`mailto:${leader.email}`} className="inline-flex items-center gap-1.5 text-vik-blue-700 hover:text-vik-blue-800 font-semibold">
                  <Mail className="w-4 h-4 text-vik-gold-500" />
                  <span>{leader.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* PEK Tagság Section */}
        <div className="bg-gradient-to-r from-vik-blue-800 to-vik-blue-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vik-gold-500/20 text-vik-gold-300 border border-vik-gold-400/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-vik-gold-400" />
                <span>Hivatalos Elismerés & Közösség</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                BME Profil és Körök (PEK) Tagság
              </h2>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                A BME VIK Röplabda Kör hivatalosan bejegyzett öntevékeny kör a Schönherz Kollégiumban és a Villamosmérnöki és Informatikai Karon. Az aktív tagság igazolása a PEK rendszerén keresztül történik, amely közösségi pontokat biztosít a kollégiumi felvételi eljárásban.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-vik-gold-400 shrink-0" />
                  <span>Közösségi pontok kollégiumi felvételihez</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-vik-gold-400 shrink-0" />
                  <span>Körvezetői ajánlás és tagsági igazolás</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <a
                href="https://pek.sch.bme.hu/groups/248"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-900 bg-vik-gold-500 hover:bg-vik-gold-400 shadow-md shadow-vik-gold-500/30 transition-all text-sm sm:text-base"
              >
                <span>PEK Köri Oldal Megnyitása</span>
                <ExternalLink className="w-5 h-5" />
              </a>
              <span className="text-xs text-blue-300 mt-2">
                Aktivitás igazolás a Schönherz PEK-ben
              </span>
            </div>
          </div>
        </div>

        {/* Social media connections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-3xl mx-auto shadow-sm">
          <HeartHandshake className="w-10 h-10 text-vik-gold-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Kövess minket a közösségi oldalakon!
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Csatlakozz csoportjainkhoz a legfrissebb bejelentésekért, terem- és strandidőpontokért, vagy küldj nekünk közvetlen üzenetet!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://instagram.com/bme_vik_roplabda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-pink-500 hover:text-pink-600 bg-slate-50 hover:bg-pink-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span className="text-lg">📸</span>
              <span>Instagram @bme_vik_roplabda</span>
            </a>

            <a
              href="https://facebook.com/bmevikroplabda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span className="text-lg">📘</span>
              <span>Facebook Oldal</span>
            </a>

            <Link
              href="/uzenet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vik-blue-700 hover:bg-vik-blue-800 text-white transition-colors text-sm font-semibold shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Közvetlen üzenetküldés</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
