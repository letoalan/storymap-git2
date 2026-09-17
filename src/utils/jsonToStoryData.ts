import { StoryData, StorySlide, KnightLabRawData, KnightLabRawSlide, MobilityMode } from '../types/story';
import { MapStyleType } from './pmtilesProtocol';

const VALID_MAP_STYLES: Set<string> = new Set([
  'base',
  'editorial',
  'positron',
  'dark_matter',
  'satellite_hybrid',
  'satellite',
  'natgeo',
  'topographique',
  'cyclosm',
  'securite',
  'relief',
]);

/**
 * Analyse robuste d'une coordonnée décimale (supporte les nombres, chaînes, et virgules françaises).
 */
function parseCoordinate(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Analyse robuste d'un niveau de zoom.
 */
function parseZoom(val: unknown, fallback: number = 10): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val);
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(',', '.');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Valide et convertit tout contenu JSON issu de StoryMap-GIT ou de Knight Lab StoryMapJS
 * vers la structure interne StoryData, avec restauration intégrale et rétrocompatible
 * de l'ensemble des paramètres sauvegardés.
 */
export function parseKnightLabJson(rawJson: unknown): StoryData {
  let jsonToParse = rawJson;

  // Si l'entrée est une chaîne de caractères (ex: contenu textuel d'un fichier .json ou export HTML)
  if (typeof jsonToParse === 'string') {
    let str = jsonToParse.trim();

    // Détection si l'utilisateur tente d'importer du code exporté (window.storymap_data = {...})
    if (str.includes('storymap_data')) {
      const match = str.match(/storymap_data\s*=\s*(\{[\s\S]*?\});/);
      if (match && match[1]) {
        str = match[1];
      }
    }

    try {
      jsonToParse = JSON.parse(str);
    } catch (e: any) {
      throw new Error(`Format JSON invalide : impossible d'analyser le texte (${e?.message || e})`);
    }
  }

  if (typeof jsonToParse !== 'object' || jsonToParse === null) {
    throw new Error('Format JSON invalide : objet ou tableau attendu');
  }

  // Support des différentes racines possibles (storymap, story, slides direct ou tableau brut)
  const isArray = Array.isArray(jsonToParse);
  const data = (isArray ? { slides: jsonToParse } : jsonToParse) as KnightLabRawData;

  const rawSlides: KnightLabRawSlide[] =
    data.storymap?.slides ||
    data.story?.slides ||
    data.slides ||
    (Array.isArray(jsonToParse) ? (jsonToParse as KnightLabRawSlide[]) : []);

  if (!Array.isArray(rawSlides)) {
    throw new Error('Format JSON invalide : tableau d\'étapes (slides) introuvable');
  }

  const slides: StorySlide[] = rawSlides.map((slideRaw, index) => {
    const latNum = parseCoordinate(slideRaw.location?.lat, 0);
    const lonNum = parseCoordinate(slideRaw.location?.lon, 0);
    const zoomNum = parseZoom(slideRaw.location?.zoom, 10);

    // Extraction robuste du titre (headline)
    let headline = `Étape ${index + 1}`;
    let textContent = '';

    if (typeof slideRaw.text === 'string') {
      textContent = slideRaw.text;
      if ((slideRaw as any).headline) {
        headline = (slideRaw as any).headline;
      }
    } else if (slideRaw.text && typeof slideRaw.text === 'object') {
      headline = slideRaw.text.headline ?? `Étape ${index + 1}`;
      textContent = slideRaw.text.text ?? '';
    } else if ((slideRaw as any).headline) {
      headline = (slideRaw as any).headline;
    }

    if (slideRaw.type === 'overview' && (!headline || headline === `Étape ${index + 1}`)) {
      headline = headline || 'Titre du parcours touristique';
    }

    const slide: StorySlide = {
      location: {
        lat: latNum,
        lon: lonNum,
        zoom: zoomNum,
      },
      text: {
        headline,
        text: textContent,
      },
    };

    // Type de slide (ex: 'overview')
    if (slideRaw.type) {
      slide.type = slideRaw.type;
    }

    // Médias complets (url, caption, credit) — préservés même si url est vide mais légende renseignée
    if (slideRaw.media && typeof slideRaw.media === 'object') {
      const url = typeof slideRaw.media.url === 'string' ? slideRaw.media.url : '';
      const caption = typeof slideRaw.media.caption === 'string' ? slideRaw.media.caption : '';
      const credit = typeof slideRaw.media.credit === 'string' ? slideRaw.media.credit : '';
      if (url || caption || credit) {
        slide.media = {
          url,
          caption,
          credit,
        };
      }
    }

    const rawAny = slideRaw as any;

    // Mode de mobilité vers l'étape suivante ('walking', 'cycling', 'transit_driving')
    if (rawAny.mobilityToNext) {
      const m = String(rawAny.mobilityToNext).toLowerCase();
      if (m === 'walking' || m === 'cycling' || m === 'transit_driving') {
        slide.mobilityToNext = m as MobilityMode;
      } else if (m.includes('walk') || m.includes('pied')) {
        slide.mobilityToNext = 'walking';
      } else if (m.includes('cycle') || m.includes('velo') || m.includes('vélo')) {
        slide.mobilityToNext = 'cycling';
      } else if (m.includes('transit') || m.includes('car') || m.includes('voiture') || m.includes('transport') || m.includes('bus')) {
        slide.mobilityToNext = 'transit_driving';
      }
    }

    // Tracé complet d'itinéraire sauvegardé (routeToNext)
    if (rawAny.routeToNext && typeof rawAny.routeToNext === 'object') {
      const r = rawAny.routeToNext;
      if (Array.isArray(r.coordinates)) {
        slide.routeToNext = {
          coordinates: r.coordinates,
          distanceKm: typeof r.distanceKm === 'number' ? r.distanceKm : parseCoordinate(r.distanceKm, 0),
          durationMin: typeof r.durationMin === 'number' ? r.durationMin : parseCoordinate(r.durationMin, 0),
          mode: (r.mode === 'cycling' || r.mode === 'transit_driving' ? r.mode : 'walking') as MobilityMode,
        };
      }
    }

    return slide;
  });

  // Extraction du style de carte s'il est spécifié
  const rawMapType =
    data.storymap?.mapStyle ||
    data.storymap?.map_type ||
    data.story?.mapStyle ||
    data.story?.map_type ||
    data.mapStyle ||
    data.map_type;

  let mapStyle: MapStyleType | undefined;
  if (rawMapType && typeof rawMapType === 'string') {
    const normalized = rawMapType.toLowerCase().trim();
    if (VALID_MAP_STYLES.has(normalized)) {
      mapStyle = normalized as MapStyleType;
    } else if (normalized.includes('toner') || normalized.includes('light') || normalized.includes('positron')) {
      mapStyle = 'positron';
    } else if (normalized.includes('dark')) {
      mapStyle = 'dark_matter';
    } else if (normalized.includes('satellite')) {
      mapStyle = 'satellite_hybrid';
    } else if (normalized.includes('osm') || normalized.includes('standard')) {
      mapStyle = 'base';
    } else if (normalized.includes('topo') || normalized.includes('opentopomap')) {
      mapStyle = 'topographique';
    } else if (normalized.includes('cycl')) {
      mapStyle = 'cyclosm';
    } else {
      mapStyle = 'editorial';
    }
  }

  return {
    slides,
    ...(mapStyle ? { mapStyle } : {}),
  };
}

