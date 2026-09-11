import React from 'react';
import { MobilityMode, RouteInfo } from '../types/story';

interface MobilitySelectorProps {
  mode?: MobilityMode;
  onChange: (mode: MobilityMode) => void;
  routeInfo?: RouteInfo;
  nextSlideIndex?: number;
  loading?: boolean;
}

export const MobilitySelector: React.FC<MobilitySelectorProps> = ({
  mode = 'walking',
  onChange,
  routeInfo,
  nextSlideIndex,
  loading = false,
}) => {
  const options: { id: MobilityMode; label: string; icon: string; desc: string }[] = [
    { id: 'walking', label: 'À pied', icon: '🚶', desc: 'Randonnée, circuit piéton' },
    { id: 'cycling', label: 'À vélo', icon: '🚲', desc: 'Pistes cyclables, voies vertes' },
    { id: 'transit_driving', label: 'Transports / Route', icon: '🚌', desc: 'Bus, navette, transfert' },
  ];

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  };

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>
          🚦 Mobilité vers l'étape suivante {nextSlideIndex !== undefined ? `(#${nextSlideIndex + 1})` : ''}
        </span>
        {loading && (
          <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>
            Calcul de l'itinéraire en cours... ⏳
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
        {options.map((opt) => {
          const isSelected = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem 0.3rem',
                borderRadius: '8px',
                border: `1.5px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
              <strong style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{opt.label}</strong>
            </button>
          );
        })}
      </div>

      {routeInfo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '0.35rem 0.6rem',
            fontSize: '0.74rem',
            color: '#1e40af',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            📏 <strong>{routeInfo.distanceKm} km</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ⏱️ Durée estimée : <strong>{formatDuration(routeInfo.durationMin)}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
