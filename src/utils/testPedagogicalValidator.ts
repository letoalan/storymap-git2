import fs from 'fs';
import path from 'path';
import { parseKnightLabJson } from './jsonToStoryData';
import { validatePedagogicalTemplate } from './pedagogicalValidator';

try {
  const taorminaPath = path.resolve(process.cwd(), 'examples/taormina.json');
  const rawJson = JSON.parse(fs.readFileSync(taorminaPath, 'utf-8'));
  const storyData = parseKnightLabJson(rawJson);

  const report = validatePedagogicalTemplate(storyData);

  console.log('📋 Rapport de Validation Pédagogique (Taormina) :');
  console.log(`- Nombre d'étapes : ${report.slideCount}`);
  console.log(`- Conforme : ${report.isValid ? 'Oui' : 'Non'}`);

  if (report.errors.length > 0) {
    console.log('❌ Erreurs :');
    report.errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (report.warnings.length > 0) {
    console.log('⚠️ Avertissements / Conseils :');
    report.warnings.forEach((w) => console.log(`  - ${w}`));
  }
} catch (err) {
  console.error('❌ Erreur lors du test de validation pédagogique :', err);
  process.exit(1);
}
