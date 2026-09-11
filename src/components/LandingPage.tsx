import React from 'react';
import './LandingPage.css';
import { downloadSampleExcel } from '../utils/csvImporter';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="lp-page">
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            BTS Tourisme GIT — Lycée Paul Éluard, Saint-Junien
          </div>

          <h1 className="lp-hero-title">
            Créez votre{' '}
            <span className="lp-hero-title-accent">circuit touristique</span>
            {' '}interactif
          </h1>

          <p className="lp-hero-subtitle">
            Concevez un parcours géolocalisé en 10 étapes, ajoutez vos photos et descriptions,
            puis publiez-le directement sur le site eluard-tourisme.fr — le tout sans compte,
            sans cookies, 100% conforme RGPD.
          </p>

          <button
            type="button"
            className="lp-hero-cta"
            onClick={onEnterApp}
          >
            🚀 Commencer mon parcours
          </button>

          <div className="lp-features-strip">
            <div className="lp-feature-item">
              <span className="lp-feature-item-icon">🛡️</span>
              100% local & RGPD
            </div>
            <div className="lp-feature-item">
              <span className="lp-feature-item-icon">🗺️</span>
              Carte interactive MapLibre
            </div>
            <div className="lp-feature-item">
              <span className="lp-feature-item-icon">🚶🚲</span>
              Mobilités & Itinéraires OSRM
            </div>
            <div className="lp-feature-item">
              <span className="lp-feature-item-icon">📷</span>
              Export JPEG & WordPress
            </div>
          </div>
        </div>

        <div className="lp-hero-scroll-hint">
          <span>Découvrir le fonctionnement</span>
          <span className="lp-hero-scroll-arrow">↓</span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          COMMENT ÇA MARCHE — 4 ÉTAPES CLÉS
          ════════════════════════════════════════════════════════ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <span className="lp-section-eyebrow">Fonctionnement pas-à-pas</span>
            <h2 className="lp-section-title">Comment fonctionne l'application ?</h2>
            <p className="lp-section-desc">
              Une chaîne de création 100% côté client, fluide et intuitive, conçue spécifiquement pour les projets touristiques de la section.
            </p>
          </header>

          <div className="lp-steps-grid lp-steps-grid--4">
            {/* Étape 1 */}
            <div className="lp-step-card">
              <div className="lp-step-number">1</div>
              <span className="lp-step-icon">🔎</span>
              <h3 className="lp-step-title">Recherche de lieux en ligne</h3>
              <p className="lp-step-desc">
                Tapez le nom d'un monument, musée ou d'une adresse. Le service Nominatim (OpenStreetMap) localise instantanément le site sans clé API.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="lp-step-card">
              <div className="lp-step-number">2</div>
              <span className="lp-step-icon">🚶🚲</span>
              <h3 className="lp-step-title">Mobilité & Tracé d'itinéraire</h3>
              <p className="lp-step-desc">
                Choisissez le mode de déplacement vers l'étape suivante (À pied, À vélo, Transports/Voiture). Le moteur OSRM calcule le plus court chemin et le temps de parcours.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="lp-step-card">
              <div className="lp-step-number">3</div>
              <span className="lp-step-icon">🖼️</span>
              <h3 className="lp-step-title">Contenu riche & Visuels</h3>
              <p className="lp-step-desc">
                Rédigez le récit touristique avec l'éditeur de texte enrichi et ajoutez des photographies (depuis votre ordinateur ou via URL Wikimedia/Unsplash).
              </p>
            </div>

            {/* Étape 4 */}
            <div className="lp-step-card">
              <div className="lp-step-number">4</div>
              <span className="lp-step-icon">📷</span>
              <h3 className="lp-step-title">Export JPEG HD & WordPress</h3>
              <p className="lp-step-desc">
                Téléchargez la carte de votre circuit en JPEG haute définition avec cartouche d'information, ou copiez le code HTML pour votre page WordPress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          GUIDE DE CONSTRUCTION DU FICHIER EXCEL
          ════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section--alt">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <span className="lp-section-eyebrow">Préparation des données</span>
            <h2 className="lp-section-title">Comment construire votre fichier Excel ?</h2>
            <p className="lp-section-desc">
              Vous pouvez préparer l'intégralité de votre itinéraire dans Microsoft Excel, LibreOffice Calc ou Google Sheets, puis l'importer en 1 clic.
            </p>
          </header>

          <div className="lp-excel-guide-card">
            <div className="lp-excel-guide-header">
              <div className="lp-excel-guide-title-group">
                <span className="lp-excel-guide-icon">📊</span>
                <div>
                  <h3 className="lp-excel-guide-title">Structure du tableau Excel (.xlsx / .csv)</h3>
                  <p className="lp-excel-guide-subtitle">
                    La 1ère ligne contient les noms de colonnes. Chaque ligne suivante représente une étape du parcours dans l'ordre chronologique.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="lp-excel-dl-btn"
                onClick={() => downloadSampleExcel()}
                title="Télécharger le modèle Excel prêt à l'emploi"
              >
                📥 Télécharger le modèle Excel (.xlsx)
              </button>
            </div>

            {/* Tableau explicatif des colonnes */}
            <div className="lp-excel-table-container">
              <table className="lp-excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Colonne</th>
                    <th style={{ width: '12%' }}>Obligatoire ?</th>
                    <th style={{ width: '38%' }}>Description & Utilité</th>
                    <th style={{ width: '35%' }}>Exemple</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Titre</strong> <span className="lp-col-alias">(ou Nom, Étape)</span></td>
                    <td><span className="lp-badge lp-badge--req">Obligatoire</span></td>
                    <td>Nom de l'étape ou du monument présenté sur la diapositive.</td>
                    <td><code>Théâtre Antique</code></td>
                  </tr>
                  <tr>
                    <td><strong>Description</strong> <span className="lp-col-alias">(ou Texte, Contenu)</span></td>
                    <td><span className="lp-badge lp-badge--opt">Recommandé</span></td>
                    <td>Texte de présentation touristique, historique ou pratique.</td>
                    <td><code>Édifié au IIIe siècle av. J.-C...</code></td>
                  </tr>
                  <tr>
                    <td><strong>Latitude</strong> & <strong>Longitude</strong></td>
                    <td><span className="lp-badge lp-badge--opt">Optionnel</span></td>
                    <td>
                      Coordonnées GPS en degrés décimaux.
                      <em> Si non renseignées, vous pourrez situer le lieu en 1 clic grâce à la recherche Nominatim intégrée.</em>
                    </td>
                    <td><code>37.8524</code> & <code>15.2882</code></td>
                  </tr>
                  <tr>
                    <td><strong>Mobilite</strong> <span className="lp-col-alias">(ou Transport, Mode)</span></td>
                    <td><span className="lp-badge lp-badge--opt">Optionnel</span></td>
                    <td>
                      Mode de déplacement vers l'étape suivante :<br />
                      • <code>walking</code> ou <code>pied</code> (🚶 à pied)<br />
                      • <code>cycling</code> ou <code>velo</code> (🚲 à vélo)<br />
                      • <code>transit_driving</code> ou <code>transport</code> (🚌/🚗 route)
                    </td>
                    <td><code>walking</code></td>
                  </tr>
                  <tr>
                    <td><strong>Zoom</strong></td>
                    <td><span className="lp-badge lp-badge--opt">Optionnel</span></td>
                    <td>Niveau de zoom de la carte (entre 12 et 18, 14 par défaut).</td>
                    <td><code>16</code></td>
                  </tr>
                  <tr>
                    <td><strong>Image</strong> <span className="lp-col-alias">(ou Photo, URL)</span></td>
                    <td><span className="lp-badge lp-badge--opt">Optionnel</span></td>
                    <td>Lien web HTTP/HTTPS vers une photographie de l'étape.</td>
                    <td><code>https://upload.wikimedia.org/...</code></td>
                  </tr>
                  <tr>
                    <td><strong>Legende</strong> & <strong>Credit</strong></td>
                    <td><span className="lp-badge lp-badge--opt">Optionnel</span></td>
                    <td>Légende explicative de l'image et crédits de l'auteur.</td>
                    <td><code>Vue panoramique</code> / <code>Wikimedia</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Conseils pratiques */}
            <div className="lp-excel-tips-grid">
              <div className="lp-excel-tip-item">
                <span className="lp-excel-tip-icon">💡</span>
                <div>
                  <strong>Vous n'avez pas les coordonnées GPS ?</strong>
                  <p>Pas de panique : importez votre fichier avec seulement les noms des étapes. L'outil de recherche Nominatim intégré vous permettra de positionner chaque étape en tapant son nom !</p>
                </div>
              </div>
              <div className="lp-excel-tip-item">
                <span className="lp-excel-tip-icon">🗺️</span>
                <div>
                  <strong>Calcul automatique des routes</strong>
                  <p>Dès que vos étapes sont géoréférencées, les itinéraires multimodaux les plus courts sont automatiquement tracés sur la carte.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FONDS DE CARTES 100% LIBRES & SANS CLÉ API
          ════════════════════════════════════════════════════════ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <span className="lp-section-eyebrow">Cartographie éthique & autonome</span>
            <h2 className="lp-section-title">Des tuiles cartographiques 100% libres d'accès</h2>
            <p className="lp-section-desc">
              Fini les contraintes de clés d'API ou les quotas payants (comme Carto.com). L'application n'utilise que des fonds de carte en libre accès direct, pérennes et conformes RGPD.
            </p>
          </header>

          <div className="lp-tiles-grid">
            <div className="lp-tile-card">
              <div className="lp-tile-icon">🗺️</div>
              <h3 className="lp-tile-title">OpenStreetMap Standard</h3>
              <p className="lp-tile-desc">La référence cartographique mondiale libre et collaborative, idéale pour tout repérage urbain et patrimonial.</p>
              <span className="lp-tile-tag">100% Libre & Gratuit</span>
            </div>

            <div className="lp-tile-card">
              <div className="lp-tile-icon">🧭</div>
              <h3 className="lp-tile-title">Esri World Street</h3>
              <p className="lp-tile-desc">Fond de plan routier et urbain élégant avec mise en évidence des points d'intérêt touristiques et éditoriaux.</p>
              <span className="lp-tile-tag">Libre accès sans clé</span>
            </div>

            <div className="lp-tile-card">
              <div className="lp-tile-icon">📄</div>
              <h3 className="lp-tile-title">Épuré Clair (Canvas Gray)</h3>
              <p className="lp-tile-desc">Fond neutre gris clair ultra-minimaliste conçu pour faire ressortir au maximum les tracés et vos photographies.</p>
              <span className="lp-tile-tag">Libre accès sans clé</span>
            </div>

            <div className="lp-tile-card">
              <div className="lp-tile-icon">🌑</div>
              <h3 className="lp-tile-title">Dark Nocturne (Canvas Dark)</h3>
              <p className="lp-tile-desc">Ambiance sombre feutrée parfaite pour les circuits nocturnes, les visites de monuments illuminés ou les parcours VIP.</p>
              <span className="lp-tile-tag">Libre accès sans clé</span>
            </div>

            <div className="lp-tile-card">
              <div className="lp-tile-icon">🛰️</div>
              <h3 className="lp-tile-title">Satellite HD & Hybride</h3>
              <p className="lp-tile-desc">Imagerie aérienne mondiale haute précision avec ou sans surimpression des noms des voies et des communes.</p>
              <span className="lp-tile-tag">Libre accès sans clé</span>
            </div>

            <div className="lp-tile-card">
              <div className="lp-tile-icon">🚲</div>
              <h3 className="lp-tile-title">CyclOSM & Topographie</h3>
              <p className="lp-tile-desc">Réseau cyclable balisé, voies vertes et courbes de niveau pour les projets d'éco-tourisme et mobilités douces.</p>
              <span className="lp-tile-tag">100% Libre OSM / OpenTopo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CAHIER DES CHARGES BTS
          ════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section--alt">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <span className="lp-section-eyebrow">Exigences pédagogiques</span>
            <h2 className="lp-section-title">Cahier des charges BTS Tourisme</h2>
            <p className="lp-section-desc">
              Votre parcours touristique doit respecter ces quatre exigences essentielles
              pour être validé.
            </p>
          </header>

          <div className="lp-req-grid">
            {/* 10 étapes */}
            <div className="lp-req-card">
              <div className="lp-req-icon lp-req-icon--blue">📍</div>
              <div>
                <h3 className="lp-req-title">10 étapes obligatoires</h3>
                <p className="lp-req-desc">
                  1 slide de titre (présentation du circuit) + 9 étapes d'itinéraire géolocalisées.
                  L'application vérifie automatiquement le nombre d'étapes.
                </p>
              </div>
            </div>

            {/* Sécurité */}
            <div className="lp-req-card">
              <div className="lp-req-icon lp-req-icon--red">🛡️</div>
              <div>
                <h3 className="lp-req-title">Sécurité & Prévention</h3>
                <p className="lp-req-desc">
                  Chaque étape mentionne les consignes de sécurité : zone piétonne, numéro
                  d'urgence local, accessibilité PMR, équipement requis.
                </p>
              </div>
            </div>

            {/* Prestations VIP */}
            <div className="lp-req-card">
              <div className="lp-req-icon lp-req-icon--amber">✨</div>
              <div>
                <h3 className="lp-req-title">Prestations haut de gamme</h3>
                <p className="lp-req-desc">
                  Valorisez des prestations de qualité : hébergements 4★/5★, visites VIP
                  avec guide conférencier, transferts privatifs, coupe-file.
                </p>
              </div>
            </div>

            {/* RGPD */}
            <div className="lp-req-card">
              <div className="lp-req-icon lp-req-icon--green">🔒</div>
              <div>
                <h3 className="lp-req-title">Conformité RGPD</h3>
                <p className="lp-req-desc">
                  Aucune donnée nominative. Utilisez des pseudonymes de groupe pour les
                  crédits. Zéro cookie, zéro tracker, zéro clé API tierce.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          LES 2 MÉTHODES DE CRÉATION
          ════════════════════════════════════════════════════════ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <header className="lp-section-header">
            <span className="lp-section-eyebrow">Deux chemins possibles</span>
            <h2 className="lp-section-title">Choisissez votre méthode de création</h2>
            <p className="lp-section-desc">
              Deux méthodes sont disponibles au choix de votre équipe.
              Les deux produisent le même résultat final.
            </p>
          </header>

          <div className="lp-methods-grid">
            {/* Méthode A — Recommandée */}
            <div className="lp-method-card lp-method-card--recommended">
              <div className="lp-method-badge lp-method-badge--rec">
                ⭐ Recommandé
              </div>
              <h3 className="lp-method-title">Éditeur interactif StoryMap-GIT</h3>
              <p className="lp-method-subtitle">
                100% serverless, sans compte, conforme RGPD. Tout reste sur votre ordinateur.
              </p>
              <ol className="lp-method-steps">
                <li className="lp-method-step">
                  <span className="lp-method-step-num">1</span>
                  <span>Ouvrez l'application et recherchez vos lieux avec la barre Nominatim</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">2</span>
                  <span>Sélectionnez vos mobilités (marche, vélo, transport) et observez le tracé OSRM</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">3</span>
                  <span>Exportez la carte en image JPEG haute résolution pour vos dossiers</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">4</span>
                  <span>Cliquez sur « 🚀 Exporter pour WordPress » pour publier en ligne</span>
                </li>
              </ol>
            </div>

            {/* Méthode B — Tableur Excel / CSV */}
            <div className="lp-method-card lp-method-card--alt">
              <div className="lp-method-badge lp-method-badge--alt">
                📊 Tableur Excel / CSV
              </div>
              <h3 className="lp-method-title">Import Excel (.xlsx) / CSV</h3>
              <p className="lp-method-subtitle">
                Préparez votre parcours dans un tableur (Excel, Google Sheets, Calc) ou importez un published.json.
              </p>
              <ol className="lp-method-steps">
                <li className="lp-method-step">
                  <span className="lp-method-step-num">1</span>
                  <span>Téléchargez le modèle Excel et saisissez vos étapes (titres, descriptifs, mobilités)</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">2</span>
                  <span>Cliquez sur « Importer Excel / CSV » dans l'éditeur</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">3</span>
                  <span>Toutes vos étapes et tracés de parcours apparaissent instantanément</span>
                </li>
                <li className="lp-method-step">
                  <span className="lp-method-step-num">4</span>
                  <span>Ajustez les positions au besoin et exportez en JPEG ou WordPress</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA FINAL
          ════════════════════════════════════════════════════════ */}
      <section className="lp-bottom-cta">
        <div className="lp-bottom-cta-inner">
          <h2 className="lp-bottom-cta-title">
            Prêt à créer votre StoryMap ?
          </h2>
          <p className="lp-bottom-cta-desc">
            Lancez l'éditeur, construisez votre circuit touristique et
            publiez-le sur le site de la section en quelques minutes.
          </p>
          <button
            type="button"
            className="lp-bottom-cta-btn"
            onClick={onEnterApp}
          >
            🗺️ Lancer l'éditeur
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <p className="lp-footer-text">
          StoryMap-GIT — Fork pédagogique de{' '}
          <a href="https://github.com/NUKnightLab/StoryMapJS" target="_blank" rel="noopener noreferrer">
            StoryMapJS
          </a>{' '}
          (Knight Lab, licence ISC/MIT)
          <br />
          © Lycée Paul Éluard, BTS Tourisme GIT — Saint-Junien
        </p>
      </footer>
    </div>
  );
};
