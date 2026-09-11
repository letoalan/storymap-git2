import fs from 'fs';
import path from 'path';
import { buildSelfContainedHTML } from './fragmentBuilder';

try {
  const taorminaPath = path.resolve(process.cwd(), 'examples/taormina.json');
  const rawJson = JSON.parse(fs.readFileSync(taorminaPath, 'utf-8'));

  const fragment = buildSelfContainedHTML(rawJson, {
    mapStyle: 'base',
    showBento: true,
  });

  const wpPageContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parcours Taormine - BTS Tourisme | Éluard Tourisme</title>
  <style>
    /* Simulation CSS Thème WordPress (Twenty Twenty-Four / Divi) */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f6f7f7;
      color: #1d2327;
    }
    header.wp-site-header {
      background: #0a2540;
      color: #ffffff;
      padding: 1.25rem 2rem;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    header.wp-site-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .wp-site-main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .wp-block-group {
      background: #ffffff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .wp-block-heading {
      color: #0a2540;
      border-bottom: 2px solid #0073aa;
      padding-bottom: 0.5rem;
    }
    footer.wp-site-footer {
      text-align: center;
      padding: 2rem;
      color: #646970;
      font-size: 0.875rem;
      border-top: 1px solid #dcdcde;
      margin-top: 3rem;
    }
  </style>
</head>
<body>

  <header class="wp-site-header">
    <h1>Lycée Éluard — BTS Tourisme GIT (Saint-Junien)</h1>
  </header>

  <main class="wp-site-main">
    <div class="wp-block-group">
      <h2 class="wp-block-heading">Projet StoryMap : Découverte Sécurisée de Taormine</h2>
      <p>Ci-dessous, la StoryMap interactive produite et exportée par nos étudiants, réécrite et restituée via le composant autoportant React/MapLibre GL sans aucun backend.</p>

      <!-- ======================================================= -->
      <!-- DEBUT BLOC "HTML PERSONNALISE" WORDPRESS GUTEBERG -->
      <!-- ======================================================= -->
      ${fragment}
      <!-- ======================================================= -->
      <!-- FIN BLOC "HTML PERSONNALISE" WORDPRESS GUTEBERG -->
      <!-- ======================================================= -->

    </div>
  </main>

  <footer class="wp-site-footer">
    <p>&copy; 2026 Lycée Paul Éluard (Saint-Junien) — BTS Tourisme GIT. Application Serverless & Local-First.</p>
  </footer>

</body>
</html>`;

  const outputPath = path.resolve(process.cwd(), 'dist/wordpress-test-page.html');
  fs.writeFileSync(outputPath, wpPageContent, 'utf-8');

  console.log(`✅ Page de test d'intégration WordPress générée : ${outputPath}`);
} catch (err) {
  console.error('❌ Erreur lors de la génération de la page de test WordPress :', err);
  process.exit(1);
}
