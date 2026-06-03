'use client';

/**
 * VigilanteCiudadano - Landing Page (Institutional GovTech Style)
 * Location: app/page.tsx
 * Role: Principal Software Architect & Full-Stack Frontend Developer
 * 
 * DESIGN PRINCIPLES:
 * 1. GOVTECH AUTHORITATIVE: White/slate-50 background, navy/institutional blue accents (#1e3a8a), 
 *    off-white solid layouts, high trust. Prohibits dark/cyberpunk.
 * 2. ACCESSIBLE RESPONSIVENESS: Inter & Plus Jakarta Sans typography, scaled headers, functional CTAs.
 * 3. INTERACTIVE FEEDBACK: Sticky navigation, a responsive mobile drawer, and a live-status simulation card.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, MapPin, Menu, X, ArrowRight, CheckCircle, Lock, EyeOff, Activity, Phone } from 'lucide-react';
import ChatAsistente from '../components/ChatAsistente';
import Header from '../components/Header';

interface MockLog {
  time: string;
  message: string;
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveLogs, setLiveLogs] = useState<MockLog[]>([
    { time: '14:32', message: 'Incidente derivado a unidad central' },
    { time: '14:30', message: 'Alerta de tránsito reportada de forma anónima' },
    { time: '14:28', message: 'Unidad PAC-4022 en camino a cuadrante central' }
  ]);

  // Simulate a live operational environment by shifting logs over time
  useEffect(() => {
    const logPool = [
      'Patrulla P-102 ingresó a Cuadrante Sur',
      'Denuncia anónima encriptada con éxito (AES-GCM)',
      'Alerta AI: Colisión vehicular clasificada en Sopocachi',
      'Despacho BOL-110 derivado a Unidad PAC-8811',
      'Zona conflictiva reportada de forma segura',
      'Cifrado Zero-Knowledge activo en conexión saliente'
    ];

    const interval = setInterval(() => {
      const randomMsg = logPool[Math.floor(Math.random() * logPool.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setLiveLogs((prev) => [
        { time: timeStr, message: randomMsg },
        ...prev.slice(0, 2) // keep last 3 logs
      ]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans select-none selection:bg-[#1e3a8a] selection:text-white">
      
      {/* 1. SUTILE BACKGROUND GRID PATTERN (City Map SVG) */}
      <svg className="absolute inset-0 w-full h-full text-slate-500 opacity-[0.05] pointer-events-none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cityMapGrid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="68" y="12" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="12" y="68" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="68" y="68" width="40" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="60" cy="60" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cityMapGrid)" />
      </svg>

      {/* 2. SOFT RADAR TOP-CENTER INSTITUTIONAL BLUE GRADIENT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#1e3a8a] rounded-full blur-[120px] opacity-[0.05] pointer-events-none" />

      {/* 3. GLOBAL HEADER (Sticky Navigation) */}
      <Header />

      {/* 4. EMERGENCY NATIONAL BANNER (110) */}
      <div className="bg-red-600 border-b border-red-700 shadow-md relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-white">
            <span className="text-xl animate-pulse">📞</span>
            <div className="text-xs">
              <span className="font-extrabold uppercase tracking-wide block">Línea Directa de Emergencia Nacional</span>
              <span className="text-red-100 font-medium">Comuníquese de inmediato con la central del BOL-110 para auxilio policial.</span>
            </div>
          </div>
          <a
            href="tel:110"
            className="bg-white hover:bg-red-50 text-red-700 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-widest shadow transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4 text-red-600" />
            <span>Llamar al 110</span>
          </a>
        </div>
      </div>

      {/* 5. HERO SECTION & ACTION CARD GRID */}
      <section className="min-h-[85vh] flex items-center justify-center py-16 md:py-24 px-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Authoritative Copywriting */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-block animate-fadeIn">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-mono">
                Plataforma Oficial de Denuncia y Auxilio
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0f172a] leading-[1.1] uppercase">
              SEGURIDAD CIUDADANA <br className="hidden sm:inline" />
              <span className="text-[#1e3a8a]">EN TUS MANOS.</span>
            </h2>

            <p className="text-base text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Reporta incidentes de manera anónima, audita el accionar policial y solicita auxilio con tecnología de encriptación de grado militar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/reportar"
                className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 active:scale-95 active:bg-rose-800 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 active:shadow-none transition-all gap-2 text-center"
              >
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>Reportar Emergencia</span>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 text-slate-700 font-extrabold px-8 py-4 rounded-xl transition-all text-center"
              >
                <span>Cómo Funciona</span>
              </a>
            </div>
          </div>

          {/* Right Column: Floating Action Card & Live Telemetry Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 space-y-6 relative overflow-hidden transition-all hover:translate-y-[-4px]">
              
              {/* Background accent glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500 rounded-full blur-[40px] opacity-[0.06] pointer-events-none" />

              {/* Status Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                    Live Status
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  BOL-110 ACTIVO
                </span>
              </div>

              {/* Central operational illustration / details */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Servidor Descentralizado</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sistema Operativo y Seguro</p>
                  </div>
                </div>

                {/* Simulated active telemetry logs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#1e3a8a] font-bold uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Bitácora de Seguridad Ciudadana</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-3 font-mono text-[10px] text-slate-600">
                    {liveLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 items-start leading-tight transition-all duration-500">
                        <span className="text-slate-400 font-bold">[{log.time}]</span>
                        <span className="text-slate-700 font-medium">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zero-Knowledge reassuring footer */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start">
                <Lock className="w-4.5 h-4.5 text-[#1e3a8a] mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-slate-600 leading-normal">
                  **Garantía Criptográfica:** El reporte se encripta con algoritmos **AES-GCM** en el navegador. El servidor nunca conoce la identidad ni el texto plano.
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 6. ADVANTAGES SECTION Teaser (GovTech Pillars) */}
      <section id="como-funciona" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">PILARES OPERATIVOS</h3>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] uppercase">TRANSPARENCIA MEDIANTE TECNOLOGÍA</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              VigilanteCiudadano conecta directamente al ciudadano con las mesas operativas policiales de Bolivia, resguardando la integridad mediante herramientas de última generación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div id="transparencia" className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-3 scroll-mt-20">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Cifrado Zero-Knowledge</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Su denuncia se cifra de forma local. La clave nunca viaja al servidor, garantizando que el reporte sea totalmente confidencial y anónimo.
              </p>
            </div>
            
            <div id="mapa-riesgo" className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-3 scroll-mt-20">
              <div className="w-10 h-10 bg-blue-100 text-[#1e3a8a] rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Geolocalización Auditada</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                La ubicación de las unidades patrulla se mapea en tiempo real mediante cálculos espaciales PostGIS, controlando rutas de forma pública.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <EyeOff className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Anonimato Criptográfico</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generamos identidades virtuales sin enlaces a identidades físicas para auditorías de auxilio y reportes ciudadanos seguros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECURE INSTITUTIONAL FOOTER */}
      <footer id="contacto" className="bg-slate-900 text-slate-400 py-12 text-center text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-white font-bold mb-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>VIGILANTE CIUDADANO // DEPARTAMENTO DE CIBERSEGURIDAD</span>
          </div>
          <p className="max-w-md mx-auto text-[10px] leading-relaxed text-slate-500">
            Plataforma digital regulada de auditoría policial y despacho automatizado BOL-110. Cifrado simétrico AES-GCM-256 habilitado.
          </p>
          <div className="border-t border-slate-800 pt-6 text-[9px] text-slate-600">
            © 2026 VigilanteCiudadano. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Floating Helper Assistant Chatbot Widget */}
      <ChatAsistente />

    </div>
  );
}
