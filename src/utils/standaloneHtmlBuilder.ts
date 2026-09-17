import { StoryData } from '../types/story';
import { formatToKnightLabJson } from '../editor/storyDataExport';
import { MapStyleType } from './pmtilesProtocol';

export interface StandaloneExportOptions {
  pageTitle?: string;
  pageDescription?: string;
  scriptUrl?: string;
  tilesBaseUrl?: string;
  mapStyle?: MapStyleType;
  containerId?: string;
  author?: string;
  institution?: string;
}

/**
 * Nettoie et échappe les caractères HTML dangereux
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Détermine l'URL par défaut du moteur storymap-git.js.
 * Détecte si l'application est exécutée sur GitHub Pages ou fournit l'URL canonique.
 */
export function getDefaultScriptUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '';
    if (origin.includes('github.io')) {
      const cleanPath = pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
      return `${origin}${cleanPath}/storymap-git.js`;
    }
  }
  return 'https://letoalan.github.io/storymap-git2/storymap-git.js';
}

/**
 * Génère une page HTML5 complète, 100% autonome et prête à être
 * collée dans un fichier `index.html` pour un déploiement instantané sur GitHub Pages.
 */
export function buildStandaloneGitHubPagesHTML(
  storyData: StoryData,
  options: StandaloneExportOptions = {}
): string {
  const firstSlide = storyData.slides[0];
  const defaultTitle = firstSlide?.text?.headline || 'Mon Parcours Touristique';
  const title = options.pageTitle || defaultTitle;
  const description =
    options.pageDescription ||
    (firstSlide?.text?.text
      ? firstSlide.text.text.replace(/<[^>]*>?/gm, '').slice(0, 160)
      : 'Circuit touristique interactif géolocalisé');

  const containerId = options.containerId || 'storymap-autonomous-app';
  const effectiveMapStyle = options.mapStyle || storyData.mapStyle || 'editorial';
  const scriptUrl = options.scriptUrl || getDefaultScriptUrl();
  const institution = options.institution || 'BTS Tourisme GIT — Lycée Paul Éluard';

  const knightLabData = formatToKnightLabJson(storyData);

  const renderConfig = {
    mapStyle: effectiveMapStyle,
    tilesBaseUrl: options.tilesBaseUrl || undefined,
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — StoryMap-GIT</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Polices Google Font & Styles modernes -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Barre supérieure de présentation */
    .storymap-standalone-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.85rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .storymap-standalone-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      letter-spacing: -0.01em;
    }
    .storymap-standalone-badge {
      font-size: 0.78rem;
      font-weight: 700;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* Conteneur principal */
    .storymap-standalone-main {
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      padding: 1.25rem;
      min-height: calc(100vh - 65px);
    }
    #${containerId} {
      width: 100%;
      min-height: 720px;
    }

    /* Overlay de chargement élégant */
    .storymap-loader-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      gap: 1.25rem;
      color: #475569;
      text-align: center;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
    }
    .storymap-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: sm-spin 0.8s linear infinite;
    }
    @keyframes sm-spin {
      to { transform: rotate(360deg); }
    }
    .storymap-error-box {
      display: none;
      max-width: 520px;
      margin: 0 auto;
      padding: 1rem 1.25rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #991b1b;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <!-- En-tête autonome -->
  <header class="storymap-standalone-header">
    <h1 class="storymap-standalone-title">
      <span>🗺️</span>
      <span>${escapeHtml(title)}</span>
    </h1>
    <span class="storymap-standalone-badge">
      🎓 ${escapeHtml(institution)}
    </span>
  </header>

  <!-- Conteneur d'affichage de la StoryMap -->
  <main class="storymap-standalone-main">
    <div id="${containerId}">
      <div id="storymap-loader" class="storymap-loader-overlay">
        <div class="storymap-spinner"></div>
        <p style="font-weight: 600; margin: 0; font-size: 1rem;">Chargement de votre circuit interactif...</p>
        <span style="font-size: 0.82rem; color: #94a3b8;">Initialisation des tuiles cartographiques et du guidage</span>
        <div id="storymap-error" class="storymap-error-box">
          ⚠️ <strong>Impossible de charger le moteur StoryMap-GIT.</strong><br/>
          Vérifiez votre connexion internet ou assurez-vous que le script <code>${escapeHtml(scriptUrl)}</code> est bien accessible.
        </div>
      </div>
    </div>
  </main>

  <!-- Moteur StoryMap-GIT -->
  <script src="${scriptUrl}" onerror="document.getElementById('storymap-error').style.display = 'block';"></script>

  <!-- Initialisation automatique du parcours -->
  <script>
    (function() {
      var containerId = ${JSON.stringify(containerId)};
      var storyData = ${JSON.stringify(knightLabData, null, 2)};
      var options = ${JSON.stringify(renderConfig, null, 2)};
      var attempts = 0;
      var maxAttempts = 120; // 6 secondes max

      function initStoryMap() {
        if (typeof window !== 'undefined' && window.StoryMapGIT && typeof window.StoryMapGIT.renderStoryMap === 'function') {
          var loader = document.getElementById('storymap-loader');
          if (loader) loader.style.display = 'none';
          window.StoryMapGIT.renderStoryMap(containerId, storyData, options);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(initStoryMap, 50);
        } else {
          var errBox = document.getElementById('storymap-error');
          if (errBox) errBox.style.display = 'block';
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStoryMap);
      } else {
        initStoryMap();
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Génère un fragment HTML optimisé pour un bloc "HTML personnalisé" WordPress.
 */
export function buildWordPressFragmentHTML(
  storyData: StoryData,
  options: StandaloneExportOptions = {}
): string {
  const containerId = options.containerId || `storymap-wp-${Math.random().toString(36).substring(2, 9)}`;
  const effectiveMapStyle = options.mapStyle || storyData.mapStyle || 'editorial';
  const scriptUrl = options.scriptUrl || getDefaultScriptUrl();
  const knightLabData = formatToKnightLabJson(storyData);

  const renderConfig = {
    mapStyle: effectiveMapStyle,
    tilesBaseUrl: options.tilesBaseUrl || undefined,
  };

  return `<!-- Fragment StoryMap-GIT (Lycée Paul Éluard - BTS Tourisme) -->
<div id="${containerId}" class="storymap-git-wrapper" style="width:100%; min-height:680px;"></div>
<script src="${scriptUrl}"></script>
<script>
(function() {
  var containerId = ${JSON.stringify(containerId)};
  var storyData = ${JSON.stringify(knightLabData, null, 2)};
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

/**
 * Formate les données au format JSON Knight Lab brut
 */
export function buildKnightLabJsonString(storyData: StoryData): string {
  const formatted = formatToKnightLabJson(storyData);
  return JSON.stringify(formatted, null, 2);
}
