import { MobilityMode, RouteInfo, StorySlideLocation } from '../types/story';

/**
 * Calcule la distance orthodromique (à vol d'oiseau) en kilomètres entre deux points GPS.
 */
export function calculateHaversineDistanceKm(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number }
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lon - start.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Génère des points intermédiaires pour une ligne courbe ou directe en fallback
 */
function createInterpolatedLine(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  steps: number = 20
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const lon = start.lon + (end.lon - start.lon) * f;
    const lat = start.lat + (end.lat - start.lat) * f;
    coords.push([lon, lat]);
  }
  return coords;
}

/**
 * Vitesse moyenne approximative en km/h pour estimer les durées
 */
const AVERAGE_SPEED_KMH: Record<MobilityMode, number> = {
  walking: 4.5,        // 4.5 km/h à pied
  cycling: 15,         // 15 km/h à vélo
  transit_driving: 40, // 40 km/h en transport / route
};

/**
 * Calcule l'itinéraire le plus court chemin entre deux étapes selon la mobilité choisie.
 * Utilise l'API de routage OSRM publique avec bascule automatique sur approximation géodésique si hors ligne/indisponible.
 */
export async function calculateRouteBetweenSlides(
  startLoc: StorySlideLocation,
  endLoc: StorySlideLocation,
  mode: MobilityMode = 'walking'
): Promise<RouteInfo> {
  // Mapping profil OSRM
  // OSRM public profiles: 'foot', 'bike', 'driving'
  let osrmProfile = 'foot';
  if (mode === 'cycling') osrmProfile = 'bike';
  if (mode === 'transit_driving') osrmProfile = 'driving';

  const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLoc.lon},${startLoc.lat};${endLoc.lon},${endLoc.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const coordinates: [number, number][] = primaryRoute.geometry.coordinates;
        const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2));
        const durationMin = Math.max(1, Math.round(primaryRoute.duration / 60));

        return {
          coordinates,
          distanceKm,
          durationMin,
          mode,
        };
      }
    }
  } catch (err) {
    console.warn('[Routing] Service OSRM distant non joignable, fallback local:', err);
  }

  // Fallback local instantané
  const directDistance = calculateHaversineDistanceKm(startLoc, endLoc);
  // Coefficient de détour empirique selon le mode (1.25 à pied/vélo, 1.35 en voiture)
  const detourFactor = mode === 'transit_driving' ? 1.35 : 1.25;
  const estimatedKm = Number((directDistance * detourFactor).toFixed(2));
  const speed = AVERAGE_SPEED_KMH[mode];
  const durationMin = Math.max(1, Math.round((estimatedKm / speed) * 60));

  return {
    coordinates: createInterpolatedLine(startLoc, endLoc),
    distanceKm: estimatedKm,
    durationMin,
    mode,
  };
}
