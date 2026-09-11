import * as XLSX from 'xlsx';
import { StoryData, StorySlide, MobilityMode } from '../types/story';

/**
 * Découpe une ligne CSV en tenant compte des guillemets et des virgules/points-virgules.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Sauter le guillemet doublé
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Détecte le délimiteur le plus probable (virgule, point-virgule ou tabulation).
 */
function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  const tabs = (headerLine.match(/\t/g) || []).length;

  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons >= commas) return ';';
  return ',';
}

/**
 * Normalise le nom d'une colonne (retrait accents, minuscules, suppression espaces).
 */
function normalizeColumnName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Construit un objet StoryData à partir d'un tableau 2D de cellules (lignes x colonnes).
 */
function buildStoryDataFromRows(headers: string[], rows: (string | number | undefined)[][]): StoryData {
  const normalizedHeaders = headers.map(normalizeColumnName);

  // Détection des index de colonnes
  const headlineIdx = normalizedHeaders.findIndex((h) =>
    ['titre', 'nom', 'headline', 'name', 'etape', 'step', 'place', 'lieu'].includes(h)
  );
  const textIdx = normalizedHeaders.findIndex((h) =>
    ['description', 'texte', 'text', 'contenu', 'body', 'narrative', 'details'].includes(h)
  );
  const latIdx = normalizedHeaders.findIndex((h) =>
    ['latitude', 'lat', 'y', 'coordy'].includes(h)
  );
  const lonIdx = normalizedHeaders.findIndex((h) =>
    ['longitude', 'lon', 'lng', 'long', 'x', 'coordx'].includes(h)
  );
  const zoomIdx = normalizedHeaders.findIndex((h) => ['zoom', 'niveauzoom'].includes(h));
  const mediaIdx = normalizedHeaders.findIndex((h) =>
    ['image', 'media', 'url', 'photo', 'img', 'mediaurl'].includes(h)
  );
  const captionIdx = normalizedHeaders.findIndex((h) => ['legende', 'caption', 'titreimage'].includes(h));
  const creditIdx = normalizedHeaders.findIndex((h) => ['credit', 'credits', 'auteur', 'source'].includes(h));
  const mobilityIdx = normalizedHeaders.findIndex((h) =>
    ['mobilite', 'transport', 'mode', 'deplacement', 'mobility'].includes(h)
  );

  const slides: StorySlide[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => c === '' || c === undefined || c === null)) {
      continue;
    }

    const rawHeadline = headlineIdx !== -1 && row[headlineIdx] !== undefined ? String(row[headlineIdx]).trim() : '';
    const headline = rawHeadline || `Étape ${slides.length + 1}`;

    const rawText = textIdx !== -1 && row[textIdx] !== undefined ? String(row[textIdx]).trim() : '';

    // Gestion de coordonnées numériques ou avec virgule décimale (ex: 44,8384)
    let lat = 0;
    if (latIdx !== -1 && row[latIdx] !== undefined) {
      const val = String(row[latIdx]).replace(',', '.').trim();
      lat = parseFloat(val) || 0;
    }

    let lon = 0;
    if (lonIdx !== -1 && row[lonIdx] !== undefined) {
      const val = String(row[lonIdx]).replace(',', '.').trim();
      lon = parseFloat(val) || 0;
    }

    let zoom = 14;
    if (zoomIdx !== -1 && row[zoomIdx] !== undefined) {
      const parsedZoom = parseInt(String(row[zoomIdx]), 10);
      if (!isNaN(parsedZoom) && parsedZoom > 0) zoom = parsedZoom;
    }

    const mediaUrl = mediaIdx !== -1 && row[mediaIdx] !== undefined ? String(row[mediaIdx]).trim() : '';
    const caption = captionIdx !== -1 && row[captionIdx] !== undefined ? String(row[captionIdx]).trim() : undefined;
    const credit = creditIdx !== -1 && row[creditIdx] !== undefined ? String(row[creditIdx]).trim() : undefined;

    // Détection de la mobilité
    let mobility: MobilityMode = 'walking';
    if (mobilityIdx !== -1 && row[mobilityIdx] !== undefined) {
      const mobVal = String(row[mobilityIdx]).toLowerCase();
      if (mobVal.includes('velo') || mobVal.includes('bike') || mobVal.includes('cycl')) {
        mobility = 'cycling';
      } else if (
        mobVal.includes('transport') ||
        mobVal.includes('bus') ||
        mobVal.includes('train') ||
        mobVal.includes('voiture') ||
        mobVal.includes('car') ||
        mobVal.includes('auto')
      ) {
        mobility = 'transit_driving';
      }
    }

    const slide: StorySlide = {
      location: { lat, lon, zoom },
      text: { headline, text: rawText },
      type: slides.length === 0 ? 'overview' : undefined,
      mobilityToNext: mobility,
    };

    if (mediaUrl) {
      slide.media = {
        url: mediaUrl,
        caption,
        credit,
      };
    }

    slides.push(slide);
  }

  if (slides.length === 0) {
    throw new Error('Aucune étape valide n\'a pu être extraite du fichier.');
  }

  return {
    mapStyle: 'editorial',
    slides,
  };
}

