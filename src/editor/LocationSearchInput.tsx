import React, { useState, useEffect, useRef } from 'react';
import { searchPlacesNominatim, NominatimPlace } from '../utils/geocodingService';
import { StorySlideLocation } from '../types/story';

interface LocationSearchInputProps {
  onLocationSelected: (location: StorySlideLocation, placeName: string) => void;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  onLocationSelected,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fermer la liste au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const places = await searchPlacesNominatim(val);
      setResults(places);
      setLoading(false);
      setIsOpen(places.length > 0);
    }, 350);
  };

  const handleSelectPlace = (place: NominatimPlace) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    
    // Déduire un zoom pertinent selon le type
    let zoom = 15;
    if (place.type === 'city' || place.type === 'administrative') zoom = 12;
    if (place.type === 'country') zoom = 6;
    if (place.type === 'attraction' || place.type === 'monument') zoom = 16;

    const shortName = place.name || place.display_name.split(',')[0];
    onLocationSelected({ lat, lon, zoom }, shortName);
    setQuery(shortName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '10px',
            fontSize: '1rem',
            color: '#64748b',
            pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Rechercher un lieu (ex: Tour Eiffel, Taormine, Port de Nice...)"
          style={{
            width: '100%',
            padding: '0.6rem 2.2rem 0.6rem 2.4rem',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.86rem',
            fontWeight: 500,
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            transition: 'border-color 0.2s',
          }}
        />
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              fontSize: '0.8rem',
              color: '#3b82f6',
              animation: 'spin 1s linear infinite',
            }}
          >
            ⏳
          </span>
        )}
      </div>

      {/* Menu déroulant des suggestions Nominatim */}
      {isOpen && results.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 100,
            margin: 0,
            padding: '0.35rem',
            listStyle: 'none',
          }}
        >
          {results.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSelectPlace(place)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: '#1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                borderBottom: '1px solid #f1f5f9',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem' }}>📍</span>
                <strong style={{ color: '#1e3a8a', fontSize: '0.84rem' }}>
                  {place.name || place.display_name.split(',')[0]}
                </strong>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingLeft: '1.25rem',
                }}
              >
                {place.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
