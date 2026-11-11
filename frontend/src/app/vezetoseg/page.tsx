import React from 'react';
import { Volleyball, Users, Mail, Instagram } from 'lucide-react';

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
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-sm font-bold uppercase tracking-wider mb-2">
            <Users className="w-4 h-4 text-vik-gold-500" />
            Vezetőség
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">BME VIK Röplabda Kör</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map(([name, role]) => (
            <div key={`${name}-${role}`} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-vik-blue-900 text-vik-gold-400 flex items-center justify-center">
                <Volleyball className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{name}</h2>
                <p className="text-sm text-vik-blue-700 font-semibold">{role}</p>
              </div>
            </div>
          ))}
        </div>
        <section className="py-16 bg-white border-t border-slate-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Csatlakozz hozzánk!
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Nem csak BME-s és villanykaros hallgatóknak van lehetősége csatlakozni: a részvétel elsősorban BME Villanykarosoknak szól, de nyitva áll bármely BME-s hallgatónak, vagy akár külsős barátoknak is, akik szeretnének velünk játszani.
              </p>

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
    </div>
  );
}
