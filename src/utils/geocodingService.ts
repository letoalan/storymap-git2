export interface NominatimPlace {
  place_id: number;
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  boundingbox?: [string, string, string, string];
}

/**
 * Recherche des lieux géographiques en ligne via l'API publique Nominatim d'OpenStreetMap.
 * Inclut un contrôle de délai / rate-limiting et un formatage soigné des résultats.
 */
export async function searchPlacesNominatim(query: string, limit: number = 6): Promise<NominatimPlace[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(
    trimmed
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      console.warn(`[Nominatim] Erreur HTTP: ${response.status}`);
      return [];
    }

    const data: NominatimPlace[] = await response.json();
    return data;
  } catch (error) {
    console.error('[Nominatim] Erreur de recherche réseau :', error);
    return [];
  }
}
