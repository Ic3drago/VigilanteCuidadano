'use client';

/**
 * VigilanteCiudadano - Terminal Oficial Táctica (Refactored with Login + Route Map)
 * Location: app/oficial/page.tsx
 * Role: Frontend Developer & GIS Expert
 *
 * ARCHITECTURE:
 * 1. TACTICAL LOGIN SCREEN: Full-screen auth gate with plate number + tactical PIN.
 * 2. DISPATCH VIEW: Dark tactical console showing dispatched emergency data.
 * 3. ROUTE MAP: Google Maps Polyline connecting patrol position to incident location,
 *    with fallback SVG tactical radar showing dashed route line.
 * 4. QUICK ACTIONS: En Ruta, Llegada al Lugar, Solicitar Refuerzos (Código 3).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Radio, MapPin, Compass, AlertTriangle, CheckCircle, Navigation,
  ShieldAlert, Timer, Lock, LogIn, Eye, EyeOff, Layers, RefreshCw
} from 'lucide-react';
import Header from '../../components/Header';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

/* ─────────────────────────────── TYPES ─────────────────────────────── */

interface Incident {
  caso: string;
  tipo: string;
  gravedad: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  ubicacion: string;
  coordenadas: { lat: number; lng: number };
  etaObjetivo: number;
  descripcion: string;
}

/* ─────────────────────────── STATIC DATA ─────────────────────────── */

const INCIDENT: Incident = {
  caso: 'CASO-VC-4912',
  tipo: 'ROBO EN PROGRESO',
  gravedad: 'CRITICO',
  ubicacion: 'El Prado, Av. Ballivián (Cochabamba)',
  coordenadas: { lat: -17.3835, lng: -66.1560 },
  etaObjetivo: 4,
  descripcion:
    'Alerta AI: Dos sospechosos armados reportados asaltando transeúntes en la Av. Ballivián. Cifrado Z-K activo, GPS fijado en el cuadrante de El Prado.',
};

// Simulated patrol starting position
const PATROL_COORDS = { lat: -17.3895, lng: -66.1568 };

/* ═══════════════════════ LOGIN COMPONENT ═══════════════════════ */

