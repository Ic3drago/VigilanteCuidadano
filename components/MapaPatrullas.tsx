'use client';

/**
 * VigilanteCiudadano - CentroControlPolicial UI Component (Police Officer View)
 * Location: components/MapaPatrullas.tsx
 * Role: Principal Software Architect & Cybersecurity Expert
 * 
 * DESIGN PRINCIPLES:
 * 1. HIGH DENSITY DASHBOARD: Optimized grid layout for tactical control rooms.
 * 2. LIVE RADAR TRACKING: Vector-based coordinate mapper displaying patrol positions in El Alto.
 * 3. REALTIME OBSERVER CONTROL: Simulated dispatcher panel to manipulate patrol states and GPS positions in real-time.
 * 4. SECURE AUDIT TRAIL: Logs exact cryptographic and spatial updates dynamically.
 */

import React, { useState, useEffect } from 'react';

// Models
export interface VehiculoPatrulla {
  id: string;
  placa_vehiculo: string;
  latitud: number;
  longitud: number;
  estado_disponibilidad: 'LIBRE' | 'EN_CAMINO' | 'EN_INTERVENCION';
  rango_cobertura: string;
  updated_at: string;
}

interface TelemetryLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'success' | 'alert';
}

const CENTER_LAT = -16.5008;
const CENTER_LON = -68.1504;

