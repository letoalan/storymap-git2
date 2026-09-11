import { StoryData, StorySlide, KnightLabRawData, KnightLabRawSlide } from '../types/story';
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
 * Valide et convertit un objet JSON issu de Knight Lab StoryMapJS vers la structure interne StoryData.
 */
export function parseKnightLabJson(rawJson: unknown): StoryData {
  if (typeof rawJson !== 'object' || rawJson === null) {
    throw new Error('Format JSON invalide : objet attendu');
  }

  const data = rawJson as KnightLabRawData;
  const rawSlides: KnightLabRawSlide[] =
    data.storymap?.slides || data.story?.slides || data.slides || [];

  if (!Array.isArray(rawSlides)) {
    throw new Error('Format JSON invalide : tableau de slides introuvable');
  }

  const slides: StorySlide[] = rawSlides.map((slideRaw, index) => {
    const latNum = typeof slideRaw.location?.lat === 'number'
      ? slideRaw.location.lat
      : parseFloat(String(slideRaw.location?.lat ?? 0));

    const lonNum = typeof slideRaw.location?.lon === 'number'
      ? slideRaw.location.lon
      : parseFloat(String(slideRaw.location?.lon ?? 0));

    const zoomNum = typeof slideRaw.location?.zoom === 'number'
      ? slideRaw.location.zoom
      : parseInt(String(slideRaw.location?.zoom ?? 10), 10);

    const slide: StorySlide = {
      location: {
        lat: isNaN(latNum) ? 0 : latNum,
        lon: isNaN(lonNum) ? 0 : lonNum,
        zoom: isNaN(zoomNum) ? 10 : zoomNum,
      },
      text: {
        headline: slideRaw.text?.headline ?? `Étape ${index + 1}`,
        text: slideRaw.text?.text ?? '',
      },
    };

    if (slideRaw.type) {
      slide.type = slideRaw.type;
    }

    if (slideRaw.media?.url) {
      slide.media = {
        url: slideRaw.media.url,
        caption: slideRaw.media.caption,
        credit: slideRaw.media.credit,
      };
    }

    const rawAny = slideRaw as any;
    if (rawAny.mobilityToNext) {
      slide.mobilityToNext = rawAny.mobilityToNext;
    }
    if (rawAny.routeToNext) {
      slide.routeToNext = rawAny.routeToNext;
    }

    return slide;
  });

  // Extraction du style de carte s'il est spécifié
  const rawMapType =
    data.storymap?.map_type ||
    data.storymap?.mapStyle ||
    data.story?.map_type ||
    data.story?.mapStyle ||
    data.map_type ||
    data.mapStyle;

  let mapStyle: MapStyleType | undefined;
  if (rawMapType) {
    if (VALID_MAP_STYLES.has(rawMapType)) {
      mapStyle = rawMapType as MapStyleType;
    } else if (rawMapType.includes('toner') || rawMapType.includes('light') || rawMapType.includes('positron')) {
      mapStyle = 'positron';
    } else if (rawMapType.includes('dark')) {
      mapStyle = 'dark_matter';
    } else if (rawMapType.includes('satellite')) {
      mapStyle = 'satellite_hybrid';
    } else if (rawMapType.includes('osm') || rawMapType.includes('standard')) {
      mapStyle = 'base';
    } else {
      mapStyle = 'editorial';
    }
  }

  return {
    slides,
    ...(mapStyle ? { mapStyle } : {}),
  };
}
