'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus, 
  User as UserIcon,
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navLinks = [
    { href: '/edzes', label: 'Edzés' },
    { href: '/ropikupa', label: 'Röpikupa' },
    { href: '/vezetoseg', label: 'Tagjaink' },
    { href: '/uzenet', label: 'Üzenj nekünk' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-black text-white shadow-md border-b-4 border-vik-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none" aria-label="Vissza a kezdőlapra">
            <Image
              src="/ropi-kor-logo.png"
              alt="BME VIK Röplabda Kör"
              width={142}
              height={86}
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              priority
            />
            <span className="hidden sm:block text-base lg:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
              BME VIK <span className="text-vik-gold-400">Röplabda Kör</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-slate-800 text-vik-gold-300 font-semibold'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin link for admins only */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-vik-gold-500 text-slate-900 hover:bg-vik-gold-400 font-semibold'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                  <UserIcon className="w-4 h-4 text-vik-gold-400" />
                  <span className="font-medium text-slate-200 truncate max-w-[130px]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Kijelentkezés"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Kijelentkezés</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/bejelentkezes"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  <LogIn className="w-4 h-4 text-vik-gold-400" />
                  <span>Bejelentkezés</span>
                </Link>
                <Link
                  href="/regisztracio"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold bg-vik-gold-500 text-slate-900 hover:bg-vik-gold-400 rounded-md shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Regisztráció</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Menü megnyitása"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden bg-black border-t border-slate-700 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.href)
                  ? 'bg-slate-800 text-vik-gold-300 font-semibold'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium bg-vik-gold-500 text-slate-900 font-semibold"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <div className="pt-4 border-t border-slate-700 mt-3 space-y-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-vik-gold-300 font-medium bg-slate-800 rounded-md">
                  <UserIcon className="w-4 h-4" />
                  <span>Bejelentkezve: {user.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-200 bg-red-900/40 hover:bg-red-900/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Kijelentkezés</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/bejelentkezes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 text-center"
                >
                  <LogIn className="w-4 h-4 text-vik-gold-400" />
                  <span>Bejelentkezés</span>
                </Link>
                <Link
                  href="/regisztracio"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-semibold bg-vik-gold-500 text-slate-900 hover:bg-vik-gold-400 text-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Regisztráció</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
