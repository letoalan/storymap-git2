import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoryData } from '../types/story';
import { MapStyleType } from '../utils/pmtilesProtocol';
import {
  buildStandaloneGitHubPagesHTML,
  buildWordPressFragmentHTML,
  buildKnightLabJsonString,
  getDefaultScriptUrl,
} from '../utils/standaloneHtmlBuilder';
import './ExportCodePad.css';

interface ExportCodePadProps {
  storyData: StoryData;
  onBackToEditor?: () => void;
}

export type ExportFormat = 'github-pages' | 'wordpress' | 'json';

export const ExportCodePad: React.FC<ExportCodePadProps> = ({ storyData, onBackToEditor }) => {
  const [format, setFormat] = useState<ExportFormat>('github-pages');
  const [pageTitle, setPageTitle] = useState<string>(
    () => storyData.slides[0]?.text?.headline || 'Mon Parcours Touristique'
  );
  const [scriptUrl, setScriptUrl] = useState<string>(() => getDefaultScriptUrl());
  const [mapStyle, setMapStyle] = useState<MapStyleType>(
    () => storyData.mapStyle || 'editorial'
  );

  const [codeContent, setCodeContent] = useState<string>('');
  const [isModified, setIsModified] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'cut' } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  // Synchroniser le titre avec le premier slide si non modifié manuellement
  useEffect(() => {
    if (storyData.slides[0]?.text?.headline) {
      setPageTitle(storyData.slides[0].text.headline);
    }
  }, [storyData]);

  // Fonction de génération du code selon le format actif
  const generateCodeForFormat = useMemo(() => {
    return (fmt: ExportFormat): string => {
      const options = {
        pageTitle,
        scriptUrl,
        mapStyle,
      };

      switch (fmt) {
        case 'github-pages':
          return buildStandaloneGitHubPagesHTML(storyData, options);
        case 'wordpress':
          return buildWordPressFragmentHTML(storyData, options);
        case 'json':
          return buildKnightLabJsonString(storyData);
      }
    };
  }, [storyData, pageTitle, scriptUrl, mapStyle]);

  // Initialisation et mise à jour lors des changements de paramètres (si non coupé/modifié)
  useEffect(() => {
    if (!isModified) {
      setCodeContent(generateCodeForFormat(format));
    }
  }, [format, generateCodeForFormat, isModified]);

  // Synchronisation du défilement entre les numéros de ligne et la textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const showToast = (message: string, type: 'success' | 'cut' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // 📋 Action : Copier le code dans le presse-papier
  const handleCopy = async () => {
    const textToCopy = codeContent || generateCodeForFormat(format);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback document.execCommand
        const dummy = document.createElement('textarea');
        dummy.value = textToCopy;
        document.body.appendChild(dummy);
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
      }
      showToast('📋 Code copié dans le presse-papier !', 'success');
    } catch (err) {
      console.warn('Erreur copie presse-papier :', err);
      showToast('⚠️ Impossible de copier automatiquement (vérifiez vos permissions)', 'cut');
    }
  };

  // ✂️ Action : Couper le code (copie dans le presse-papier ET vide le pad)
  const handleCut = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Si une portion est sélectionnée dans la textarea, couper uniquement la sélection
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selectedText = codeContent.substring(start, end);
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (e) {
        /* fallback */
      }
      const newContent = codeContent.substring(0, start) + codeContent.substring(end);
      setCodeContent(newContent);
      setIsModified(true);
      showToast('✂️ Sélection coupée et copiée !', 'cut');
      return;
    }

    // Sinon, couper l'intégralité du contenu du pad
    try {
      await navigator.clipboard.writeText(codeContent);
    } catch (e) {
      /* fallback */
    }
    setCodeContent('');
    setIsModified(true);
    showToast('✂️ Code intégral coupé et copié ! Cliquez sur "Régénérer" pour le restaurer à tout moment.', 'cut');
  };

  // 🔄 Action : Régénérer / Restaurer le code depuis les données du parcours
  const handleRegenerate = () => {
    const freshCode = generateCodeForFormat(format);
    setCodeContent(freshCode);
    setIsModified(false);
    showToast('🔄 Code régénéré et synchronisé avec le parcours !', 'success');
  };

  // 📥 Action : Télécharger le fichier index.html / json
  const handleDownload = () => {
    const content = codeContent || generateCodeForFormat(format);
    let filename = 'index.html';
    let mimeType = 'text/html;charset=utf-8';

    if (format === 'wordpress') {
      filename = 'storymap-fragment.html';
    } else if (format === 'json') {
      filename = 'storymap-published.json';
      mimeType = 'application/json;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📥 Fichier "${filename}" téléchargé !`, 'success');
  };

  // 👁️ Action : Tester en direct dans un nouvel onglet (Blob URL)
  const handlePreviewInNewTab = () => {
    const content = codeContent || generateCodeForFormat(format);
    let htmlToOpen = content;

    if (format === 'wordpress') {
      htmlToOpen = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Aperçu Bloc WordPress</title></head><body style="margin:20px;font-family:sans-serif;">${content}</body></html>`;
    } else if (format === 'json') {
      htmlToOpen = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Aperçu JSON</title></head><body><pre style="padding:20px;font-family:monospace;">${content.replace(/</g, '&lt;')}</pre></body></html>`;
    }

    const blob = new Blob([htmlToOpen], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Calcul du nombre de lignes et de la taille en Ko
  const linesCount = useMemo(() => {
    return codeContent ? codeContent.split('\n').length : 0;
  }, [codeContent]);

  const sizeKb = useMemo(() => {
    return (new Blob([codeContent]).size / 1024).toFixed(1);
  }, [codeContent]);

  return (
    <div className="export-pad-container">
      {/* ── Tutoriel Pédagogique Dépliable pour GitHub Pages ────────── */}
      <div className="export-guide-card">
        <div className="export-guide-header" onClick={() => setShowGuide(!showGuide)}>
          <h3 className="export-guide-title">
            <span>🚀</span>
            <span>Guide BTS Tourisme : Publier votre StoryMap en 3 étapes sur GitHub Pages</span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
            {showGuide ? '▴ Réduire le guide' : '▾ Déplier les explications'}
          </span>
        </div>

        {showGuide && (
          <div className="export-guide-steps">
            <div className="export-step-item">
              <div className="export-step-number">1</div>
              <p className="export-step-text">
                <strong>Créer le dépôt GitHub :</strong> Rendez-vous sur votre compte <strong>GitHub</strong>, cliquez sur <em>New repository</em>, nommez-le (ex: <span className="export-step-code">parcours-taormine</span>) et cochez <strong>Public</strong>.
              </p>
            </div>

            <div className="export-step-item">
              <div className="export-step-number">2</div>
              <p className="export-step-text">
                <strong>Créer le fichier index.html :</strong> Cliquez sur <em>Add file &gt; Create new file</em>, nommez le fichier exactement <span className="export-step-code">index.html</span>, et <strong>collez</strong> le code du pad ci-dessous (ou glissez le fichier téléchargé).
              </p>
            </div>

            <div className="export-step-item">
              <div className="export-step-number">3</div>
              <p className="export-step-text">
                <strong>Activer GitHub Pages :</strong> Dans <em>Settings &gt; Pages</em>, sous <em>Branch</em>, choisissez <span className="export-step-code">main</span> et le dossier <span className="export-step-code">/ (root)</span>, puis cliquez sur <strong>Save</strong>.
              </p>
            </div>

            <div className="export-step-item" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="export-step-number" style={{ background: '#16a34a' }}>✓</div>
              <p className="export-step-text" style={{ color: '#166534' }}>
                <strong>En ligne mondialement !</strong> Votre circuit touristique sera consultable par vos enseignants et vos clients à l'adresse <span className="export-step-code" style={{ background: '#dcfce7', borderColor: '#86efac' }}>https://&lt;pseudo&gt;.github.io/&lt;depot&gt;/</span>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Carte Principale du Pad ────────────────────────────────── */}
      <div className="export-pad-card">
        {/* Barre d'onglets de formats & métadonnées */}
        <div className="export-pad-toolbar">
          <div className="export-pad-tabs">
            <button
              type="button"
              className={`export-pad-tab-btn ${format === 'github-pages' ? 'active' : ''}`}
              onClick={() => {
                setFormat('github-pages');
                setIsModified(false);
              }}
              title="Page HTML5 complète et autonome prête pour GitHub Pages"
            >
              🌐 Page Autonome (GitHub Pages)
            </button>
            <button
              type="button"
              className={`export-pad-tab-btn ${format === 'wordpress' ? 'active' : ''}`}
              onClick={() => {
                setFormat('wordpress');
                setIsModified(false);
              }}
              title="Bloc de code léger pour WordPress Gutenberg (HTML personnalisé)"
            >
              🧩 Bloc WordPress
            </button>
            <button
              type="button"
              className={`export-pad-tab-btn ${format === 'json' ? 'active' : ''}`}
              onClick={() => {
                setFormat('json');
                setIsModified(false);
              }}
              title="Données brutes au format Knight Lab standard"
            >
              📄 Données JSON
            </button>
            {onBackToEditor && (
              <button
                type="button"
                className="export-pad-tab-btn"
                onClick={onBackToEditor}
                title="Revenir à l'éditeur pour ajuster les étapes ou les textes"
                style={{ color: '#1d4ed8' }}
              >
                ✍️ Éditeur
              </button>
            )}
          </div>

          <div className="export-pad-meta">
            {isModified && (
              <span style={{ color: '#b45309', fontWeight: 600 }}>
                ✏️ Modifié manuellement
              </span>
            )}
            <span className="export-pad-badge">{linesCount} lignes</span>
            <span className="export-pad-badge">{sizeKb} Ko</span>
            <button
              type="button"
              className="export-options-toggle"
              onClick={() => setShowOptions(!showOptions)}
              title="Afficher les options avancées de génération"
            >
              ⚙️ {showOptions ? 'Masquer paramètres' : 'Paramètres'}
            </button>
          </div>
        </div>

        {/* Panneau rétractable d'options avancées */}
        {showOptions && (
          <div className="export-options-panel">
            <div className="export-option-group">
              <label className="export-option-label">Titre du document HTML (&lt;title&gt;) :</label>
              <input
                type="text"
                className="export-option-input"
                value={pageTitle}
                onChange={(e) => {
                  setPageTitle(e.target.value);
                  setIsModified(false);
                }}
                placeholder="Ex: Visite Découverte de Taormine"
              />
            </div>

            <div className="export-option-group">
              <label className="export-option-label">Fond de carte par défaut :</label>
              <select
                className="export-option-input"
                value={mapStyle}
                onChange={(e) => {
                  setMapStyle(e.target.value as MapStyleType);
                  setIsModified(false);
                }}
              >
                <option value="editorial">🎨 Éditorial Élégant (CartoDB Positron)</option>
                <option value="base">🗺️ OpenStreetMap Standard</option>
                <option value="relief">⛰️ Relief & Topographie (OpenTopoMap)</option>
                <option value="securite">🛰️ Satellite ESRI & Sécurité</option>
              </select>
            </div>

            <div className="export-option-group">
              <label className="export-option-label">URL du moteur StoryMap-GIT (.js) :</label>
              <input
                type="text"
                className="export-option-input"
                value={scriptUrl}
                onChange={(e) => {
                  setScriptUrl(e.target.value);
                  setIsModified(false);
                }}
                placeholder="https://.../storymap-git.js"
              />
            </div>
          </div>
        )}

        {/* Barre des Actions (Copier, Couper, Restaurer, Télécharger, Tester) */}
        <div className="export-pad-actions-bar">
          <div className="export-pad-btn-group">
            {/* 📋 Bouton COPIER */}
            <button
              type="button"
              className="export-btn export-btn-primary"
              onClick={handleCopy}
              title="Copier tout le code dans le presse-papier"
            >
              <span>📋</span>
              <span>Copier le code</span>
            </button>

            {/* ✂️ Bouton COUPER */}
            <button
              type="button"
              className="export-btn export-btn-cut"
              onClick={handleCut}
              title="Couper le code ou la sélection (le copie dans le presse-papier et vide le pad)"
            >
              <span>✂️</span>
              <span>Couper</span>
            </button>

            {/* 🔄 Bouton RÉGÉNÉRER / RESTAURER */}
            {isModified && (
              <button
                type="button"
                className="export-btn export-btn-restore"
                onClick={handleRegenerate}
                title="Rétablir le code initial synchronisé avec l'éditeur"
              >
                <span>🔄</span>
                <span>Régénérer le code</span>
              </button>
            )}

            {/* 📥 Bouton TÉLÉCHARGER */}
            <button
              type="button"
              className="export-btn export-btn-secondary"
              onClick={handleDownload}
              title="Télécharger le fichier sur votre ordinateur"
            >
              <span>📥</span>
              <span>
                Télécharger {format === 'github-pages' ? 'index.html' : format === 'json' ? '.json' : '.html'}
              </span>
            </button>
          </div>

          <div className="export-pad-btn-group">
            {/* Bascule retour à la ligne */}
            <button
              type="button"
              className="export-btn export-btn-secondary"
              onClick={() => setWordWrap(!wordWrap)}
              title="Activer ou désactiver le retour à la ligne automatique"
            >
              <span>{wordWrap ? '↩️' : '➡️'}</span>
              <span>{wordWrap ? 'Lignes coupées : Oui' : 'Lignes longues'}</span>
            </button>

            {/* 👁️ Tester en direct */}
            <button
              type="button"
              className="export-btn export-btn-preview"
              onClick={handlePreviewInNewTab}
              title="Tester le rendu réel de ce code autonome dans un nouvel onglet"
            >
              <span>👁️</span>
              <span>Tester dans un nouvel onglet</span>
            </button>
          </div>
        </div>

        {/* Zone Éditeur / Pad de code */}
        <div className="export-pad-editor-wrapper">
          {/* Numéros de lignes synchronisés */}
          <div ref={gutterRef} className="export-pad-gutter" aria-hidden="true">
            {Array.from({ length: Math.max(linesCount, 1) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Champ de texte éditable */}
          <textarea
            ref={textareaRef}
            className={`export-pad-textarea ${wordWrap ? 'wrap' : ''}`}
            value={codeContent}
            onChange={(e) => {
              setCodeContent(e.target.value);
              setIsModified(true);
            }}
            onScroll={handleScroll}
            placeholder="Le code apparaîtra ici..."
            spellCheck={false}
          />

          {/* État vide si coupé */}
          {!codeContent && (
            <div className="export-pad-empty-state">
              <span style={{ fontSize: '2rem' }}>✂️</span>
              <p style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                Le code a été coupé et se trouve dans votre presse-papier !
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Vous pouvez le coller directement sur GitHub (Ctrl+V) ou le restaurer ici :
              </p>
              <button
                type="button"
                className="export-btn export-btn-restore"
                onClick={handleRegenerate}
              >
                🔄 Restaurer le code dans le Pad
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast animé de notification ─────────────────────────────── */}
      {toast && (
        <div className={`export-pad-toast ${toast.type}`}>
          <span>{toast.type === 'cut' ? '✂️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
