import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Image src="/ropi-kor-logo.png" alt="BME VIK Röplabda Kör" width={180} height={110} className="h-16 w-auto object-contain" />
            <p className="text-xs text-slate-400 leading-relaxed">
              A Budapesti Műszaki és Gazdaságtudományi Egyetem Villamosmérnöki és Informatikai Karának hivatalos röplabda köre. Heti edzések, bajnokságok és közösségi programok.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider text-vik-gold-400">
              Gyorshivatkozások
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/edzes" className="hover:text-vik-gold-400 transition-colors">
                  Edzésidőpontok
                </Link>
              </li>
              <li>
                <Link href="/ropikupa" className="hover:text-vik-gold-400 transition-colors">
                  Villanykari Röpikupa
                </Link>
              </li>
              <li>
                <Link href="/vezetoseg" className="hover:text-vik-gold-400 transition-colors">
                  Tagjaink
                </Link>
              </li>
              <li>
                <Link href="/uzenet" className="hover:text-vik-gold-400 transition-colors">
                  Kapcsolatfelvétel
                </Link>
              </li>
            </ul>
          </div>

          {/* PEK & Levlista links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider text-vik-gold-400">
              Egyetemi Kapcsolatok
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://pek.sch.bme.hu/groups/248"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-vik-gold-400 transition-colors group"
                >
                  <span>PEK Tagság igazolás</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-vik-gold-400" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:roplabda-kor@sch.bme.hu"
                  className="flex items-center gap-1.5 hover:text-vik-gold-400 transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-vik-gold-400" />
                  <span>Köri Levlista (Mailman)</span>
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-400 block pt-1">
                  Központi e-mail: <br />
                  <a href="mailto:info@ropikor.hu" className="text-blue-300 hover:underline">
                    info@ropikor.hu
                  </a>
                </span>
              </li>
            </ul>
          </div>

          {/* Social icons */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider text-vik-gold-400">
              Közösség & Média
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Kövess minket a legfrissebb meccsképekért, edzésinfókért és kupahírekért!
            </p>
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/bme_vik_roplabda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-vik-gold-500 hover:text-slate-900 flex items-center justify-center transition-colors text-slate-300"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/bmevikroplabda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-vik-gold-500 hover:text-slate-900 flex items-center justify-center transition-colors text-slate-300"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>

              {/* Messenger */}
              <a
                href="https://m.me/bmevikroplabda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Messenger"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-vik-gold-500 hover:text-slate-900 flex items-center justify-center transition-colors text-slate-300"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.08.301 2.235.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.196 14.957l-3.056-3.26-5.968 3.26 6.565-6.969 3.134 3.26 5.89-3.26-6.565 6.969z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© BME VIK Röplabda Kör 2026. Minden jog fenntartva.</p>
          <p className="flex items-center gap-1">
            Készült a Villamosmérnöki és Informatikai Kar hallgatóinak támogatására.
          </p>
        </div>
      </div>
    </footer>
  );
}
