import { StoryData, KnightLabRawData } from '../types/story';
import { parseKnightLabJson } from '../utils/jsonToStoryData';

/**
 * Formate un objet StoryData interne au format Knight Lab standard `published.json`.
 */
export function formatToKnightLabJson(storyData: StoryData): KnightLabRawData {
  return {
    storymap: {
      map_type: storyData.mapStyle || 'editorial',
      mapStyle: storyData.mapStyle || 'editorial',
      slides: storyData.slides.map((slide) => ({
        type: slide.type || undefined,
        location: slide.location
          ? {
              lat: slide.location.lat,
              lon: slide.location.lon,
              zoom: slide.location.zoom,
            }
          : undefined,
        text: {
          headline: slide.text.headline || '',
          text: slide.text.text || '',
        },
        media: slide.media
          ? {
              url: slide.media.url || '',
              caption: slide.media.caption || '',
              credit: slide.media.credit || '',
            }
          : undefined,
        mobilityToNext: slide.mobilityToNext,
        routeToNext: slide.routeToNext,
      })),
    },
  };
}

/**
 * Déclenche le téléchargement d'un fichier JSON local par l'utilisateur.
 */
export function exportToJsonFile(storyData: StoryData, filename: string = 'storymap-published.json'): void {
  const formattedJson = formatToKnightLabJson(storyData);
  const jsonString = JSON.stringify(formattedJson, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valide et convertit tout contenu JSON (texte ou objet) vers la structure StoryData,
 * restaurant l'ensemble des paramètres sauvegardés à l'identique :
 * style de carte, étapes, coordonnées GPS, textes, médias complets, mobilités et tracés d'itinéraires.
 */
export function parseJsonToStoryData(jsonInput: string | unknown): StoryData {
  return parseKnightLabJson(jsonInput);
}

/**
 * Ouvre la boîte de dialogue système pour sélectionner un fichier JSON (.json).
 */
export function promptUserForJsonFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Environnement navigateur requis pour sélectionner un fichier'));
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';

    input.onchange = () => {
      const selected = input.files?.[0];
      if (selected) {
        resolve(selected);
      } else {
        reject(new Error('Aucun fichier sélectionné'));
      }
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Lit et convertit un fichier JSON (fourni en paramètre ou sélectionné interactivement)
 * vers l'objet StoryData avec l'intégralité des paramètres restaurés à l'identique de la sauvegarde.
 */
export async function importFromJsonFile(file?: File): Promise<StoryData> {
  const targetFile = file || (await promptUserForJsonFile());
  const text = await targetFile.text();
  return parseJsonToStoryData(text);
}

/**
 * Crée une StoryMap vierge avec une slide de titre par défaut.
 */
export function createDefaultStoryData(): StoryData {
  return {
    mapStyle: 'editorial',
    slides: [
      {
        type: 'overview',
        location: { lat: 37.8516, lon: 15.2853, zoom: 14 },
        text: {
          headline: 'Titre du parcours touristique',
          text: 'Présentation générale de la destination et des objectifs du parcours.',
        },
        media: {
          url: '',
          caption: 'Illustration principale',
          credit: 'BTS Tourisme - Lycée Paul Éluard',
        },
      },
      {
        location: { lat: 37.8524, lon: 15.2882, zoom: 16 },
        text: {
          headline: 'Étape 1 : Théâtre Antique de Taormine',
          text: 'Description détaillée du point d intérêt, analyse patrimoniale et accès.',
        },
        media: {
          url: '',
          caption: 'Vue du théâtre antique',
          credit: 'Photo Domaine Public',
        },
      },
    ],
  };
}

