'use client';

/**
 * VigilanteCiudadano - Centro de Comando / Dashboard del Operador de Despacho
 * Location: app/mapa/page.tsx
 * Role: Dispatch Operator Dashboard (Full-Screen GovTech Layout)
 *
 * ARCHITECTURE:
 * 1. FULL-SCREEN LAYOUT (100vh, no-scroll): Split into Left (35%) Inbox + Right (65%) Map.
 * 2. EMERGENCY INBOX: Simulated incoming emergencies with AI triage data, citizen description,
 *    and computed zone assignment. Each card has "Asignar Unidad" dispatching workflow.
 * 3. ZONAL DISPATCH: Modal/dropdown to select the patrol unit based on EPI zone.
 *    On confirmation, emergency transitions to DESPACHADA and leaves the inbox.
 * 4. DUAL-VIEW MAP: Retro radar SVG + Google Maps (hot switchable), synced with Supabase Realtime.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, MapPin, Radio, Compass, RefreshCw, Layers, AlertTriangle,
  Clock, CheckCircle2, ChevronDown, X, Siren, User, FileText,
  Activity, Zap, Send, PhoneCall, Eye, Lock, LogIn, EyeOff
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import Header from '../../components/Header';

/* ──────────────────────────────────── TYPES ──────────────────────────────────── */

interface Patrol {
  id: string;
  placa: string;
  lat: number;
  lng: number;
  status: 'LIBRE' | 'EN_CAMINO' | 'EN_INTERVENCION';
  cuadrante: string;
}

interface Emergency {
  id: string;
  casoNum: string;
  tipo: string;
  gravedad: 'CRÍTICA' | 'ALTA' | 'MEDIA';
  descripcion: string;
  zona: string;
  coordenadas: { lat: number; lng: number };
  timestamp: string;
  estado: 'PENDIENTE' | 'DESPACHADA';
  unidadAsignada?: string;
}

interface EPIUnit {
  id: string;
  nombre: string;
  epi: string;
  zona: string;
  disponible: boolean;
}

interface TelemetryLog {
  id: string;
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'success' | 'dispatch';
}

/* ─────────────────────────────── STATIC DATA ─────────────────────────────── */

const CENTER_LAT = -17.3895;
const CENTER_LON = -66.1568;

const INITIAL_PATRULLAS: Patrol[] = [
  { id: 'p-1', placa: 'PAC-4022', lat: -17.3840, lng: -66.1480, status: 'LIBRE', cuadrante: 'Norte' },
  { id: 'p-2', placa: 'PAC-8811', lat: -17.3980, lng: -66.1660, status: 'EN_INTERVENCION', cuadrante: 'Sur' },
  { id: 'p-3', placa: 'PAC-3033', lat: -17.3910, lng: -66.1410, status: 'LIBRE', cuadrante: 'Central' },
];

const INITIAL_EMERGENCIES: Emergency[] = [
  {
    id: 'em-1',
    casoNum: 'CAS-2026-7A3F',
    tipo: 'ROBO EN PROGRESO',
    gravedad: 'CRÍTICA',
    descripcion: 'Dos individuos armados ingresaron a la tienda de electrodomésticos en la Av. Heroínas esquina Ayacucho. Tienen a 4 rehenes. Vecinos reportan disparos al aire. Se solicita intervención inmediata.',
    zona: 'Cuadrante Central',
    coordenadas: { lat: -17.3915, lng: -66.1550 },
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estado: 'PENDIENTE',
  },
  {
    id: 'em-2',
    casoNum: 'CAS-2026-9B1E',
    tipo: 'VIOLENCIA DOMÉSTICA',
    gravedad: 'ALTA',
    descripcion: 'Vecina del tercer piso reporta gritos de auxilio provenientes del departamento 2-B. Se escuchan golpes y llanto de menores. La situación lleva aproximadamente 20 minutos. El agresor podría estar bajo influencia de alcohol.',
    zona: 'Zona Norte',
    coordenadas: { lat: -17.3820, lng: -66.1450 },
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estado: 'PENDIENTE',
  },
];

const EPI_UNITS: EPIUnit[] = [
  { id: 'epi-1', nombre: 'PAC-Centro', epi: 'EPI Central', zona: 'Cuadrante Central', disponible: true },
  { id: 'epi-2', nombre: 'PAC-120', epi: 'EPI Norte', zona: 'Zona Norte', disponible: true },
  { id: 'epi-3', nombre: 'PAC-304', epi: 'EPI Sur', zona: 'Zona Sur', disponible: true },
  { id: 'epi-4', nombre: 'PAC-207', epi: 'EPI Este', zona: 'Zona Este', disponible: false },
  { id: 'epi-5', nombre: 'PAC-515', epi: 'EPI Oeste', zona: 'Zona Oeste', disponible: true },
];

