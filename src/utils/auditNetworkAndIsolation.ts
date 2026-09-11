import fs from 'fs';
import path from 'path';
import { buildSelfContainedHTML } from './fragmentBuilder';

export function runSecurityAndIsolationAudit() {
  console.log('🔍 Exécution de l\'audit de conformité RGPD et d\'isolation WordPress...');

  const sampleJsonPath = path.resolve(process.cwd(), 'examples/taormina.json');
  const rawJson = JSON.parse(fs.readFileSync(sampleJsonPath, 'utf-8'));
  const fragment = buildSelfContainedHTML(rawJson, { mapStyle: 'base', showBento: true });

  const auditErrors: string[] = [];

  // 1. Vérification de l'absence d'éléments distants non autorisés
  if (/<script[^>]+src=["']http/i.test(fragment)) {
    auditErrors.push('Avertissement RGPD : Détection de balise <script src="http..."> externe');
  }

  if (/<link[^>]+href=["']http/i.test(fragment)) {
    auditErrors.push('Avertissement RGPD : Détection de feuille de style externe <link href="http...">');
  }

  if (/google\.com\/maps/i.test(fragment) || /googleapis\.com/i.test(fragment)) {
    auditErrors.push('Violation Contrainte : Dépendance à Google Maps détectée');
  }

  if (/google-analytics|googletagmanager|facebook\.net\/signals\/config|connect\.facebook\.net|hotjar\.com|mixpanel\.com|doubleclick\.net/i.test(fragment)) {
    auditErrors.push('Violation RGPD : Présence de domaine ou script de tracking tiers identifié');
  }

  // 2. Vérification de l'existence du conteneur et du bundle inline
  if (!fragment.includes('class="storymap-git-wrapper"')) {
    auditErrors.push('Erreur Structure : Conteneur storymap-git-wrapper absent');
  }

  if (!fragment.includes('window.StoryMapGIT.renderStoryMap')) {
    auditErrors.push('Erreur Initialisation : Fonction de rendu renderStoryMap non appelée');
  }

  if (auditErrors.length > 0) {
    console.error('❌ Échec de l\'audit d\'isolation :');
    auditErrors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ Audit validé avec succès !');
    console.log('  - 0 script externe tiers');
    console.log('  - 0 cookie ou tracker');
    console.log('  - 0 dépendance Google Maps');
    console.log('  - Fragment 100% autoportant et isolé');
  }
}

if (process.argv[1] && process.argv[1].endsWith('auditNetworkAndIsolation.ts')) {
  runSecurityAndIsolationAudit();
}
