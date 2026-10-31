import React from 'react';
import { Volleyball, Users, HeartHandshake } from 'lucide-react';

const leaders = [
  ['Kovács Péter', 'Körvezető'],
  ['Nagy Anna', 'Körvezető helyettes'],
  ['Kiss Bence', 'Gazdasági felelős'],
  ['Szabó Eszter', 'HR felelős'],
  ['Horváth Márk', 'Edzéskoordinátor'],
  ['Tóth Zsófia', 'Edzéskoordinátor'],
  ['Varga Dániel', 'Edzéskoordinátor'],
  ['Molnár Gábor', 'Edzéskoordinátor'],
  ['Farkas Lili', 'PR-felelős'],
  ['Papp Balázs', 'VRK főrendező'],
  ['Takács Dóra', 'VRK Bajnokság főrendező'],
];

export default function LeadershipPage() {
  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-sm font-bold uppercase tracking-wider mb-2"><Users className="w-4 h-4 text-vik-gold-500" />Tagjaink</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">BME VIK Röplabda Kör</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map(([name, role]) => (
            <div key={`${name}-${role}`} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-vik-blue-900 text-vik-gold-400 flex items-center justify-center"><Volleyball className="w-6 h-6" /></div>
              <div><h2 className="font-bold text-slate-900">{name}</h2><p className="text-sm text-vik-blue-700 font-semibold">{role}</p></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-3xl mx-auto mt-16">
          <HeartHandshake className="w-10 h-10 text-vik-gold-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Kövess minket, utánunk csatlakoznál?</h3>
          <p className="text-sm text-slate-600 mb-5">Keress minket közösségi média platformjainkon!</p>
          <div className="flex justify-center gap-4 text-sm font-semibold">
            <a href="mailto:ropikorvik@gmail.com" className="text-vik-blue-700 hover:underline">ropikorvik@gmail.com</a>
            <a href="https://instagram.com/ropikor_vik" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">@ropikor_vik</a>
          </div>
        </div>
      </div>
    </div>
  );
}