/* ─────────────────────── SEVERITY BADGE COMPONENT ─────────────────────── */

function SeverityBadge({ level }: { level: Emergency['gravedad'] }) {
  const styles = {
    'CRÍTICA': 'bg-red-600 text-white border-red-700 animate-pulse',
    'ALTA': 'bg-amber-500 text-white border-amber-600',
    'MEDIA': 'bg-sky-500 text-white border-sky-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${styles[level]}`}>
      {level}
    </span>
  );
}

/* ────────────────────── DISPATCH MODAL COMPONENT ────────────────────── */

function DispatchModal({
  emergency,
  units,
  onConfirm,
  onClose,
}: {
  emergency: Emergency;
  units: EPIUnit[];
  onConfirm: (emergencyId: string, unitName: string) => void;
  onClose: () => void;
}) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Sort units: matching zone first, then available
  const sortedUnits = [...units].sort((a, b) => {
    const aMatch = a.zona === emergency.zona ? -1 : 1;
    const bMatch = b.zona === emergency.zona ? -1 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return (a.disponible ? -1 : 1) - (b.disponible ? -1 : 1);
  });

  const handleConfirm = () => {
    if (!selectedUnit) return;
    setConfirming(true);
    setTimeout(() => {
      onConfirm(emergency.id, selectedUnit);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e3a8a] px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4" />
              Despacho Zonal
            </h3>
            <p className="text-blue-200 text-[10px] font-mono mt-0.5">
              Caso {emergency.casoNum} · {emergency.zona}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency summary */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge level={emergency.gravedad} />
            <span className="text-xs font-bold text-slate-800">{emergency.tipo}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Coordenadas: [{emergency.coordenadas.lat.toFixed(4)}, {emergency.coordenadas.lng.toFixed(4)}]
          </p>
        </div>

        {/* Unit selector */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
            Seleccionar Unidad de Patrulla
          </p>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {sortedUnits.map((unit) => {
              const isMatch = unit.zona === emergency.zona;
              const isSelected = selectedUnit === unit.nombre;
              return (
                <button
                  key={unit.id}
                  disabled={!unit.disponible}
                  onClick={() => setSelectedUnit(unit.nombre)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                    !unit.disponible
                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#1e3a8a]/5 border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20'
                      : 'bg-white border-slate-200 hover:border-[#1e3a8a]/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${unit.disponible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div>
                      <span className="font-bold text-slate-800">{unit.nombre}</span>
                      <span className="text-slate-400 ml-1.5">({unit.epi})</span>
                      {isMatch && (
                        <span className="ml-2 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                          ZONA COINCIDE
                        </span>
                      )}
                    </div>
                  </div>
                  {!unit.disponible && (
                    <span className="text-[8px] font-bold uppercase text-slate-400">EN MISIÓN</span>
                  )}
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedUnit || confirming}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              selectedUnit && !confirming
                ? 'bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 shadow-lg shadow-blue-900/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {confirming ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Despachando...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar Despacho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── EMERGENCY CARD COMPONENT ──────────────────── */

function EmergencyCard({
  emergency,
  onDispatch,
}: {
  emergency: Emergency;
  onDispatch: (em: Emergency) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const gravedadColors = {
    'CRÍTICA': 'border-l-red-500',
    'ALTA': 'border-l-amber-500',
    'MEDIA': 'border-l-sky-500',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${gravedadColors[emergency.gravedad]} shadow-sm hover:shadow-md transition-all overflow-hidden ${
        emergency.gravedad === 'CRÍTICA' ? 'ring-1 ring-red-200' : ''
      }`}
    >
      {/* Card header */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <SeverityBadge level={emergency.gravedad} />
              <span className="text-[10px] font-mono text-slate-400">{emergency.casoNum}</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              {emergency.gravedad === 'CRÍTICA' && <Siren className="w-4 h-4 text-red-500 flex-shrink-0" />}
              {emergency.tipo}
            </h4>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <Clock className="w-3 h-3" />
              {emergency.timestamp}
            </div>
          </div>
        </div>

        {/* Zone + coords */}
        <div className="mt-2 flex items-center gap-3 text-[10px]">
          <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            📍 {emergency.zona}
          </span>
          <span className="font-mono text-slate-400">
            [{emergency.coordenadas.lat.toFixed(4)}, {emergency.coordenadas.lng.toFixed(4)}]
          </span>
        </div>

        {/* Description toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-[#1e3a8a] hover:text-[#1e3a8a]/70 transition-colors uppercase tracking-wider"
        >
          <Eye className="w-3 h-3" />
          {expanded ? 'Ocultar Descripción' : 'Ver Descripción Completa'}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable description */}
      {expanded && (
        <div className="px-4 pb-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Reporte Ciudadano (Descifrado AES-GCM)
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {emergency.descripcion}
            </p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
          <Activity className="w-3 h-3" />
          <span>IA Triaje: {emergency.tipo}</span>
        </div>
        <button
          onClick={() => onDispatch(emergency)}
          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Send className="w-3 h-3" />
          Asignar Unidad
        </button>
      </div>
    </div>
  );
}

/* ──────────────────── DISPATCHED TOAST COMPONENT ──────────────────── */

function DispatchedToast({ caso, unidad, onDone }: { caso: string; unidad: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-[110] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out] border border-emerald-500">
      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="text-xs font-black uppercase tracking-wider">Despacho Confirmado</p>
        <p className="text-[10px] text-emerald-100 font-mono mt-0.5">
          {caso} → {unidad}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════ OPERATOR LOGIN COMPONENT ═══════════════════════ */

function OperatorLogin({ onLogin }: { onLogin: (operatorName: string) => void }) {
  const [operator, setOperator] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim() || !password.trim()) {
      setError('Error de Autenticación: Debe ingresar su credencial de operador y contraseña.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'operador', identificador: operator, pin: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo de autenticación.');
      }

      onLogin(data.user.identificador);
    } catch (err: any) {
      setError(err.message || 'Error en la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Security Grid Background */}
      <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-[0.15] pointer-events-none">
        <defs>
          <pattern id="secGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="20" cy="20" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#secGrid)" />
      </svg>

      {/* Security Glow Accents */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative w-full max-w-md space-y-6 z-10">
        
        {/* GovTech Header Panel */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Shield className="w-10 h-10 text-[#1e3a8a]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Centro de Mando y Control
            </h1>
            <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">
              Dirección Nacional de Tecnología y Telemática · BOL-110
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl"
        >
          <div className="text-center border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center justify-center gap-1.5 w-fit mx-auto">
              <Lock className="w-3.5 h-3.5" />
              Acceso Restringido - Red de Seguridad Nacional
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[10px] text-red-600 font-bold text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Operator ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Credencial de Operador (Usuario)
            </label>
            <div className="relative">
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Ej: Sgt. Quispe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/30 outline-none transition-all"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Contraseña de Seguridad
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/30 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[9px] text-slate-500 leading-relaxed text-center font-mono">
              AVISO: Toda actividad en esta terminal es registrada, grabada y sujeta a auditoría penal de seguridad nacional.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-60 border border-blue-800"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando Credenciales...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Autenticar Operador</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Criptográfico */}
        <div className="text-center space-y-1">
          <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">
            Sesión encriptada AES-256-GCM · IP Registrada · Certificado BOL-110 Activo
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════ MAIN PAGE ══════════════════════════════ */

export default function CentroDeComando() {
  /* ── State ── */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [operatorName, setOperatorName] = useState('SGT. QUISPE');
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('radar');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [patrullas, setPatrullas] = useState<Patrol[]>(INITIAL_PATRULLAS);
  const [emergencias, setEmergencias] = useState<Emergency[]>(INITIAL_EMERGENCIES);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [radarAngle, setRadarAngle] = useState(0);

  // Dispatch modal
  const [dispatchTarget, setDispatchTarget] = useState<Emergency | null>(null);
  // Toast
  const [toast, setToast] = useState<{ caso: string; unidad: string } | null>(null);

  const googleMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  /* ── Logging ── */
  const addLog = useCallback((message: string, type: TelemetryLog['type']) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      { id: Math.random().toString(36).substr(2, 9), time: timeStr, msg: message, type },
      ...prev,
    ].slice(0, 10));
  }, []);

  /* ── Session check on mount ── */
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user.tipo === 'operador') {
          setOperatorName(data.user.identificador);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error comprobando sesión:', err);
      }
    }
    checkSession();
  }, []);

  /* ── Logout handler ── */
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setIsAuthenticated(false);
        setOperatorName('');
      }
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  /* ── Initial boot logs ── */
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs([
      { id: '1', time: timeStr, msg: '🟢 Centro de Comando ONLINE — Sesión de operador autenticada.', type: 'success' },
      { id: '2', time: timeStr, msg: '📡 Suscripción Supabase Realtime activa en vc_vehiculos_patrulla.', type: 'info' },
      { id: '3', time: timeStr, msg: `🚨 ${INITIAL_EMERGENCIES.length} emergencias en cola de entrada.`, type: 'warn' },
      { id: '4', time: timeStr, msg: '🗺️ Sistema de radar vectorial inicializado.', type: 'info' },
    ]);
  }, []);

  /* ── Radar animation ── */
  useEffect(() => {
    const sweep = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 45);
    return () => clearInterval(sweep);
  }, []);

  /* ── Supabase Realtime subscription ── */
  useEffect(() => {
    const channel = supabase
      .channel('command-center-fleet')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vc_vehiculos_patrulla' },
        (payload) => {
          const updatedUnit = payload.new as any;
          setPatrullas((prev) =>
            prev.map((p) =>
              p.id === updatedUnit.id || p.placa === updatedUnit.placa_vehiculo
                ? {
                    ...p,
                    lat: Number(updatedUnit.ultima_ubicacion?.coordinates?.[1]) || p.lat,
                    lng: Number(updatedUnit.ultima_ubicacion?.coordinates?.[0]) || p.lng,
                    status: updatedUnit.estado_disponibilidad || p.status,
                  }
                : p
            )
          );
          addLog(`🛰️ [REALTIME] ${updatedUnit.placa_vehiculo || 'Unidad'} → ${updatedUnit.estado_disponibilidad}`, 'success');
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addLog]);

  /* ── Google Maps loader ── */
  useEffect(() => {
    if (mapMode !== 'google' || googleMapsLoaded) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if ((window as any).google?.maps) {
      setGoogleMapsLoaded(true);
      initMap();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => { setGoogleMapsLoaded(true); initMap(); };
    script.onerror = () => addLog('⚠️ Error cargando Google Maps API.', 'warn');
    document.head.appendChild(script);
  }, [mapMode]);

  /* ── Sync markers when patrullas update ── */
  useEffect(() => {
    if (!googleMapsLoaded || !mapInstanceRef.current) return;
    updateGoogleMarkers();
  }, [patrullas, googleMapsLoaded]);

  const initMap = () => {
    if (!googleMapRef.current || !(window as any).google) return;
    mapInstanceRef.current = new (window as any).google.maps.Map(googleMapRef.current, {
      center: { lat: CENTER_LAT, lng: CENTER_LON },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });
    updateGoogleMarkers();
    addLog('🗺️ Google Maps renderizado. Centrado en Cochabamba.', 'success');
  };

  const updateGoogleMarkers = () => {
    const google = (window as any).google;
    if (!google || !mapInstanceRef.current) return;
    patrullas.forEach((p) => {
      const position = { lat: p.lat, lng: p.lng };
      if (markersRef.current[p.id]) {
        markersRef.current[p.id].setPosition(position);
      } else {
        let fillColor = '#10b981';
        if (p.status === 'EN_CAMINO') fillColor = '#f59e0b';
        if (p.status === 'EN_INTERVENCION') fillColor = '#ef4444';
        markersRef.current[p.id] = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: p.placa,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor,
            fillOpacity: 0.9,
            strokeWeight: 1.5,
            strokeColor: '#ffffff',
          },
        });
      }
    });
  };

  /* ── Radar coordinate mapping ── */
  const mapGeoToRadar = (lat: number, lon: number) => {
    const scale = 8000;
    const x = 200 + (lon - CENTER_LON) * scale;
    const y = 200 - (lat - CENTER_LAT) * scale;
    return { x: Math.max(25, Math.min(375, x)), y: Math.max(25, Math.min(375, y)) };
  };

  /* ── Dispatch handler ── */
  const handleDispatchConfirm = (emergencyId: string, unitName: string) => {
    setEmergencias((prev) =>
      prev.map((em) =>
        em.id === emergencyId ? { ...em, estado: 'DESPACHADA' as const, unidadAsignada: unitName } : em
      )
    );

    const em = emergencias.find((e) => e.id === emergencyId);
    addLog(`🚔 [DESPACHO] ${unitName} asignada al caso ${em?.casoNum || emergencyId}. Zona: ${em?.zona || '—'}`, 'dispatch');
    addLog(`📤 Alerta enviada a terminal del oficial de ${unitName}.`, 'success');

    setDispatchTarget(null);
    setToast({ caso: em?.casoNum || emergencyId, unidad: unitName });

    // Remove dispatched emergency from inbox after 1.5s animation
    setTimeout(() => {
      setEmergencias((prev) => prev.filter((e) => e.id !== emergencyId));
    }, 1500);
  };

  /* ── Derived state ── */
  const pendingEmergencies = emergencias.filter((em) => em.estado === 'PENDIENTE');
  const dispatchedCount = emergencias.filter((em) => em.estado === 'DESPACHADA').length;

  /* ══════════════════════════════ RENDER ══════════════════════════════ */

  if (!isAuthenticated) {
    return (
      <OperatorLogin
        onLogin={(name) => {
          setOperatorName(name);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <Header />

      {/* Sub-header status bar */}
      <div className="bg-[#1e3a8a] px-4 sm:px-6 py-2 flex items-center justify-between text-white border-b border-blue-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Centro de Comando</span>
          </div>
          <span className="text-[9px] text-blue-300 font-mono hidden sm:inline">
            OPERADOR: {operatorName} · TURNO: DIURNO
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono">
          <span className="text-blue-200">
            <span className="text-white font-bold">{pendingEmergencies.length}</span> en cola
          </span>
          <span className="text-emerald-300">
            <span className="text-white font-bold">{dispatchedCount}</span> despachadas
          </span>
          <span className="text-blue-200 hidden sm:inline">
            {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-700 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider transition-colors ml-2"
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ═══════ LEFT PANEL: Emergency Inbox (35%) ═══════ */}
        <div className="w-full lg:w-[35%] flex flex-col border-r border-slate-200 bg-white overflow-hidden flex-shrink-0">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Bandeja de Emergencias
              </h2>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                Incidentes clasificados por IA — Triaje automatizado
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {pendingEmergencies.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                  {pendingEmergencies.length}
                </span>
              )}
            </div>
          </div>

          {/* Emergency list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pendingEmergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Bandeja Vacía</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Todas las emergencias han sido despachadas exitosamente.
                </p>
              </div>
            ) : (
              pendingEmergencies.map((em) => (
                <EmergencyCard
                  key={em.id}
                  emergency={em}
                  onDispatch={(e) => setDispatchTarget(e)}
                />
              ))
            )}
          </div>

          {/* Bottom stats bar */}
          <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[9px] font-mono text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Latencia IA: 0.4s
              </span>
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500" />
                Canal: Activo
              </span>
            </div>
            <a
              href="tel:110"
              className="bg-red-600 text-white px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" />
              110
            </a>
          </div>
        </div>

        {/* ═══════ RIGHT PANEL: Map + Fleet (65%) ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Map view toggle */}
          <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1e3a8a]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Mapa de Operaciones
              </span>
            </div>
            <div className="bg-slate-100 p-0.5 rounded-lg flex gap-0.5 border border-slate-200">
              <button
                onClick={() => setMapMode('radar')}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  mapMode === 'radar'
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Compass className="w-3 h-3" />
                Radar
              </button>
              <button
                onClick={() => setMapMode('google')}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  mapMode === 'google'
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3 h-3" />
                Google Maps
              </button>
            </div>
          </div>

          {/* Map canvas */}
          <div className="flex-1 relative overflow-hidden">
            {/* Google Maps view */}
            {mapMode === 'google' && (
              <div className="absolute inset-0">
                <div ref={googleMapRef} className="w-full h-full" />
                {!googleMapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#1e3a8a]" />
                      <span className="text-xs font-bold font-mono">Cargando satélites...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Radar vector view */}
            {mapMode === 'radar' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 overflow-hidden">
                {/* Subtle grid background */}
                <div className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                <svg viewBox="0 0 400 400" className="w-full max-w-[500px] h-auto text-slate-600 relative z-10">
                  {/* Grid circles */}
                  <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                  <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
                  <circle cx="200" cy="200" r="70" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                  <circle cx="200" cy="200" r="25" fill="none" stroke="currentColor" strokeWidth="1" />

                  {/* Cross hairs */}
                  <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.4" />
                  <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.4" />

                  {/* Sweep line */}
                  <line
                    x1="200" y1="200"
                    x2={200 + 170 * Math.cos((radarAngle * Math.PI) / 180)}
                    y2={200 + 170 * Math.sin((radarAngle * Math.PI) / 180)}
                    stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.7"
                  />

                  {/* Sweep trail (gradient arc) */}
                  <defs>
                    <radialGradient id="sweepGlow">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Emergency incident markers */}
                  {pendingEmergencies.map((em) => {
                    const { x, y } = mapGeoToRadar(em.coordenadas.lat, em.coordenadas.lng);
                    return (
                      <g key={em.id}>
                        <circle cx={x} cy={y} r="12" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping" style={{ animationDuration: '1.5s' }} />
                        <rect x={x - 4} y={y - 4} width="8" height="8" rx="1" fill="#ef4444" className="animate-pulse" />
                        <text x={x + 10} y={y - 3} fill="#ef4444" className="text-[7px] font-black font-mono">{em.tipo.slice(0, 12)}</text>
                        <text x={x + 10} y={y + 6} fill="#94a3b8" className="text-[6px] font-mono">{em.zona}</text>
                      </g>
                    );
                  })}

                  {/* Patrol markers */}
                  {patrullas.map((p) => {
                    const { x, y } = mapGeoToRadar(p.lat, p.lng);
                    let dotColor = '#10b981';
                    if (p.status === 'EN_CAMINO') dotColor = '#f59e0b';
                    if (p.status === 'EN_INTERVENCION') dotColor = '#ef4444';
                    return (
                      <g key={p.id}>
                        <circle cx={x} cy={y} r="8" fill="none" stroke={dotColor} strokeWidth="1" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                        <circle cx={x} cy={y} r="4" fill={dotColor} />
                        <text x={x + 8} y={y - 3} fill="#e2e8f0" className="text-[7px] font-black font-mono">{p.placa}</text>
                        <text x={x + 8} y={y + 6} fill="#64748b" className="text-[6px] font-mono">{p.status}</text>
                      </g>
                    );
                  })}

                  {/* Center label */}
                  <text x="200" y="192" fill="#94a3b8" textAnchor="middle" className="text-[6px] font-mono uppercase">Cochabamba</text>
                  <text x="200" y="214" fill="#64748b" textAnchor="middle" className="text-[5px] font-mono">-17.3895, -66.1568</text>
                </svg>

                {/* Floating legend */}
                <div className="absolute bottom-3 left-3 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2.5 border border-slate-700 flex flex-col gap-1 z-20">
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-slate-300 font-mono">LIBRE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-slate-300 font-mono">EN CAMINO</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-slate-300 font-mono">INTERVENCIÓN</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] border-t border-slate-700 pt-1 mt-0.5">
                    <span className="w-2 h-2 bg-red-500 rounded-sm" />
                    <span className="text-slate-300 font-mono">INCIDENTE</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fleet overlay panel (bottom-right) */}
            <div className="absolute bottom-3 right-3 z-20 w-64 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden hidden sm:block">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                  🚙 Flota Activa ({patrullas.length})
                </span>
              </div>
              <div className="p-2 space-y-1.5 max-h-36 overflow-y-auto">
                {patrullas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        p.status === 'LIBRE' ? 'bg-emerald-500' :
                        p.status === 'EN_CAMINO' ? 'bg-amber-500 animate-pulse' :
                        'bg-rose-500'
                      }`} />
                      <span className="font-bold text-slate-700">{p.placa}</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400">{p.cuadrante}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Telemetry log strip */}
          <div className="px-4 py-2 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                📡 Bitácora Operacional
              </span>
              <span className="text-[8px] text-emerald-600 font-mono animate-pulse font-bold">OBSERVING</span>
            </div>
            <div className="flex flex-col gap-0.5 max-h-16 overflow-y-auto text-[9px] font-mono text-slate-500">
              {logs.slice(0, 4).map((log) => (
                <div key={log.id} className="leading-tight truncate">
                  <span className="text-slate-400">[{log.time}]</span>{' '}
                  <span className={
                    log.type === 'success' ? 'text-emerald-600 font-bold' :
                    log.type === 'warn' ? 'text-amber-600 font-bold' :
                    log.type === 'dispatch' ? 'text-blue-600 font-bold' :
                    ''
                  }>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dispatch Modal ── */}
      {dispatchTarget && (
        <DispatchModal
          emergency={dispatchTarget}
          units={EPI_UNITS}
          onConfirm={handleDispatchConfirm}
          onClose={() => setDispatchTarget(null)}
        />
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <DispatchedToast
          caso={toast.caso}
          unidad={toast.unidad}
          onDone={() => setToast(null)}
        />
      )}

      {/* ── CSS Animations ── */}
      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
