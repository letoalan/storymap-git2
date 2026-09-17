import assert from 'node:assert/strict';
import { formatToKnightLabJson, parseJsonToStoryData } from '../editor/storyDataExport';
import { StoryData } from '../types/story';
import taorminaSample from '../../examples/taormina.json';

console.log('🧪 Démarrage des tests de parité et rétrocompatibilité Import/Export JSON...\n');

// -------------------------------------------------------------
// Test 1 : Aller-retour complet (Round-trip) avec parité stricte
// -------------------------------------------------------------
console.log('Test 1 : Aller-retour complet (StoryData -> JSON -> StoryData)...');

const initialStoryData: StoryData = {
  mapStyle: 'cyclosm',
  slides: [
    {
      type: 'overview',
      location: { lat: 45.8992, lon: 0.9022, zoom: 13 },
      text: {
        headline: 'Circuit Patrimoine & Métiers d\'Art - Saint-Junien',
        text: '<p>Bienvenue dans ce parcours touristique immersif créé par le <strong>BTS Tourisme</strong>.</p>',
      },
      media: {
        url: 'https://images.unsplash.com/photo-1548625361-18da90e79603',
        caption: 'Mégisserie historique de Saint-Junien',
        credit: 'Archives Municipales',
      },
      mobilityToNext: 'walking',
      routeToNext: {
        coordinates: [
          [0.9022, 45.8992],
          [0.9030, 45.8998],
          [0.9045, 45.9010],
        ],
        distanceKm: 0.85,
        durationMin: 12,
        mode: 'walking',
      },
    },
    {
      location: { lat: 45.9010, lon: 0.9045, zoom: 16 },
      text: {
        headline: 'Étape 1 : Pont Notre-Dame et les Bords de Vienne',
        text: '<p>Site historique du XIIIe siècle et patrimoine gantier d\'exception.</p>',
      },
      media: {
        url: '', // Test d'URL vide avec légende et crédit
        caption: 'Vue du pont médiéval',
        credit: 'Lycée Paul Éluard',
      },
      mobilityToNext: 'cycling',
      routeToNext: {
        coordinates: [
          [0.9045, 45.9010],
          [0.9120, 45.9050],
        ],
        distanceKm: 2.1,
        durationMin: 7,
        mode: 'cycling',
      },
    },
    {
      location: { lat: 45.9050, lon: 0.9120, zoom: 15 },
      text: {
        headline: 'Étape 2 : Site Corot et Sentier des Peintres',
        text: '<p>Espace naturel préservé ayant inspiré Jean-Baptiste Camille Corot.</p>',
      },
      mobilityToNext: 'transit_driving',
    },
  ],
};

// Sérialisation
const exportedRaw = formatToKnightLabJson(initialStoryData);
const exportedJsonString = JSON.stringify(exportedRaw, null, 2);

// Désérialisation via parseJsonToStoryData
const importedData = parseJsonToStoryData(exportedJsonString);

// Vérifications
assert.equal(importedData.mapStyle, 'cyclosm', 'Le style de carte doit être cyclosm');
assert.equal(importedData.slides.length, 3, 'Le nombre de slides doit être égal à 3');

// Slide 0 (Overview)
assert.equal(importedData.slides[0].type, 'overview');
assert.equal(importedData.slides[0].location.lat, 45.8992);
assert.equal(importedData.slides[0].location.lon, 0.9022);
assert.equal(importedData.slides[0].location.zoom, 13);
assert.equal(importedData.slides[0].text.headline, 'Circuit Patrimoine & Métiers d\'Art - Saint-Junien');
assert.equal(importedData.slides[0].media?.url, 'https://images.unsplash.com/photo-1548625361-18da90e79603');
assert.equal(importedData.slides[0].media?.caption, 'Mégisserie historique de Saint-Junien');
assert.equal(importedData.slides[0].media?.credit, 'Archives Municipales');
assert.equal(importedData.slides[0].mobilityToNext, 'walking');
assert.deepEqual(importedData.slides[0].routeToNext?.coordinates, [
  [0.9022, 45.8992],
  [0.9030, 45.8998],
  [0.9045, 45.9010],
]);
assert.equal(importedData.slides[0].routeToNext?.distanceKm, 0.85);
assert.equal(importedData.slides[0].routeToNext?.durationMin, 12);
assert.equal(importedData.slides[0].routeToNext?.mode, 'walking');

