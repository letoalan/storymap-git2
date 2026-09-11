import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { registerPMTilesProtocol, createPMTilesStyle, MapStyleType } from '../utils/pmtilesProtocol';
import { StorySlideLocation } from '../types/story';

interface MapPointPickerProps {
  location: StorySlideLocation;
  onChange: (newLocation: StorySlideLocation) => void;
  mapStyle?: MapStyleType;
  tilesBaseUrl?: string;
}

export const MapPointPicker: React.FC<MapPointPickerProps> = ({
  location,
  onChange,
  mapStyle = 'base',
  tilesBaseUrl,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    registerPMTilesProtocol();

    if (!mapContainerRef.current) return;

    const styleSpec = createPMTilesStyle(mapStyle, tilesBaseUrl);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleSpec,
      center: [location.lon, location.lat],
      zoom: location.zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Marqueur sélectionnable et déplaçable
    const marker = new maplibregl.Marker({
      draggable: true,
      color: '#e53e3e',
    })
      .setLngLat([location.lon, location.lat])
      .addTo(map);

    markerRef.current = marker;

    // Événement au clic sur la carte
    map.on('click', (e) => {
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lon = Number(e.lngLat.lng.toFixed(5));
      const zoom = Math.round(map.getZoom());
      marker.setLngLat([lon, lat]);
      onChange({ lat, lon, zoom });
    });

    // Événement à la fin du glisser-déposer du marqueur
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const lat = Number(lngLat.lat.toFixed(5));
      const lon = Number(lngLat.lng.toFixed(5));
      const zoom = Math.round(map.getZoom());
      onChange({ lat, lon, zoom });
    });

    // Synchronisation du niveau de zoom lors du zoom utilisateur
    map.on('zoomend', () => {
      const zoom = Math.round(map.getZoom());
      const lngLat = marker.getLngLat();
      onChange({
        lat: Number(lngLat.lat.toFixed(5)),
        lon: Number(lngLat.lng.toFixed(5)),
        zoom,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [mapStyle, tilesBaseUrl]);

  // Recadrage si la localisation change depuis le formulaire externe
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([location.lon, location.lat]);
      mapRef.current.easeTo({
        center: [location.lon, location.lat],
        zoom: location.zoom,
      });
    }
  }, [location.lat, location.lon, location.zoom]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '280px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #cbd5e0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>Raccourcis :</span>
        <button
          type="button"
          onClick={() => onChange({ lat: 37.8524, lon: 15.2882, zoom: 16 })}
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            background: '#edf2f7',
            cursor: 'pointer',
          }}
        >
          📍 Taormine
        </button>
        <button
          type="button"
          onClick={() => onChange({ lat: 45.8756, lon: 0.9022, zoom: 14 })}
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            background: '#edf2f7',
            cursor: 'pointer',
          }}
        >
          📍 Saint-Junien (Éluard)
        </button>
        <button
          type="button"
          onClick={() => onChange({ lat: 48.8566, lon: 2.3522, zoom: 12 })}
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            background: '#edf2f7',
            cursor: 'pointer',
          }}
        >
          📍 Paris
        </button>
        <button
          type="button"
          onClick={() => onChange({ lat: 41.9028, lon: 12.4964, zoom: 12 })}
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            background: '#edf2f7',
            cursor: 'pointer',
          }}
        >
          📍 Rome
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Latitude</label>
          <input
            type="number"
            step="0.00001"
            value={location.lat}
            onChange={(e) => onChange({ ...location, lat: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: '0.35rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Longitude</label>
          <input
            type="number"
            step="0.00001"
            value={location.lon}
            onChange={(e) => onChange({ ...location, lon: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: '0.35rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Zoom</label>
          <input
            type="number"
            min="1"
            max="20"
            value={location.zoom}
            onChange={(e) => onChange({ ...location, zoom: parseInt(e.target.value, 10) || 12 })}
            style={{
              width: '100%',
              padding: '0.35rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>
    </div>
  );
};
