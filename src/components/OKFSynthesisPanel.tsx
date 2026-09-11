import React, { useState, useEffect } from 'react';
import { OKFSynthesisData, normalizeOKFData } from '../types/okfSynthesis';
import { buildSelfContainedHTML } from '../utils/fragmentBuilder';

const LOCAL_STORAGE_KEY = 'storymap_okf_synthesis_v2';

const THEME_STYLES: Record<string, { bg: string; border: string; borderLeft: string; text: string }> = {
  red: { bg: '#fff5f5', border: '#fecdd3', borderLeft: '#ef4444', text: '#991b1b' },
  green: { bg: '#f0fdf4', border: '#bbf7d0', borderLeft: '#22c55e', text: '#166534' },
  emerald: { bg: '#ecfdf5', border: '#a7f3d0', borderLeft: '#10b981', text: '#065f46' },
  blue: { bg: '#eff6ff', border: '#bfdbfe', borderLeft: '#3b82f6', text: '#1e40af' },
  amber: { bg: '#fffbeb', border: '#fde68a', borderLeft: '#f59e0b', text: '#92400e' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', borderLeft: '#a855f7', text: '#6b21a8' },
  slate: { bg: '#f8fafc', border: '#cbd5e1', borderLeft: '#64748b', text: '#334155' },
};

export const OKFSynthesisPanel: React.FC = () => {
  const [data, setData] = useState<OKFSynthesisData | null>(null);
  const [isImported, setIsImported] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Charger la synthèse sauvegardée dans localStorage au démarrage s'il y en a une
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeOKFData(parsed);
        if (normalized && normalized.cards.length > 0) {
          setData(normalized);
          setIsImported(true);
        }
      }
    } catch (e) {
      console.warn('Erreur chargement synthèse OKF:', e);
    }
  }, []);

  const handleSaveData = (newData: OKFSynthesisData) => {
    setData(newData);
    setIsImported(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Erreur sauvegarde synthèse OKF:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        const normalized = normalizeOKFData(parsed);

        if (!normalized || normalized.cards.length === 0) {
          throw new Error('Fichier OKF non reconnu ou ne contenant aucune thématique.');
        }

        handleSaveData(normalized);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message || 'Erreur lors de la lecture du fichier JSON OKF.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearImport = () => {
    if (window.confirm('Effacer la synthèse importée ? Les conteneurs repasseront en attente d\'import.')) {
      setIsImported(false);
      setData(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Copier le fragment HTML complet pour WordPress (StoryMap + Synthèse OKF)
  const handleCopyFragment = () => {
    try {
      let storyDataRaw = null;
      try {
        const draftRaw = localStorage.getItem('storymap_git_local_draft');
        if (draftRaw) {
          storyDataRaw = JSON.parse(draftRaw);
        }
      } catch (e) {}

      const fragmentCode = buildSelfContainedHTML(storyDataRaw, {
        showBento: false,
        okfData: isImported && data ? data : undefined,
      });

      navigator.clipboard.writeText(fragmentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch (err: any) {
      setErrorMsg('Erreur lors de la génération du fragment WordPress : ' + err.message);
    }
  };

  return (
    <div
      style={{
        marginTop: '1.75rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* En-tête du Panneau OKF */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.35rem' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
              Fiche de Synthèse du Parcours Touristique (OKF — RssFeeder-GIT)
            </h3>
            {isImported && data?.meta?.groupName && (
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                {data.meta.groupName} {data.meta.author ? `• ${data.meta.author}` : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Bouton d'importation modernisé */}
          <label
            htmlFor="okf-file-upload-input"
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            📂 Importer une synthèse OKF (.json)
          </label>
          <input
            id="okf-file-upload-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {isImported && (
            <button
              type="button"
              onClick={handleClearImport}
              title="Effacer la synthèse importée"
              style={{
                padding: '0.48rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🗑️ Effacer l'import
            </button>
          )}
        </div>
      </div>

      {/* Rendu des conteneurs thématiques :
          - Vides & Sans Titres avant import (isImported = false)
          - Remplis dynamiquement avec Titres et Thématiques Libres après import (isImported = true)
      */}
      {!isImported || !data || data.cards.length === 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            boxSizing: 'border-box',
          }}
        >
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                minHeight: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              En attente de l'importation de la synthèse OKF...
            </div>
          ))}
        </div>
      ) : (
        /* Cartes de Synthèse Dynamiques (Thématiques Libres Importées) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            boxSizing: 'border-box',
          }}
        >
          {data.cards.map((card, index) => {
            const themeKey = (card.color || 'blue').toLowerCase();
            const theme = THEME_STYLES[themeKey] || THEME_STYLES['blue'];

            return (
              <div
                key={card.id || index}
                style={{
                  background: theme.bg,
                  border: `1.5px solid ${theme.border}`,
                  borderLeft: `5px solid ${theme.borderLeft}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {/* Titre & Icône */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {card.icon && <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>}
                  <strong style={{ fontSize: '0.9rem', color: theme.text, fontWeight: 800 }}>
                    {card.title}
                  </strong>
                </div>

                {/* Contenu textuel principal */}
                {card.content && (
                  <div
                    style={{ fontSize: '0.82rem', color: theme.text, lineHeight: 1.5, flex: 1 }}
                    dangerouslySetInnerHTML={{ __html: card.content.replace(/\n/g, '<br/>') }}
                  />
                )}

                {/* Badges / Inclusions */}
                {card.badges && card.badges.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {card.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '6px',
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.72rem',
                          color: theme.text,
                          fontWeight: 700,
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pied de carte / Footer */}
                {card.footer && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      color: theme.text,
                      fontWeight: 700,
                    }}
                  >
                    {card.footer}
                  </div>
                )}

                {/* Liens / Sources RSS */}
                {card.links && card.links.length > 0 && (
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: theme.text, fontWeight: 700 }}>
                      📡 Liens / Sources :
                    </span>
                    {card.links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.72rem',
                          color: '#1d4ed8',
                          textDecoration: 'underline',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Message d'erreur éventuel */}
      {errorMsg && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Bouton d'exportation WordPress au bas du panneau d'import OKF */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        <button
          type="button"
          onClick={handleCopyFragment}
          style={{
            width: '100%',
            padding: '0.85rem 1.25rem',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {copied
            ? '✅ Fragment HTML (StoryMap + Synthèse OKF) copié dans le presse-papier !'
            : '📋 Copier le fragment HTML pour WordPress (StoryMap + Synthèse OKF)'}
        </button>
      </div>
    </div>
  );
};
