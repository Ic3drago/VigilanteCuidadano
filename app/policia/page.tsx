'use client';

/**
 * VigilanteCiudadano - ConsolaPolicial Page (Police View)
 * Location: app/policia/page.tsx
 * Role: Principal Software Architect & Full-Stack Frontend Developer
 */

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, ShieldAlert, Radio, Activity, Users } from 'lucide-react';
import MapaPatrullas from '../../components/MapaPatrullas';

export default function ConsolaPolicial() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/oficial';
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none pb-16 relative overflow-hidden">
      
      {/* Decorative City Grid SVG overlay */}
      <svg className="absolute inset-0 w-full h-full text-slate-500 opacity-[0.04] pointer-events-none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cityMapGridPolice" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="68" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cityMapGridPolice)" />
      </svg>

      {/* Global Navigation Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-[#1e3a8a] text-xs font-bold uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center text-white">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <span className="text-sm font-black text-slate-800 tracking-tight">VigilanteCiudadano</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-red-700 shadow-md"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Title bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              👮 Consola de Comando Operacional BOL-110
            </h2>
            <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5 tracking-wider">
              Sistema Gubernamental de Auditoría y Auxilio de Emergencias en Bolivia
            </p>
          </div>
          
          {/* Quick Stats overview */}
          <div className="flex gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-2.5 py-1">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-slate-500 font-bold">CANALES:</span>
              <span className="text-slate-800 font-black">ACTIVOS</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span className="text-slate-500 font-bold">AUDITORES:</span>
              <span className="text-[#1e3a8a] font-black">PÚBLICOS</span>
            </div>
          </div>
        </div>

        {/* Center Panel (Tactical Dashboard Console) */}
        <div className="w-full flex justify-center">
          <MapaPatrullas />
        </div>

      </main>

    </div>
  );
}
