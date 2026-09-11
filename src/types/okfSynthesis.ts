export interface OKFThemeCard {
  id?: string;
  title: string;
  icon?: string;
  color?: 'red' | 'green' | 'blue' | 'amber' | 'purple' | 'emerald' | 'slate' | string;
  content: string;
  badges?: string[];
  footer?: string;
  links?: { title: string; url?: string }[];
}

export interface OKFMeta {
  title?: string;
  groupName?: string;
  author?: string;
  createdAt?: string;
  version?: string;
}

export interface OKFSynthesisData {
  meta?: OKFMeta;
  cards: OKFThemeCard[];
}

/**
 * Normalise les données OKF importées (support des thématiques libres + rétro-compatibilité).
 */
export function normalizeOKFData(raw: any): OKFSynthesisData | null {
  if (!raw) return null;

  // Si le JSON contient déjà une liste de cartes/thématiques libres
  const rawCards = raw.cards || raw.themes;
  if (Array.isArray(rawCards) && rawCards.length > 0) {
    return {
      meta: raw.meta,
      cards: rawCards.map((c: any, index: number) => ({
        id: c.id || `card-${index}`,
        title: c.title || 'Thématique libre',
        icon: c.icon || '📌',
        color: c.color || 'blue',
        content: c.content || c.description || '',
        badges: Array.isArray(c.badges) ? c.badges : (Array.isArray(c.inclusions) ? c.inclusions : []),
        footer: c.footer || c.details || '',
        links: Array.isArray(c.links) ? c.links : (Array.isArray(c.rssSources) ? c.rssSources : []),
      })),
    };
  }

  // Rétro-compatibilité : Si le JSON comporte les clés fixes
  const legacyCards: OKFThemeCard[] = [];

  if (raw.security) {
    legacyCards.push({
      id: 'sec',
      title: 'Sécurité & Protocole',
      icon: '🛡️',
      color: 'red',
      content: raw.security.protocol || '',
      footer: raw.security.emergencyContact ? `📞 Urgence : ${raw.security.emergencyContact}` : undefined,
      badges: raw.security.tags,
    });
  }

  if (raw.prestations) {
    legacyCards.push({
      id: 'prest',
      title: 'Prestations & Inclusions',
      icon: '✨',
      color: 'green',
      content: raw.prestations.description || '',
      badges: raw.prestations.inclusions,
    });
  }

  if (raw.budget) {
    legacyCards.push({
      id: 'budg',
      title: 'Estimation Budgétaire',
      icon: '💶',
      color: 'blue',
      content: `Budget estimé : ${raw.budget.estimatedCost || 0} ${raw.budget.currency || '€'} ${raw.budget.perPerson ? '/ pers.' : ''}\n${raw.budget.details || ''}`,
      footer: raw.budget.transparencyCertified ? '✓ Transparence tarifaire certifiée' : undefined,
    });
  }

  if (raw.veilleMeteo) {
    legacyCards.push({
      id: 'vm',
      title: 'Veille RssFeeder-GIT & Météo',
      icon: '☀️',
      color: 'amber',
      content: `Période idéale : ${raw.veilleMeteo.idealPeriod || ''} (${raw.veilleMeteo.temperatureRange || ''})`,
      links: raw.veilleMeteo.rssSources,
    });
  }

  if (legacyCards.length > 0) {
    return {
      meta: raw.meta,
      cards: legacyCards,
    };
  }

  return null;
}