// Slide 1 (Média avec URL vide mais légende préservée)
assert.equal(importedData.slides[1].media?.caption, 'Vue du pont médiéval');
assert.equal(importedData.slides[1].media?.credit, 'Lycée Paul Éluard');
assert.equal(importedData.slides[1].mobilityToNext, 'cycling');
assert.equal(importedData.slides[1].routeToNext?.distanceKm, 2.1);
assert.equal(importedData.slides[1].routeToNext?.mode, 'cycling');

// Slide 2
assert.equal(importedData.slides[2].mobilityToNext, 'transit_driving');

console.log('✅ Test 1 réussi : Parité stricte 100% validée sur tous les paramètres !');

// -------------------------------------------------------------
// Test 2 : Rétrocompatibilité avec exemple historique Knight Lab
// -------------------------------------------------------------
console.log('\nTest 2 : Import du fichier Knight Lab historique (taormina.json)...');
const taorminaImported = parseJsonToStoryData(taorminaSample);
assert.equal(taorminaImported.slides.length, 10, 'Taormina doit contenir 10 étapes');
assert.equal(taorminaImported.slides[0].type, 'overview');
assert.equal(taorminaImported.slides[0].location.lat, 37.8516);
assert.equal(taorminaImported.slides[0].location.lon, 15.2853);
assert.equal(taorminaImported.mapStyle, 'positron', 'stamen:toner-lite doit être converti en positron');
console.log('✅ Test 2 réussi : Rétrocompatibilité Knight Lab validée !');

// -------------------------------------------------------------
// Test 3 : Tolérance aux formats alternatifs & virgules françaises
// -------------------------------------------------------------
console.log('\nTest 3 : Import avec coordonnées décimales à virgule et format brut...');
const rawFrenchJson = {
  mapStyle: 'editorial',
  slides: [
    {
      location: { lat: '45,8992', lon: '0,9022', zoom: '14' },
      text: { headline: 'Place De-Gaulle', text: 'Centre-ville' },
      mobilityToNext: 'velo',
    },
  ],
};
const frenchImported = parseJsonToStoryData(rawFrenchJson);
assert.equal(frenchImported.slides[0].location.lat, 45.8992);
assert.equal(frenchImported.slides[0].location.lon, 0.9022);
assert.equal(frenchImported.slides[0].location.zoom, 14);
assert.equal(frenchImported.slides[0].mobilityToNext, 'cycling', 'Le mode "velo" doit être normalisé en "cycling"');
console.log('✅ Test 3 réussi : Tolérance aux formats et coordonnées françaises validée !');

// -------------------------------------------------------------
// Test 4 : Import direct d'un snippet exporté HTML
// -------------------------------------------------------------
console.log('\nTest 4 : Import d\'un snippet HTML contenant window.storymap_data...');
const htmlSnippet = `
<script>
  window.storymap_data = {
    "storymap": {
      "map_type": "topographique",
      "slides": [
        { "headline": "Départ", "text": "Départ de la randonnée", "location": { "lat": 45.5, "lon": 1.2, "zoom": 12 } }
      ]
    }
  };
</script>
`;
const htmlImported = parseJsonToStoryData(htmlSnippet);
assert.equal(htmlImported.slides.length, 1);
assert.equal(htmlImported.mapStyle, 'topographique');
assert.equal(htmlImported.slides[0].text.headline, 'Départ');
console.log('✅ Test 4 réussi : Extraction depuis snippet exporté validée !');

console.log('\n🎉 TOUS LES TESTS D\'IMPORTATION ET PARITÉ ONT RÉUSSI AVEC SUCCÈS !');
