import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  registerPMTilesProtocol,
  createPMTilesStyle,
  MapStyleType,
  GITHUB_PAGES_TILE_OFFERS,
} from '../utils/pmtilesProtocol';
import { StorySlideLocation, StorySlide, StoryData } from '../types/story';
import { exportMapAsJpeg } from '../utils/exportJpeg';

interface StoryMapViewProps {
  location?: StorySlideLocation;
  slides?: StorySlide[];
  currentIndex?: number;
  mapStyle?: MapStyleType;
  tilesBaseUrl?: string;
  storyData?: StoryData;
  onSelectSlide?: (index: number) => void;
  onStyleChange?: (newStyle: MapStyleType) => void;
  onMapLoad?: (map: maplibregl.Map) => void;
  /** Callback appelé lors d'un clic en mode positionnement GPS */
  onMapClick?: (location: StorySlideLocation) => void;
}

export const StoryMapView: React.FC<StoryMapViewProps> = ({
  location = { lat: 37.8516, lon: 15.2853, zoom: 13 },
  slides = [],
  currentIndex = 0,
  mapStyle = 'editorial',
  tilesBaseUrl,
  storyData,
  onSelectSlide,
  onStyleChange,
  onMapLoad,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeStyle, setActiveStyle] = useState<MapStyleType>(mapStyle);
  const [showTilePicker, setShowTilePicker] = useState<boolean>(false);
  const [pickMode, setPickMode] = useState<boolean>(false);
  const [pickToast, setPickToast] = useState<string | null>(null);
  const [isExportingJpeg, setIsExportingJpeg] = useState<boolean>(false);
  const pickModeRef = useRef<boolean>(false);
  const onMapClickRef = useRef(onMapClick);

  // Garder la ref synchronisée avec la prop
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    pickModeRef.current = pickMode;
    // Changer le curseur de la carte
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = pickMode ? 'crosshair' : '';
    }
  }, [pickMode]);

  useEffect(() => {
    if (mapStyle !== activeStyle) {
      setActiveStyle(mapStyle);
      if (mapRef.current) {
        const newSpec = createPMTilesStyle(mapStyle, tilesBaseUrl);
        const reapplyLayers = () => {
          if (updateRouteLayerRef.current) {
            updateRouteLayerRef.current();
          }
        };
        mapRef.current.once('styledata', reapplyLayers);
        mapRef.current.once('style.load', reapplyLayers);
        mapRef.current.setStyle(newSpec);
      }
    }
  }, [mapStyle, tilesBaseUrl, activeStyle]);

  // Initialisation de la carte MapLibre
  useEffect(() => {
    registerPMTilesProtocol();

    if (!mapContainerRef.current) return;

    const styleSpec = createPMTilesStyle(activeStyle, tilesBaseUrl);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleSpec,
      center: [location.lon, location.lat],
      zoom: location.zoom,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('error', (e) => {
      if (e?.error?.message?.includes('content-length') || e?.error?.message?.includes('Byte Serving') || e?.error?.message?.includes('pmtiles')) {
        console.warn('[StoryMap-GIT] Fallback tuile capturé gracieusement :', e.error.message);
      }
    });

    map.on('load', () => {
      if (onMapLoad) {
        onMapLoad(map);
      }
    });

    // Clic en mode positionnement GPS
    map.on('click', (e) => {
      if (!pickModeRef.current || !onMapClickRef.current) return;
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lon = Number(e.lngLat.lng.toFixed(5));
      const zoom = Math.round(map.getZoom());
      onMapClickRef.current({ lat, lon, zoom });
      setPickMode(false);
      setPickToast(`📍 Position définie : ${lat}°N, ${lon}°E`);
      setTimeout(() => setPickToast(null), 2500);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [tilesBaseUrl]);

  const updateRouteLayerRef = useRef<(() => void) | null>(null);

  // Modification dynamique du style sans réinstancier la carte
  const handleStyleSelect = (newStyle: MapStyleType) => {
    setActiveStyle(newStyle);
    setShowTilePicker(false);
    const map = mapRef.current;
    if (map) {
      const newSpec = createPMTilesStyle(newStyle, tilesBaseUrl);

      // Fonction de réinjection des calques d'itinéraire dès que le style est actif
      const reapplyLayers = () => {
        if (updateRouteLayerRef.current) {
          updateRouteLayerRef.current();
        }
      };

      map.once('styledata', reapplyLayers);
      map.once('style.load', reapplyLayers);
      map.setStyle(newSpec);
    }
    if (onStyleChange) {
      onStyleChange(newStyle);
    }
  };

  // Synchronisation des marqueurs sur la carte
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    slides.forEach((slide, idx) => {
      const isActive = idx === currentIndex;
      const el = document.createElement('div');
      el.className = `storymap-marker ${isActive ? 'active' : ''}`;
      el.innerText = String(idx + 1);

      Object.assign(el.style, {
        width: isActive ? '34px' : '26px',
        height: isActive ? '34px' : '26px',
        borderRadius: '50%',
        backgroundColor: isActive ? '#dc2626' : '#2563eb',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: isActive ? '14px' : '12px',
        border: '2px solid #ffffff',
        boxShadow: isActive
          ? '0 0 0 4px rgba(220, 38, 38, 0.35), 0 3px 8px rgba(15,23,42,0.3)'
          : '0 2px 6px rgba(15,23,42,0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        zIndex: isActive ? 10 : 1,
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectSlide) {
          onSelectSlide(idx);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([slide.location.lon, slide.location.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Mise à jour des lignes de routes GeoJSON
    const updateRouteLayer = () => {
      const features: any[] = [];

      for (let i = 0; i < slides.length - 1; i++) {
        const current = slides[i];
        const next = slides[i + 1];
        if (!current.location || !next.location) continue;

        let coords: [number, number][] = [];
        if (current.routeToNext && current.routeToNext.coordinates.length > 0) {
          coords = current.routeToNext.coordinates;
        } else {
          // Ligne directe de transition
          coords = [
            [current.location.lon, current.location.lat],
            [next.location.lon, next.location.lat],
          ];
        }

        const mode = current.mobilityToNext || 'walking';
        features.push({
          type: 'Feature',
          properties: {
            stepIndex: i,
            mode: mode,
            isActive: i === currentIndex,
          },
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        });
      }

      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features,
      };

      const source = map.getSource('storymap-routes') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojsonData);
      } else {
        map.addSource('storymap-routes', {
          type: 'geojson',
          data: geojsonData,
        });
      }

      // S'assurer que tous les calques existent bien (car map.setStyle() supprime tous les calques personnalisés)
      if (!map.getLayer('storymap-routes-glow')) {
        // Layer 1 : Halo d'accentuation pour le tronçon actif (guidage)
        map.addLayer({
          id: 'storymap-routes-glow',
          type: 'line',
          source: 'storymap-routes',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['get', 'isActive'], false],
              '#f59e0b', // Halo ambre chaleureux sur le tronçon en cours
              'rgba(0,0,0,0)',
            ],
            'line-width': 14,
            'line-opacity': 0.85,
            'line-blur': 3,
          },
        });

        // Layer 2 : Contour sombre protecteur (détache la ligne sur fond clair, toitures et satellite)
        map.addLayer({
          id: 'storymap-routes-casing-dark',
          type: 'line',
          source: 'storymap-routes',
          paint: {
            'line-color': '#0f172a',
            'line-width': [
              'case',
              ['boolean', ['get', 'isActive'], false],
              8,
              6,
            ],
            'line-opacity': 0.75,
          },
        });

        // Layer 3 : Route principale avec couleur franche selon la mobilité
        map.addLayer({
          id: 'storymap-routes-line',
          type: 'line',
          source: 'storymap-routes',
          paint: {
            'line-color': [
              'match',
              ['get', 'mode'],
              'cycling',
              '#10b981', // Vert émeraude éclatant (Vélo / Voie verte)
              'transit_driving',
              '#8b5cf6', // Violet électrique intense (Transports & Auto)
              '#0284c7', // Bleu Cyan vif & franc (À pied)
            ],
            'line-width': [
              'case',
              ['boolean', ['get', 'isActive'], false],
              5.5,
              4,
            ],
            'line-opacity': 0.95,
          },
        });

        // Layer 5 : Flèches de direction pour le sens de guidage
        map.addLayer({
          id: 'storymap-routes-arrows',
          type: 'symbol',
          source: 'storymap-routes',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 80,
            'text-field': '▶',
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, 9,
              16, 14,
            ],
            'text-keep-upright': false,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.5,
          },
        });
      }
    };

    updateRouteLayerRef.current = updateRouteLayer;

    if (map.isStyleLoaded()) {
      updateRouteLayer();
    } else {
      map.once('style.load', updateRouteLayer);
    }
  }, [slides, currentIndex, onSelectSlide]);

  // Déplacement et cadrage réactif lors des changements d'étape (zoom & travelling coordonné avec le chemin)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;

    // 1. Vue Générale (Overview ou Slide 0) : Travelling d'ensemble sur tout le circuit
    if (currentIndex === 0 || currentSlide.type === 'overview') {
      const validPoints: [number, number][] = [];
      slides.forEach((s) => {
        if (s.location && s.location.lat !== 0 && s.location.lon !== 0) {
          validPoints.push([s.location.lon, s.location.lat]);
        }
        if (s.routeToNext && s.routeToNext.coordinates) {
          s.routeToNext.coordinates.forEach((c) => validPoints.push(c));
        }
      });

      if (validPoints.length > 1) {
        const bounds = new maplibregl.LngLatBounds(validPoints[0], validPoints[0]);
        validPoints.forEach((pt) => bounds.extend(pt));

        map.fitBounds(bounds, {
          padding: { top: 70, bottom: 70, left: 70, right: 70 },
          maxZoom: 16,
          duration: 1800,
          essential: true,
        });
        return;
      }
    }

    // 2. Étape intermédiaire : Si un chemin vers l'étape suivante ou depuis la précédente existe,
    // cadrer le tronçon avec travelling et zoom coordonnés
    const nextSlide = slides[currentIndex + 1];
    const prevSlide = slides[currentIndex - 1];

    let routeToFrame = currentSlide.routeToNext;
    if (!routeToFrame && prevSlide?.routeToNext) {
      routeToFrame = prevSlide.routeToNext;
    }

    if (routeToFrame && routeToFrame.coordinates && routeToFrame.coordinates.length > 1) {
      const bounds = new maplibregl.LngLatBounds(routeToFrame.coordinates[0], routeToFrame.coordinates[0]);
      routeToFrame.coordinates.forEach((coord) => bounds.extend(coord));
      if (currentSlide.location) {
        bounds.extend([currentSlide.location.lon, currentSlide.location.lat]);
      }
      if (nextSlide?.location) {
        bounds.extend([nextSlide.location.lon, nextSlide.location.lat]);
      }

      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 17,
        duration: 1600,
        essential: true,
      });
      return;
    }

    // 3. Fallback ponctuel : flyTo sur les coordonnées de l'étape
    map.flyTo({
      center: [location.lon, location.lat],
      zoom: location.zoom || 15,
      essential: true,
      duration: 1500,
    });
  }, [currentIndex, location.lat, location.lon, location.zoom, slides]);

  return (
    <div
      className="storymap-map-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* Element canvas MapLibre GL */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Bouton de mode positionnement GPS + toast */}
      {onMapClick && (
        <>
          <button
            type="button"
            onClick={() => setPickMode(!pickMode)}
            title={pickMode ? 'Annuler le positionnement' : 'Cliquer sur la carte pour positionner cette étape'}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              background: pickMode
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: pickMode
                ? '0 4px 14px rgba(220, 38, 38, 0.4), 0 0 0 3px rgba(220, 38, 38, 0.15)'
                : '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: pickMode ? 'none' : undefined,
              fontFamily: 'inherit',
            }}
          >
            {pickMode ? '✕ Annuler' : '📍 Placer l\'étape ici'}
          </button>

          {/* Bandeau indicateur mode actif */}
          {pickMode && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '0.45rem 1rem',
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.92) 0%, rgba(239, 68, 68, 0.92) 100%)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
                zIndex: 25,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                letterSpacing: '0.01em',
                animation: 'lp-fadeIn 0.3s ease-out',
              }}
            >
              🎯 Cliquez sur la carte pour positionner l'étape
            </div>
          )}

          {/* Toast de confirmation */}
          {pickToast && (
            <div
              style={{
                position: 'absolute',
                bottom: '56px',
                left: '12px',
                zIndex: 25,
                padding: '0.5rem 1rem',
                background: '#166534',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(22, 101, 52, 0.3)',
                animation: 'lp-fadeInUp 0.3s ease-out',
              }}
            >
              {pickToast}
            </div>
          )}
        </>
      )}

      {/* Légende flottante d'identification des mobilités et guidage */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '50px',
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '0.45rem 0.75rem',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '16px', height: '4px', background: '#0284c7', borderRadius: '2px', display: 'inline-block' }} />
          <span>🚶 À pied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '16px', height: '4px', background: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
          <span>🚲 Vélo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '16px', height: '4px', background: '#8b5cf6', borderRadius: '2px', display: 'inline-block' }} />
          <span>🚌 Transport</span>
        </div>
      </div>

      {/* Barres d'outils flottantes en haut à gauche : Tuiles & Export JPEG */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 20, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div>
          <button
            type="button"
            onClick={() => setShowTilePicker(!showTilePicker)}
            style={{
              background: '#ffffff',
              color: '#1e3a8a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            🎨 Fonds de cartes
            <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '10px', border: '1px solid #86efac' }}>
              Libre
            </span>
            <span>{showTilePicker ? '▴' : '▾'}</span>
          </button>
        </div>

        {/* Bouton Export JPEG */}
        <button
          type="button"
          disabled={isExportingJpeg}
          onClick={async () => {
            if (!mapRef.current) return;
            setIsExportingJpeg(true);
            try {
              const dataForExport: StoryData = storyData || {
                slides,
                mapStyle: activeStyle,
              };
              await exportMapAsJpeg(mapRef.current, dataForExport);
              setPickToast('📷 Export JPEG réussi !');
              setTimeout(() => setPickToast(null), 2500);
            } catch (err) {
              console.error('Erreur export JPEG:', err);
              setPickToast('❌ Erreur lors de l\'export JPEG');
              setTimeout(() => setPickToast(null), 3000);
            } finally {
              setIsExportingJpeg(false);
            }
          }}
          title="Télécharger la carte au format image JPEG"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: isExportingJpeg ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
        >
          <span>📷</span>
          <span>{isExportingJpeg ? 'Génération...' : 'Export JPEG'}</span>
        </button>
      </div>

      {showTilePicker && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            left: '10px',
            zIndex: 30,
            width: '300px',
            maxHeight: '380px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.85rem',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block' }}>
                🗺️ Fonds de cartes (Hébergement Statique GH Pages)
              </strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                0 serveur backend • Range Requests • CORS Libre
              </span>
            </div>

            {GITHUB_PAGES_TILE_OFFERS.map((offer) => {
              const isSelected = offer.id === activeStyle;
              return (
                <div
                  key={offer.id}
                  onClick={() => handleStyleSelect(offer.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#1e3a8a' : '#334155' }}>
                      {offer.icon} {offer.label}
                    </span>
                    {isSelected && <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 800 }}>✓ Actif</span>}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {offer.description}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                    {offer.githubPagesNotice}
                  </span>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

