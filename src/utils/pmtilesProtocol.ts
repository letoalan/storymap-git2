import maplibregl, { StyleSpecification } from 'maplibre-gl';
import * as pmtiles from 'pmtiles';

let protocolRegistered = false;

/**
 * Initialise et enregistre le protocole `pmtiles://` auprès de MapLibre GL avec protection contre les erreurs de réseau / stubs.
 * Cette opération est idempotente et ne s'exécute qu'une seule fois.
 */
export function registerPMTilesProtocol(): void {
  if (protocolRegistered) return;
  
  const protocol = new pmtiles.Protocol();

  maplibregl.addProtocol('pmtiles', async (requestParameters, abortController) => {
    try {
      return await protocol.tile(requestParameters, abortController);
    } catch (e: any) {
      console.warn(`[StoryMap-GIT] PMTiles optional layer fallback (${requestParameters.url}):`, e?.message || e);
      return { data: new Uint8Array() };
    }
  });

  protocolRegistered = true;
  console.log('PMTiles protocol registered with error boundary in MapLibre GL');
}

/**
 * Base URL par défaut hébergée sur GitHub Pages pour les tuiles PMTiles du projet
 */
export const DEFAULT_PMTILES_BASE_URL = 'https://eluard-tourisme.github.io/storymap-tiles';

export type MapStyleType =
  | 'base'
  | 'editorial'
  | 'positron'
  | 'dark_matter'
  | 'satellite_hybrid'
  | 'satellite'
  | 'natgeo'
  | 'topographique'
  | 'cyclosm'
  | 'securite'
  | 'relief';

export interface MapTileOffer {
  id: MapStyleType;
  label: string;
  description: string;
  icon: string;
  githubPagesNotice: string;
}

/**
 * Offres de fonds de carte 100% compatibles avec l'hébergement statique GitHub Pages (Serverless / 0 clé API / CORS ouvert)
 */
export const GITHUB_PAGES_TILE_OFFERS: MapTileOffer[] = [
  {
    id: 'base',
    label: 'OpenStreetMap Standard',
    description: 'Carte routière & patrimoniale collaborative mondiale',
    icon: '🗺️',
    githubPagesNotice: '✓ 100% Libre & Gratuit (OSM)',
  },
  {
    id: 'editorial',
    label: 'Esri World Street (Éditorial)',
    description: 'Style cartographique routier clair et élégant avec repères touristiques',
    icon: '🧭',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri Streets)',
  },
  {
    id: 'positron',
    label: 'Épuré Clair (Canvas Gray)',
    description: 'Fond minimaliste gris clair idéal pour mettre en valeur les photos et tracés',
    icon: '📄',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri Canvas Light)',
  },
  {
    id: 'dark_matter',
    label: 'Dark Nocturne (Canvas Dark)',
    description: 'Fond sombre feutré pour parcours nocturnes, circuits design & VIP',
    icon: '🌑',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri Canvas Dark)',
  },
  {
    id: 'satellite_hybrid',
    label: 'Satellite HD + Noms (Esri Hybride)',
    description: 'Imagerie aérienne satellite haute définition avec noms des lieux et rues',
    icon: '🛰️🏷️',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri Imagery + Labels)',
  },
  {
    id: 'satellite',
    label: 'Satellite Brut (Esri)',
    description: 'Imagerie aérienne pure sans aucune étiquette ni texte',
    icon: '🛰️',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri World Imagery)',
  },
  {
    id: 'natgeo',
    label: 'National Geographic Illustré',
    description: 'Carte style magazine NatGeo idéale pour la géographie, parcs et histoire',
    icon: '🌍',
    githubPagesNotice: '✓ Libre accès sans clé API (Esri NatGeo)',
  },
  {
    id: 'topographique',
    label: 'Topographie & Relief (OpenTopo)',
    description: 'Courbes de niveau et relief ombré pour randonnées et éco-tourisme',
    icon: '🏞️',
    githubPagesNotice: '✓ 100% Libre (OpenTopoMap)',
  },
  {
    id: 'cyclosm',
    label: 'CyclOSM (Vélo & Mobilité Douce)',
    description: 'Pistes cyclables, voies vertes et aménagements cyclables',
    icon: '🚲',
    githubPagesNotice: '✓ 100% Libre (CyclOSM)',
  },
  {
    id: 'securite',
    label: 'PMTiles Statique (Vectoriel GH Pages)',
    description: 'Fichier vectoriel autonome hébergé en /tiles sans aucun serveur',
    icon: '📦',
    githubPagesNotice: '✓ HTTP Range Requests (100% Serverless)',
  },
];

/**
 * Détermine l'URL de base des tuiles : utilise /tiles en local dev, ou l'URL GitHub Pages / personnalisée.
 */
export function getEffectiveTilesBaseUrl(tilesBaseUrl?: string): string {
  if (tilesBaseUrl) return tilesBaseUrl;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return `${window.location.origin}/tiles`;
  }
  return DEFAULT_PMTILES_BASE_URL;
}

/**
 * Génère une spécification de style MapLibre GL compatible GitHub Pages.
 * Toutes les sources sont en libre accès direct, sans aucune clé API requise.
 */
export function createPMTilesStyle(styleType: MapStyleType = 'base', tilesBaseUrl?: string): StyleSpecification {
  const baseUrl = getEffectiveTilesBaseUrl(tilesBaseUrl);
  const pmtilesUrl = `${baseUrl}/base.pmtiles`;

  let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  let labelTileUrl: string | null = null;
  let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';
  let maxZoom = 19;

  if (styleType === 'editorial') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom';
    maxZoom = 19;
  } else if (styleType === 'positron') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    labelTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
    maxZoom = 16;
  } else if (styleType === 'dark_matter') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    labelTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
    maxZoom = 16;
  } else if (styleType === 'satellite' || styleType === 'satellite_hybrid') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    if (styleType === 'satellite_hybrid') {
      labelTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
    }
    attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    maxZoom = 18;
  } else if (styleType === 'natgeo') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC';
    maxZoom = 16;
  } else if (styleType === 'topographique') {
    tileUrl = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
    attribution = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
    maxZoom = 17;
  } else if (styleType === 'cyclosm') {
    tileUrl = 'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png';
    attribution = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Style: &copy; <a href="https://www.cyclosm.org">CyclOSM</a>';
    maxZoom = 18;
  }

  return {
    version: 8,
    sources: {
      'raster-tile-source': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution,
      },
      ...(labelTileUrl ? {
        'labels-tile-source': {
          type: 'raster',
          tiles: [labelTileUrl],
          tileSize: 256,
        },
      } : {}),
      ...(styleType === 'securite' || styleType === 'relief' ? {
        'pmtiles-source': {
          type: 'vector',
          url: `pmtiles://${pmtilesUrl}`,
        },
      } : {}),
    },
    layers: [
      {
        id: 'main-background-layer',
        type: 'raster',
        source: 'raster-tile-source',
        minzoom: 0,
        maxzoom: maxZoom,
      },
      ...(labelTileUrl ? [
        {
          id: 'labels-overlay-layer',
          type: 'raster' as const,
          source: 'labels-tile-source',
          minzoom: 0,
          maxzoom: maxZoom,
        },
      ] : []),
      ...(styleType === 'securite' || styleType === 'relief' ? [
        {
          id: 'pmtiles-theme-overlay',
          type: 'line' as const,
          source: 'pmtiles-source',
          'source-layer': 'lines',
          paint: {
            'line-color': styleType === 'securite' ? '#dc2626' : '#d97706',
            'line-width': 3,
          },
        },
      ] : []),
    ],
  };
}

