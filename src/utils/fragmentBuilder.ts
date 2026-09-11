import { parseKnightLabJson } from './jsonToStoryData';
import { MapStyleType } from './pmtilesProtocol';
import { OKFSynthesisData } from '../types/okfSynthesis';

export interface FragmentOptions {
  containerId?: string;
  mapStyle?: MapStyleType;
  tilesBaseUrl?: string;
  showBento?: boolean;
  okfData?: OKFSynthesisData;
  bundleCode?: string;
  useCDN?: boolean;
  scriptUrl?: string;
}

/**
 * Génère un identifiant de conteneur unique pour éviter les collisions CSS/JS
 * lorsque plusieurs storymaps sont intégrées sur une même page WordPress.
 */
export function generateUniqueContainerId(prefix: string = 'storymap-git'): string {
  const randomHash = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${randomHash}`;
}

/**
 * Lit le code bundle IIFE pré-compilé (environnement Node.js uniquement).
 */
export function getBuiltBundleCode(): string {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Import dynamique node uniquement si exécuté dans un environnement Node
      const nodeFs = require('fs');
      const nodePath = require('path');
      const bundlePath = nodePath.resolve(process.cwd(), 'dist/storymap-git.js');
      if (nodeFs.existsSync(bundlePath)) {
        return nodeFs.readFileSync(bundlePath, 'utf-8');
      }
    } catch (e) {
      // Ignorer si require indisponible
    }
  }
  return '/* StoryMapGIT bundle JS placeholder */';
}

/**
 * Assemble et génère un fragment HTML (inline autoportant OU léger avec script externe)
 * prêt à être collé dans un bloc "HTML personnalisé" WordPress.
 */
export function buildSelfContainedHTML(rawJson: unknown, options: FragmentOptions = {}): string {
  // Validation du JSON Knight Lab
  const parsedStoryData = parseKnightLabJson(rawJson);

  const containerId = options.containerId || generateUniqueContainerId();

  const renderConfig = {
    mapStyle: options.mapStyle || parsedStoryData.mapStyle || 'editorial',
    tilesBaseUrl: options.tilesBaseUrl || 'https://eluard-tourisme.github.io/storymap-tiles',
    okfData: options.okfData,
  };

  const scriptUrl = options.scriptUrl || 'https://eluard-tourisme.github.io/storymap-git/storymap-git.js';

  if (options.useCDN) {
    return `<!-- Fragment Légère CDN StoryMap-GIT (BTS Tourisme - Lycée Éluard) -->
<div id="${containerId}" class="storymap-git-wrapper"></div>
<script src="${scriptUrl}"></script>
<script>
(function() {
  var containerId = ${JSON.stringify(containerId)};
  var storyData = ${JSON.stringify(parsedStoryData, null, 2)};
  var options = ${JSON.stringify(renderConfig, null, 2)};

  function init() {
    if (typeof window !== 'undefined' && window.StoryMapGIT && typeof window.StoryMapGIT.renderStoryMap === 'function') {
      window.StoryMapGIT.renderStoryMap(containerId, storyData, options);
    } else {
      setTimeout(init, 50);
    }
  }
  init();
})();
</script>
<!-- Fin Fragment StoryMap-GIT -->`;
  }

  const bundleJs = options.bundleCode || getBuiltBundleCode();

  return `<!-- Fragment Autoportant Inline StoryMap-GIT (BTS Tourisme - Lycée Éluard) -->
<div id="${containerId}" class="storymap-git-wrapper"></div>
<script>
(function() {
  var containerId = ${JSON.stringify(containerId)};
  var storyData = ${JSON.stringify(parsedStoryData, null, 2)};
  var options = ${JSON.stringify(renderConfig, null, 2)};

  // Inline Bundle JS + CSS
  ${bundleJs}

  // Initialisation du rendu dans le conteneur cible
  if (typeof window !== 'undefined' && window.StoryMapGIT && typeof window.StoryMapGIT.renderStoryMap === 'function') {
    window.StoryMapGIT.renderStoryMap(containerId, storyData, options);
  } else {
    console.error("StoryMap-GIT: Erreur lors de l'initialisation du bundle dans #" + containerId);
  }
})();
</script>
<!-- Fin Fragment StoryMap-GIT -->`;
}
