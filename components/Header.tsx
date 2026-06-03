'use client';

/**
 * VigilanteCiudadano - Unified Header Component (Role & Environment Selector)
 * Location: components/Header.tsx
 * Role: Principal Software Architect & Full-Stack Frontend Developer
 * 
 * DESIGN PRINCIPLES:
 * 1. SLICED ENVIRONMENT SWITCHER: Direct, highly visible selector tabs to jump between roles
 *    (Ciudadano, Comando, Oficial), highlighting active contexts.
 * 2. GOVTECH SOBER AESTHETICS: Institutional navy blue (#1e3a8a), clean borders, slate badges.
 * 3. MOBILE RESPONSIVE ADAPTABILITY: Compact flex layout that adjusts on small screen dimensions.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Map, Radio, Menu, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active check helper
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/reportar' || pathname === '/ciudadano';
    }
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#1e3a8a] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10 group-hover:scale-105 active:scale-95 transition-all">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black text-slate-800 tracking-tight leading-none">
              Vigilante<span className="text-[#1e3a8a]">Ciudadano</span>
            </span>
            <span className="text-[8px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
              Bolivia // SEGURIDAD
            </span>
          </div>
        </Link>

        {/* Center: Desktop Environment / Role Selector (Highly visible) */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isActive('/')
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Portal Ciudadano</span>
          </Link>

          <Link
            href="/mapa"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isActive('/mapa')
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Centro de Comando</span>
          </Link>

          <Link
            href="/oficial"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isActive('/oficial')
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Terminal Oficial</span>
          </Link>

        </nav>

        {/* Right: Security Badge / Telemetry Direct Calling Dial */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:110"
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors border border-red-700"
          >
            <span>🚨 Llamar 110</span>
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-50 focus:outline-none transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>

      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2.5 animate-slideDown shadow-lg">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">
            Selector de Entorno
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
              isActive('/')
                ? 'bg-[#1e3a8a]/5 border-[#1e3a8a]/20 text-[#1e3a8a]'
                : 'border-transparent text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Portal Ciudadano (Emergencia)</span>
          </Link>

          <Link
            href="/mapa"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
              isActive('/mapa')
                ? 'bg-[#1e3a8a]/5 border-[#1e3a8a]/20 text-[#1e3a8a]'
                : 'border-transparent text-slate-600'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Centro de Comando (Operador)</span>
          </Link>

          <Link
            href="/oficial"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
              isActive('/oficial')
                ? 'bg-[#1e3a8a]/5 border-[#1e3a8a]/20 text-[#1e3a8a]'
                : 'border-transparent text-slate-600'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Terminal Oficial (Patrulla)</span>
          </Link>

          {/* Emergency trigger for mobile */}
          <div className="pt-2 border-t border-slate-100">
            <a
              href="tel:110"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-red-700 shadow"
            >
              <span>🚨 LLAMAR AL 110 (EMERGENCIA)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
