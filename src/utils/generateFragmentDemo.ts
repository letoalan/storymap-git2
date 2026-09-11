import fs from 'fs';
import path from 'path';
import { buildSelfContainedHTML } from './fragmentBuilder';

try {
  const taorminaJsonPath = path.resolve(process.cwd(), 'examples/taormina.json');
  const rawJsonContent = JSON.parse(fs.readFileSync(taorminaJsonPath, 'utf-8'));

  const fragmentHtml = buildSelfContainedHTML(rawJsonContent, {
    mapStyle: 'base',
    showBento: true,
  });

  const fullTestDoc = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test Fragment Autoportant - StoryMap Taormina</title>
</head>
<body style="background: #f1f5f9; padding: 2rem; margin: 0;">
  <h1 style="text-align: center; font-family: sans-serif; color: #0f172a;">Simulateur Page WordPress — BTS Tourisme GIT</h1>
  <!-- DEBUT BLOC HTML PERSONNALISE WORDPRESS -->
  ${fragmentHtml}
  <!-- FIN BLOC HTML PERSONNALISE WORDPRESS -->
</body>
</html>`;

  const outputPath = path.resolve(process.cwd(), 'dist/taormina-fragment.html');
  fs.writeFileSync(outputPath, fullTestDoc, 'utf-8');

  console.log(`✅ Fragment HTML autoportant généré avec succès dans : ${outputPath}`);
  console.log(`Taille du fragment : ${(fullTestDoc.length / 1024).toFixed(2)} kB`);
} catch (err) {
  console.error('❌ Erreur lors de la génération du fragment :', err);
  process.exit(1);
}
