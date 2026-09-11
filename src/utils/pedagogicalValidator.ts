import { StoryData } from '../types/story';

export interface ValidationReport {
  isValid: boolean;
  slideCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Valide le respect du gabarit pédagogique BTS Tourisme & Mobilités
 * Exigences :
 * 1. Minimum 10 étapes (ou parcours cohérent)
 * 2. Titre, texte descriptif et coordonnées GPS valides sur chaque slide
 * 3. Cohérence des mobilités et sécurité des déplacements
 */
export function validatePedagogicalTemplate(data: StoryData): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const slides = data.slides || [];
  const slideCount = slides.length;

  // 1. Quota d'étapes (10 étapes recommandées)
  if (slideCount < 10) {
    warnings.push(`Recommandation : ${slideCount} étape(s) trouvée(s). Le gabarit type préconise 10 étapes (1 étape = 1 point fort ou journée de parcours).`);
  }

  let hasMobilityDefined = false;

  slides.forEach((slide, idx) => {
    const stepNum = idx + 1;

    // Validation des champs obligatoires
    if (!slide.text?.headline || slide.text.headline.trim() === '') {
      errors.push(`Étape ${stepNum} : Le nom du lieu / titre est obligatoire.`);
    }

    if (!slide.text?.text || slide.text.text.trim() === '') {
      errors.push(`Étape ${stepNum} : Le texte descriptif est obligatoire.`);
    }

    if (!slide.location || (slide.location.lat === 0 && slide.location.lon === 0)) {
      warnings.push(`Étape ${stepNum} : Les coordonnées GPS semblent invalides ou positionnées au point (0,0). Utilisez la recherche de lieu.`);
    }

    if (slide.mobilityToNext) {
      hasMobilityDefined = true;
    }
  });

  if (slideCount > 1 && !hasMobilityDefined) {
    warnings.push('Mobilité : Pensez à préciser le mode de déplacement (à pied, vélo, transports) entre vos étapes pour tracer l\'itinéraire.');
  }

  return {
    isValid: errors.length === 0,
    slideCount,
    errors,
    warnings,
  };
}