/**
 * Convertit un fichier binaire Excel (.xlsx, .xls, .ods) en StoryData.
 */
export function parseExcelBufferToStoryData(buffer: ArrayBuffer | Uint8Array): StoryData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Le fichier Excel ne contient aucune feuille.');
  }

  const worksheet = workbook.Sheets[sheetName];
  // Lecture en tableau 2D de données
  const data: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (data.length < 2) {
    throw new Error('La feuille Excel doit comporter au moins une ligne d\'en-têtes et une ligne de données.');
  }

  const headers = (data[0] || []).map((h) => String(h || '').trim());
  const rows = data.slice(1);

  return buildStoryDataFromRows(headers, rows);
}

/**
 * Convertit un texte CSV ou TSV en structure StoryData.
 */
export function parseCsvToStoryData(csvContent: string): StoryData {
  const lines = csvContent
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('Le fichier CSV doit comporter au moins une ligne d\'en-têtes et une ligne de données.');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));

  return buildStoryDataFromRows(headers, rows);
}

/**
 * Parse universel (détecte si le fichier est un binaire Excel ou un fichier texte CSV/JSON).
 */
export async function parseSpreadsheetFile(file: File): Promise<StoryData> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
    const arrayBuffer = await file.arrayBuffer();
    return parseExcelBufferToStoryData(arrayBuffer);
  }

  const text = await file.text();
  return parseCsvToStoryData(text);
}

/**
 * Génère un modèle CSV type téléchargeable pour guider les élèves.
 */
export function generateSampleCsv(): string {
  return [
    'Titre;Description;Latitude;Longitude;Zoom;Mobilite;Image;Legende;Credit',
    'Circuit Découverte;Bienvenue sur notre parcours touristique et patrimonial.;37.8516;15.2853;14;walking;;Aperçu de la destination;Office de Tourisme',
    'Théâtre Antique;Édifié au IIIe siècle avant J.-C., ce joyau offre un panorama grandiose sur la côte et l\'Etna.;37.8524;15.2882;16;walking;https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Taormina_Greek_Theatre_BC.jpg/640px-Taormina_Greek_Theatre_BC.jpg;Vue sur la scène et la mer;Wikimedia Commons',
    'Villa Comunale;Magnifique jardin botanique public abritant de folies architecturales et une végétation luxuriante.;37.8510;15.2870;16;cycling;https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Villa_comunale_di_Taormina.jpg/640px-Villa_comunale_di_Taormina.jpg;Allées ombragées;Domaine Public',
    'Duomo & Piazza del Duomo;Cathédrale forteresse construite au XIIIe siècle sur les ruines d\'une ancienne église.;37.8518;15.2845;17;walking;;Place principale;',
  ].join('\r\n');
}

/**
 * Télécharge un modèle Excel (.xlsx) direct ou CSV prêt à l'emploi.
 */
export function downloadSampleExcel(filename: string = 'modele-parcours-storymap.xlsx'): void {
  const wsData = [
    ['Titre', 'Description', 'Latitude', 'Longitude', 'Zoom', 'Mobilite', 'Image', 'Legende', 'Credit'],
    ['Circuit Découverte', 'Bienvenue sur notre parcours touristique et patrimonial.', 37.8516, 15.2853, 14, 'walking', '', 'Aperçu de la destination', 'Office de Tourisme'],
    ['Théâtre Antique', 'Édifié au IIIe siècle avant J.-C., ce joyau offre un panorama grandiose sur la côte et l\'Etna.', 37.8524, 15.2882, 16, 'walking', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Taormina_Greek_Theatre_BC.jpg/640px-Taormina_Greek_Theatre_BC.jpg', 'Vue sur la scène et la mer', 'Wikimedia Commons'],
    ['Villa Comunale', 'Magnifique jardin botanique public abritant de folies architecturales et une végétation luxuriante.', 37.8510, 15.2870, 16, 'cycling', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Villa_comunale_di_Taormina.jpg/640px-Villa_comunale_di_Taormina.jpg', 'Allées ombragées', 'Domaine Public'],
    ['Duomo & Piazza del Duomo', 'Cathédrale forteresse construite au XIIIe siècle sur les ruines d\'une ancienne église.', 37.8518, 15.2845, 17, 'walking', '', 'Place principale', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parcours');
  XLSX.writeFile(wb, filename);
}

/**
 * Télécharge un modèle CSV d'exemple.
 */
export function downloadSampleCsv(filename: string = 'modele-parcours-storymap.csv'): void {
  const content = '\uFEFF' + generateSampleCsv();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
