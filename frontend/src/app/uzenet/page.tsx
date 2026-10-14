'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  MessageSquare, 
  Clock, 
  Building2,
  Loader2 
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!name.trim()) {
      setError('A név megadása kötelező!');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setError('Kérjük, érvényes e-mail címet adj meg!');
      return;
    }
    if (!subject.trim()) {
      setError('A tárgy megadása kötelező!');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Az üzenetnek legalább 10 karakter hosszúnak kell lennie!');
      return;
    }

    setLoading(true);

    try {
      await api.contact.sendMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess('Köszönjük megkeresésedet! Üzenetedet sikeresen rögzítettük, a vezetőség hamarosan válaszol e-mailben.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Hiba történt az üzenet elküldése során. Kérjük próbáld újra később!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-vik-blue-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-4 h-4 text-vik-gold-500" />
            <span>Kapcsolatfelvétel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Üzenj nekünk!
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
            Kérdésed van az edzésekről, a Röpikupáról, vagy szeretnél szponzorként / partnerként kapcsolatba lépni velünk? Írj nekünk az alábbi űrlapon!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-vik-blue-700" />
              <span>Közvetlen üzenet küldése</span>
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Neved <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="pl. Minta János"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail címed <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="pl. janos.minta@edu.bme.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tárgy <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="pl. Kérdés a kezdő edzésekről"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Üzenet szövege <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Írd le a kérdésedet vagy észrevételedet..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm resize-y"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-vik-blue-700 hover:bg-vik-blue-800 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Küldés folyamatban...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Üzenet elküldése</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Contact Details & Locations info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-lg border-b pb-3 border-slate-100">
                Elérhetőségek
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Központi e-mail cím</span>
                    <a href="mailto:info@ropikor.hu" className="text-vik-blue-700 hover:underline">
                      info@ropikor.hu
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Kollégiumi székhely</span>
                    <span className="text-slate-600">
                      Schönherz Zoltán Kollégium, 1117 Budapest, Irinyi József u. 42.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-vik-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Válaszadási idő</span>
                    <span className="text-slate-600">
                      Általában 24-48 órán belül válaszolunk a megkeresésekre.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-lg border-b pb-3 border-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-vik-gold-500" />
                <span>Edzéshelyszíneink</span>
              </h3>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-800 block">BME Sportközpont</strong>
                  <span>1111 Budapest, Bertalan Lajos u. 4-6.</span>
                </li>
                <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-800 block">Óbudai Egyetem Sportcsarnok</strong>
                  <span>1034 Budapest, Doberdó út 6.</span>
                </li>
                <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-800 block">BME Strandröplabda Pálya</strong>
                  <span>1111 Budapest, Műegyetem rkp. 3. (Központi kampusz)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