function TacticalLogin({ onLogin }: { onLogin: (placa: string) => void }) {
  const [placa, setPlaca] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !pin.trim()) {
      setError('Complete todos los campos obligatorios.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'oficial', identificador: placa, pin })
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-[0.08] pointer-events-none">
        <defs>
          <pattern id="loginGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="25" cy="25" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#loginGrid)" />
      </svg>

      {/* Login card */}
      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo & branding */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-slate-900 border-2 border-slate-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-950/30">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-wider">
              Terminal Táctica
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Policía Boliviana · Sistema Integrado BOL-110
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-blue-400" />
              Autenticación de Unidad de Patrulla
            </span>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-xl p-2.5 text-[10px] text-red-400 font-bold text-center flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          {/* Plate number */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              Número de Placa Vehicular
            </label>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="Ej: PAC-402"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all uppercase"
            />
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              PIN Táctico
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-60 border border-blue-500"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Autenticando Unidad...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión Táctica</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[8px] text-slate-600 text-center font-mono uppercase tracking-wider">
          Canal cifrado TLS 1.3 · Sesiones auditadas · Acceso restringido
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function TerminalOficial() {
  /* ── Auth state ── */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [placaUnidad, setPlacaUnidad] = useState('PAC-402');

  /* ── Operational state ── */
  const [patrolState, setPatrolState] = useState<'ALERTA' | 'EN_RUTA' | 'INTERVENCION'>('ALERTA');
  const [coords, setCoords] = useState(PATROL_COORDS);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  /* ── Chronometer ── */
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [cronActive, setCronActive] = useState(false);

  /* ── Map state ── */
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  /* ── Logging ── */
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTelemetryLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 5));
  };

  /* ── Session check on mount ── */
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user.tipo === 'oficial') {
          setPlacaUnidad(data.user.identificador);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error comprobando sesión:', err);
      }
    }
    checkSession();
  }, []);

  /* ── Login handler ── */
  const handleLogin = (placa: string) => {
    setPlacaUnidad(placa);
    setIsAuthenticated(true);
  };

  /* ── Logout handler ── */
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setIsAuthenticated(false);
        setPlacaUnidad('');
      }
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  /* ── Boot logs after auth ── */
  useEffect(() => {
    if (!isAuthenticated) return;

    addLog(`Terminal Táctica iniciada. Unidad: ${placaUnidad}.`);
    addLog('Señal satelital GNSS: Fuerte (14 satélites).');
    addLog('Canal de cifrado BOL-110 establecido.');

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          addLog(`GPS fijado: [${pos.coords.longitude.toFixed(4)}, ${pos.coords.latitude.toFixed(4)}]`);
        },
        () => {
          addLog('GPS por defecto: El Alto (Plaza Tejada Sorzano).');
        }
      );
    }
  }, [isAuthenticated]);

  /* ── Chronometer ── */
  useEffect(() => {
    let interval: any = null;
    if (cronActive) {
      interval = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cronActive]);

  /* ── Directions Route Calculator (React useEffect) ── */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !coords || !INCIDENT.coordenadas || patrolState !== 'EN_RUTA') return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: coords,
        destination: INCIDENT.coordenadas,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
          if (result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            setDistance(leg.distance?.text || '');
            setDuration(leg.duration?.text || '');
            addLog(`Ruta trazada. Distancia: ${leg.distance?.text}. ETA Real: ${leg.duration?.text}.`);
          }
        }
      }
    );
  }, [coords, INCIDENT.coordenadas, patrolState]);

  /* ── Formatters ── */
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /* ── Action handlers ── */
  const handleAceptarDespacho = () => {
    setPatrolState('EN_RUTA');
    addLog(`Despacho aceptado. ${placaUnidad} en ruta a ${INCIDENT.ubicacion}.`);
  };

  const handleLlegadaLugar = () => {
    setPatrolState('INTERVENCION');
    setSecondsElapsed(0);
    setCronActive(true);
    addLog(`${placaUnidad} reporta LLEGADA AL LUGAR.`);
    addLog('Cronómetro de intervención táctica iniciado.');
  };

  const handleSolicitarRefuerzos = () => {
    addLog('🚨 [CÓDIGO 3] ALERTA DE REFUERZOS enviada. Coordinando unidad PAC-8811.');
  };

  const handleFinalizarIntervencion = () => {
    setCronActive(false);
    setPatrolState('ALERTA');
    setSecondsElapsed(0);
    setDirections(null);
    setDistance('');
    setDuration('');
    addLog('Intervención finalizada. Unidad disponible.');
  };

  /* ═════════════════════ RENDER ═════════════════════ */

  // LOGIN GATE
  if (!isAuthenticated) {
    return <TacticalLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">

      {/* Tactical grid background */}
      <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-[0.08] pointer-events-none">
        <defs>
          <pattern id="tacticalGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="30" cy="30" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tacticalGrid)" />
      </svg>

      <Header />

      <main className="max-w-md mx-auto w-full px-4 pt-4 pb-6 flex-1 flex flex-col gap-3 relative z-10 overflow-y-auto">

        {/* ── Unit header ── */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal Táctica</h2>
              <span className="text-sm font-black text-white font-mono flex items-center gap-1.5 mt-0.5">
                🚙 {placaUnidad}
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900 tracking-wider">
                  EN SERVICIO
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[7px] text-slate-500 font-mono block">GNSS</span>
              <span className="text-[9px] text-blue-400 font-bold font-mono">3D FIX</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-red-950/20"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── Status banner ── */}
        {patrolState === 'ALERTA' && (
          <div className="bg-red-950/40 border-2 border-red-500 rounded-2xl p-3.5 text-center space-y-2 animate-pulse shadow-lg shadow-red-950/30">
            <div className="flex items-center justify-center gap-2 text-red-500 font-black tracking-widest text-xs uppercase">
              <ShieldAlert className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>NUEVO INCIDENTE ASIGNADO</span>
            </div>
            <p className="text-[10px] text-slate-300">
              Despachador del Centro de Comando ha enrutado una emergencia de alta prioridad a su cuadrante.
            </p>
          </div>
        )}

        {patrolState === 'EN_RUTA' && (
          <div className="bg-blue-950/40 border border-blue-500/80 rounded-2xl p-3.5 text-center space-y-1.5 text-blue-400 shadow-md">
            <div className="flex items-center justify-center gap-2 font-black tracking-widest text-xs uppercase">
              <Navigation className="w-4 h-4 animate-bounce" />
              <span>DESPLAZAMIENTO EN CURSO</span>
            </div>
            <p className="text-[9px] text-slate-300 font-mono">
              {placaUnidad} en ruta táctica activa hacia {INCIDENT.ubicacion}.
            </p>
            {duration ? (
              <div className="bg-slate-950/80 border border-blue-900/60 rounded-xl p-2.5 mt-1.5 flex justify-between items-center text-left">
                <div>
                  <span className="text-[7px] text-slate-500 block uppercase font-bold">Tiempo estimado (Tráfico)</span>
                  <span className="text-xs font-black text-blue-400 font-mono animate-pulse">{duration}</span>
                </div>
                <div className="text-right">
                  <span className="text-[7px] text-slate-500 block uppercase font-bold">Distancia terrestre</span>
                  <span className="text-xs font-black text-slate-300 font-mono">{distance}</span>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-slate-400 mt-1">
                Calculando ruta y tráfico en tiempo real...
              </p>
            )}
          </div>
        )}

        {patrolState === 'INTERVENCION' && (
          <div className="bg-emerald-950/40 border border-emerald-500 rounded-2xl p-3.5 text-center space-y-3 shadow-lg shadow-emerald-950/25">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-black tracking-widest text-xs uppercase">
              <Timer className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
              <span>INTERVENCIÓN EN CURSO</span>
            </div>
            <div className="text-4xl font-extrabold text-white font-mono tracking-tight bg-slate-950 border border-slate-800 py-3 rounded-xl max-w-[200px] mx-auto shadow-inner">
              {formatTime(secondsElapsed)}
            </div>
            <p className="text-[9px] text-slate-300">
              Canales de voz encriptados abiertos con central.
            </p>
          </div>
        )}

        {/* ── Dispatch data feed ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex justify-between items-center font-mono">
            <span>Metadatos del Despacho</span>
            <span className="text-[8px] text-red-500 font-black uppercase bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900">
              {INCIDENT.gravedad}
            </span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono text-slate-300">
            <div>
              <span className="text-[8px] text-slate-500 block font-sans font-bold uppercase">TIPO</span>
              <span className="text-white font-black text-[11px]">{INCIDENT.tipo}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 block font-sans font-bold uppercase">PRIORIDAD</span>
              <span className="text-red-500 font-black">{INCIDENT.gravedad}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 block font-sans font-bold uppercase">ETA OBJETIVO</span>
              <span className="text-amber-500 font-bold">{INCIDENT.etaObjetivo} min</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 block font-sans font-bold uppercase">COORDS DESTINO</span>
              <span className="text-slate-400 text-[10px]">[{INCIDENT.coordenadas.lng.toFixed(4)}, {INCIDENT.coordenadas.lat.toFixed(4)}]</span>
            </div>
            <div className="col-span-2 border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-sans leading-relaxed">
              <strong className="text-slate-300">Detalles:</strong> {INCIDENT.descripcion}
            </div>
          </div>
        </div>

        {/* ── Route Map (hidden during intervention) ── */}
        {patrolState !== 'INTERVENCION' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative animate-fadeIn">
            {/* Map header */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-800 shadow">
              <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 animate-pulse" />
                Ruta Satelital Google Maps
              </span>
            </div>

            {/* Google Maps view */}
            <div className="w-full h-[50vh] md:h-[70vh] relative">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={coords}
                  zoom={14}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [
                      { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
                      { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
                      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
                      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
                      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
                    ],
                  }}
                >
                  {/* Marcador de la Patrulla (inicial antes del trazado) */}
                  {!directions && (
                    <Marker
                      position={coords}
                      title={placaUnidad}
                      icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    />
                  )}

                  {/* Marcador del Incidente (inicial antes del trazado) */}
                  {!directions && (
                    <Marker
                      position={INCIDENT.coordenadas}
                      title="INCIDENTE"
                      icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    />
                  )}

                  {/* Renderizador de rutas oficiales (Directions Renderer) */}
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: '#2563eb',
                          strokeWeight: 5,
                        },
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-[9px] font-bold font-mono">Cargando satélites...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Map legend */}
            <div className="px-3 pb-2 pt-2 flex items-center justify-between text-[8px] font-mono text-slate-500 border-t border-slate-900 bg-slate-950/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Patrulla</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm" /> Incidente</span>
              </div>
              <span>GNSS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            </div>
          </div>
        ) : (
          /* Tactical checklist during intervention */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-3">
            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-800 pb-1.5 font-mono">
              Lista de Comprobación Operacional
            </h4>
            <div className="space-y-2 text-xs text-slate-300 pl-1">
              {[
                { label: 'Contacto con central confirmado.', checked: true },
                { label: 'Geolocalización auditada transmitida.', checked: true },
                { label: 'Sujetos identificados / pacificados.', checked: false },
                { label: 'Formulario Z-K de cierre de acta listo.', checked: false },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="rounded border-slate-700 text-blue-600 bg-slate-950 focus:ring-0 w-4 h-4"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Action Buttons ── */}
        <div className="space-y-2.5">
          {patrolState === 'ALERTA' && (
            <button
              onClick={handleAceptarDespacho}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-500"
            >
              <Navigation className="w-4 h-4" />
              <span>Aceptar Despacho / En Ruta</span>
            </button>
          )}

          {patrolState === 'EN_RUTA' && (
            <button
              onClick={handleLlegadaLugar}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-emerald-500"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Llegada al Lugar</span>
            </button>
          )}

          {patrolState === 'INTERVENCION' && (
            <button
              onClick={handleFinalizarIntervencion}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg border border-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Finalizar Intervención Táctica</span>
            </button>
          )}

          {/* Solicitar Refuerzos — Código 3 (always visible, prominent red) */}
          <button
            onClick={handleSolicitarRefuerzos}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-red-500 shadow-lg shadow-red-900/20"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Solicitar Refuerzos (Código 3)</span>
          </button>
        </div>

        {/* ── Telemetry log ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-1.5 text-[9px] font-mono text-slate-500">
          <div className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-800 pb-1 flex items-center gap-1.5 font-sans">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Consola GNSS</span>
            <span className="ml-auto text-emerald-400 text-[7px]">● ONLINE</span>
          </div>
          {telemetryLogs.map((log, idx) => (
            <div key={idx} className="truncate leading-tight">{log}</div>
          ))}
        </div>

      </main>
    </div>
  );
}