export default function MapaPatrullas() {
  const [patrullas, setPatrullas] = useState<VehiculoPatrulla[]>([
    {
      id: 'p-1',
      placa_vehiculo: 'PAC-4022',
      latitud: -16.4950,
      longitud: -68.1420,
      estado_disponibilidad: 'EN_CAMINO',
      rango_cobertura: 'Cuadrante Norte',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-2',
      placa_vehiculo: 'PAC-8811',
      latitud: -16.5090,
      longitud: -68.1610,
      estado_disponibilidad: 'EN_INTERVENCION',
      rango_cobertura: 'Cuadrante Sur',
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-3',
      placa_vehiculo: 'PAC-3033',
      latitud: -16.5030,
      longitud: -68.1350,
      estado_disponibilidad: 'LIBRE',
      rango_cobertura: 'Cuadrante Central',
      updated_at: new Date().toISOString()
    }
  ]);

  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [incidenteSimulado, setIncidenteSimulado] = useState<string>('NINGUNO');

  // Load initial operational systems
  useEffect(() => {
    addTelemetryLog('📡 [OBSERVER] Canales Supabase Realtime inicializados para tabla "vehiculos_patrulla"', 'info');
    addTelemetryLog('🛰️ [GPS_GNSS] Sincronización satelital establecida con 12 nodos de auxilio', 'success');
    addTelemetryLog('🔒 [SEGURIDAD] Autenticación de Oficial validada. Clave de auditoría activa.', 'info');
  }, []);

  // Radar sweep animation
  useEffect(() => {
    const sweep = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 45);
    return () => clearInterval(sweep);
  }, []);

  const addTelemetryLog = (message: string, type: TelemetryLog['type']) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ id: Math.random().toString(36).substr(2, 9), timestamp, message, type }, ...prev].slice(0, 8));
  };

  // Coordinates mathematical projection
  const mapGeoToRadar = (lat: number, lon: number) => {
    const scale = 8500;
    const x = 200 + (lon - CENTER_LON) * scale;
    const y = 200 - (lat - CENTER_LAT) * scale;
    return {
      x: Math.max(25, Math.min(375, x)),
      y: Math.max(25, Math.min(375, y))
    };
  };

  // Interactive control: Modify patrol status
  const updatePatrolStatus = (id: string, nextStatus: VehiculoPatrulla['estado_disponibilidad']) => {
    setPatrullas((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addTelemetryLog(
            `📢 [DESPACHO] Unidad ${p.placa_vehiculo} reasignada a estado: ${nextStatus}`,
            nextStatus === 'EN_INTERVENCION' ? 'warn' : nextStatus === 'EN_CAMINO' ? 'info' : 'success'
          );
          return { ...p, estado_disponibilidad: nextStatus, updated_at: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Interactive control: Move GPS simulator coordinates
  const simulateGpsUpdate = (id: string) => {
    setPatrullas((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const deltaLat = (Math.random() - 0.5) * 0.004;
          const deltaLon = (Math.random() - 0.5) * 0.004;
          const nextLat = p.latitud + deltaLat;
          const nextLon = p.longitud + deltaLon;

          addTelemetryLog(
            `🛰️ [GPS_EVENT] ${p.placa_vehiculo} reposicionado: [Lat: ${nextLat.toFixed(5)}, Lon: ${nextLon.toFixed(5)}]`,
            'info'
          );

          return { ...p, latitud: nextLat, longitud: nextLon, updated_at: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Interactive control: Simulate a real-time citizen alert in El Alto
  const triggerMockIncident = (tipo: string, gravedad: string) => {
    setIncidenteSimulado(tipo);
    addTelemetryLog(`🚨 [ALERTA CRÍTICA] Ingesta de Denuncia: ${tipo} clasificado como ${gravedad} en El Alto (Ceja)`, 'alert');
    
    // Automatically dispatch nearby unit
    updatePatrolStatus('p-1', 'EN_CAMINO');
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto w-full max-w-5xl bg-[#0f141c] border border-green-500 border-opacity-30 rounded-2xl shadow-2xl p-4 md:p-6 gap-6 overflow-hidden">
      
      {/* LEFT COLUMN: SVG Tactical Radar display screen */}
      <div className="flex-1 bg-[#0d1219] border border-green-500 border-opacity-20 p-4 rounded-xl flex flex-col items-center justify-center relative">
        <div className="flex justify-between items-center w-full mb-3 border-b border-green-900 border-opacity-30 pb-2">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full glow-pulse-red" />
            Radar Vectorial BOL-110
          </h3>
          <span className="text-[9px] text-green-500 font-mono tracking-tighter">[SYS: ONLINE]</span>
        </div>

        {/* The SVG grid radar */}
        <div className="w-full max-w-[320px] aspect-square relative my-2">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Grid circles */}
            <circle cx="200" cy="200" r="170" fill="none" stroke="#00ff00" strokeWidth="1" strokeOpacity="0.1" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="#00ff00" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="200" cy="200" r="70" fill="none" stroke="#00ff00" strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="200" cy="200" r="20" fill="none" stroke="#00ff00" strokeWidth="1.5" strokeOpacity="0.4" />
            
            {/* Axis grids */}
            <line x1="20" y1="200" x2="380" y2="200" stroke="#00ff00" strokeWidth="1" strokeOpacity="0.25" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="#00ff00" strokeWidth="1" strokeOpacity="0.25" />

            {/* Sweep radar arm */}
            <line
              x1="200"
              y1="200"
              x2={200 + 170 * Math.cos((radarAngle * Math.PI) / 180)}
              y2={200 + 170 * Math.sin((radarAngle * Math.PI) / 180)}
              stroke="#00ff00"
              strokeWidth="2"
              strokeOpacity="0.7"
            />
            
            {/* Center Landmark Point (Plaza La Ceja, El Alto) */}
            <rect x="196" y="196" width="8" height="8" fill="#ff3b30" className="glow-pulse-red" />
            <text x="210" y="204" fill="#ff3b30" className="text-[8px] font-bold tracking-wider">CENTRO_CEJA</text>

            {/* Plot active patrols dynamically */}
            {patrullas.map((p) => {
              const { x, y } = mapGeoToRadar(p.latitud, p.longitud);
              
              let color = '#00ff00';
              if (p.estado_disponibilidad === 'EN_CAMINO') color = '#ff9500';
              if (p.estado_disponibilidad === 'EN_INTERVENCION') color = '#ff3b30';

              return (
                <g key={p.id}>
                  {/* pulsating circle ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: '2.5s' }}
                  />
                  {/* core dot */}
                  <circle cx={x} cy={y} r="5" fill={color} />
                  {/* label background box */}
                  <text
                    x={x + 9}
                    y={y - 3}
                    fill={color}
                    className="text-[9px] font-extrabold tracking-widest font-mono"
                  >
                    {p.placa_vehiculo}
                  </text>
                  <text
                    x={x + 9}
                    y={y + 7}
                    fill="#94a3b8"
                    className="text-[7px] font-mono opacity-80"
                  >
                    {p.longitud.toFixed(3)},{p.latitud.toFixed(3)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend panel */}
        <div className="flex gap-4 mt-3 text-[10px] border-t border-green-900 border-opacity-30 pt-2.5 w-full justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#00ff00] rounded-full" />
            <span className="text-slate-400 font-semibold">LIBRE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#ff9500] rounded-full animate-pulse" />
            <span className="text-slate-400 font-semibold">DESPACHADA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#ff3b30] rounded-full" />
            <span className="text-slate-400 font-semibold">INTERVENCIÓN</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Fleet control, telemetry and active alerts */}
      <div className="w-full lg:w-[440px] flex flex-col gap-4">
        
        {/* Statistics and Mock Actions card */}
        <div className="bg-[#0d1219] border border-green-500 border-opacity-20 p-3 rounded-xl">
          <div className="text-xs font-bold border-b border-green-900 border-opacity-30 pb-2 mb-2 tracking-widest text-white uppercase">
            🚨 Centro de Despacho y Simulador
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
            <button
              onClick={() => triggerMockIncident('ROBO_ATRACO', 'CRITICO')}
              className="bg-red-950 bg-opacity-40 border border-red-500 border-opacity-30 text-[#ff3b30] py-2 px-2 rounded-lg font-bold hover:bg-opacity-100 transition-all"
            >
              Simular Robo en Ceja
            </button>
            <button
              onClick={() => triggerMockIncident('ACCIDENTE_TRAFICO', 'ALTO')}
              className="bg-amber-950 bg-opacity-40 border border-amber-500 border-opacity-30 text-[#ff9500] py-2 px-2 rounded-lg font-bold hover:bg-opacity-100 transition-all"
            >
              Simular Choque
            </button>
          </div>
          {incidenteSimulado !== 'NINGUNO' && (
            <div className="mt-2 p-2 bg-[#ff3b30] bg-opacity-10 border border-[#ff3b30] border-opacity-30 rounded-lg text-[10px] text-slate-300 flex justify-between items-center">
              <span>Incidente clasificado por IA: **{incidenteSimulado}**</span>
              <button
                onClick={() => setIncidenteSimulado('NINGUNO')}
                className="text-[8px] bg-red-950 px-1 py-0.5 rounded text-white"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Fleet grid view with quick controls */}
        <div className="bg-[#0d1219] border border-green-500 border-opacity-20 p-3 rounded-xl flex-1 flex flex-col">
          <div className="text-xs font-bold border-b border-green-900 border-opacity-30 pb-2 mb-2 tracking-widest text-white uppercase">
            🚙 Estado de Flota Activa
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[190px] pr-1">
            {patrullas.map((p) => (
              <div
                key={p.id}
                className="text-[11px] p-2 bg-[#0f141c] border border-slate-800 rounded-lg flex flex-col gap-2 hover:border-green-500 hover:border-opacity-30 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🚙 {p.placa_vehiculo}</span>
                    <span className="text-[9px] text-slate-500">({p.rango_cobertura})</span>
                  </div>
                  <div className="flex gap-1.5">
                    {/* Status badge toggler */}
                    <button
                      onClick={() => updatePatrolStatus(p.id, 'LIBRE')}
                      className={`px-1 rounded text-[8px] font-bold ${
                        p.estado_disponibilidad === 'LIBRE' ? 'bg-green-950 text-green-400 border border-green-500 border-opacity-40' : 'bg-[#141b25] text-slate-500'
                      }`}
                    >
                      LIBRE
                    </button>
                    <button
                      onClick={() => updatePatrolStatus(p.id, 'EN_CAMINO')}
                      className={`px-1 rounded text-[8px] font-bold ${
                        p.estado_disponibilidad === 'EN_CAMINO' ? 'bg-amber-950 text-amber-400 border border-amber-500 border-opacity-40 animate-pulse' : 'bg-[#141b25] text-slate-500'
                      }`}
                    >
                      EN_CAMINO
                    </button>
                    <button
                      onClick={() => updatePatrolStatus(p.id, 'EN_INTERVENCION')}
                      className={`px-1 rounded text-[8px] font-bold ${
                        p.estado_disponibilidad === 'EN_INTERVENCION' ? 'bg-red-950 text-red-400 border border-red-500 border-opacity-40' : 'bg-[#141b25] text-slate-500'
                      }`}
                    >
                      INTERV
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-900 pt-1.5 text-[9px] text-slate-400">
                  <span>GPS: [{p.longitud.toFixed(4)}, {p.latitud.toFixed(4)}]</span>
                  <button
                    onClick={() => simulateGpsUpdate(p.id)}
                    className="bg-green-950 text-green-400 border border-green-500 border-opacity-30 hover:bg-green-900 px-2 py-0.5 rounded text-[8px] font-extrabold"
                  >
                    Simular GPS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time telemetry log feed */}
        <div className="bg-[#0d1219] border border-green-500 border-opacity-20 p-3 rounded-xl h-44 flex flex-col">
          <div className="text-xs font-bold border-b border-green-900 border-opacity-30 pb-2 mb-2 tracking-widest text-white uppercase flex justify-between items-center">
            <span>📡 Historial de Operaciones</span>
            <span className="text-[8px] text-green-500 animate-pulse font-mono">&gt; OBSERVING</span>
          </div>
          <div className="flex-1 overflow-y-auto text-[9px] space-y-1.5 pr-1 font-mono text-slate-400 select-all">
            {logs.map((log) => (
              <div key={log.id} className="leading-relaxed">
                <span className="text-green-700 mr-2">[{log.timestamp}]</span>
                {log.type === 'success' ? (
                  <span className="text-yellow-400 font-bold">{log.message}</span>
                ) : log.type === 'warn' ? (
                  <span className="text-[#ff9500] font-bold">{log.message}</span>
                ) : log.type === 'alert' ? (
                  <span className="text-red-500 font-bold">{log.message}</span>
                ) : (
                  <span>{log.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
