import React, { useState } from 'react';
import { parseKnightLabJson } from '../utils/jsonToStoryData';
import { StoryMapContainer } from './StoryMapContainer';
import { SlideEditor } from '../editor/SlideEditor';
import { useLocalDraft } from '../editor/useLocalDraft';
import { formatToKnightLabJson } from '../editor/storyDataExport';
import { parseSpreadsheetFile, downloadSampleExcel } from '../utils/csvImporter';
import { StoryData } from '../types/story';
import { ExportCodePad } from './ExportCodePad';

export const StoryConverterUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'studio'>('editor');
  const { storyData, saveDraft, resetDraft, lastSaved, importJsonData } = useLocalDraft();

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  // Transfert de l'éditeur vers le studio
  const handleSendToStudio = (currentStoryData: StoryData) => {
    saveDraft(currentStoryData);
    setSelectedFileName('Brouillon Éditeur (synchronisé)');
    setActiveTab('studio');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setErrorMsg(null);

    const isJson = file.name.endsWith('.json');

    try {
      if (isJson) {
        const text = await file.text();
        const raw = JSON.parse(text);
        const parsed = parseKnightLabJson(raw);
        importJsonData(raw);
        saveDraft(parsed);
      } else {
        // Tableurs : Excel (.xlsx, .xls) ou CSV (.csv, .tsv)
        const parsed = await parseSpreadsheetFile(file);
        const formatted = formatToKnightLabJson(parsed);
        importJsonData(formatted);
        saveDraft(parsed);
      }
    } catch (err: any) {
      setErrorMsg(`Erreur lors du traitement du fichier : ${err?.message || err}`);
    } finally {
      e.target.value = '';
    }
  };

  const slideCount = storyData.slides.length;
  const circuitTitle = storyData.slides[0]?.text?.headline || 'Mon Parcours Touristique';
  const isBtsCompliant = slideCount >= 10;

  return (
    <div style={styles.container}>
      {/* Navigation Onglets Haut de Page */}
      <nav style={styles.navTabs}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🗺️</span>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
            StoryMapJS-GIT
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'editor' ? styles.activeTab : {}),
            }}
          >
            ✍️ Éditer mon parcours ({slideCount} étapes)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
            }}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'studio' ? styles.activeTab : {}),
            }}
          >
            📤 Exporter & Publier (GitHub Pages)
          </button>
        </div>
      </nav>

      {/* VUE 1 : Éditeur */}
      {activeTab === 'editor' && (
        <SlideEditor
          storyData={storyData}
          onChange={saveDraft}
          onSendToStudio={handleSendToStudio}
          lastSaved={lastSaved}
          onResetDraft={resetDraft}
        />
      )}

      {/* VUE 2 : Studio d'Exportation */}
      {activeTab === 'studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <header style={styles.header}>
            <h1 style={styles.title}>📤 Studio d'Exportation & Publication Autonome</h1>
            <p style={styles.subtitle}>
              BTS Tourisme GIT (Lycée Paul Éluard, Saint-Junien) • Publication web 100% autonome sur GitHub Pages
            </p>
          </header>

          {/* Bandeau de synthèse du parcours actif */}
          <div style={styles.summaryBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem' }}>📍</span>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                  {circuitTitle}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {selectedFileName ? `Source : ${selectedFileName}` : 'Brouillon actif dans votre navigateur'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: isBtsCompliant ? '#dcfce7' : '#fef3c7',
                  color: isBtsCompliant ? '#166534' : '#92400e',
                  border: `1px solid ${isBtsCompliant ? '#86efac' : '#fde68a'}`,
                }}
              >
                {isBtsCompliant ? `✓ Conforme BTS (${slideCount} étapes)` : `⚠️ ${slideCount}/10 étapes BTS recommandées`}
              </span>

              <button
                type="button"
                onClick={() => setShowImportBox(!showImportBox)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                📁 {showImportBox ? 'Masquer import' : 'Importer autre fichier'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  cursor: 'pointer',
                }}
              >
                ✏️ Modifier dans l'éditeur
              </button>
            </div>
          </div>

          {/* Tiroir optionnel d'import de fichier */}
          {showImportBox && (
            <div style={styles.controlBox}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={styles.label}>
                  📂 Importer un autre fichier de circuit (JSON StoryMap ou tableau Excel / CSV) :
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <label
                    htmlFor="story-file-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.1rem',
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    📁 Choisir un fichier...
                  </label>
                  <input
                    id="story-file-upload"
                    type="file"
                    accept=".xlsx,.xls,.ods,.json,.csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => downloadSampleExcel()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem 0.9rem',
                      background: '#ffffff',
                      color: '#15803d',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    📥 Télécharger modèle Excel type
                  </button>
                </div>
              </div>

              {errorMsg && <p style={styles.errorText}>❌ {errorMsg}</p>}
            </div>
          )}

          {/* PAD DE CODE INTERACTIF (COPIER / COUPER / TÉLÉCHARGER / APERÇU) */}
          <ExportCodePad
            storyData={storyData}
            onBackToEditor={() => setActiveTab('editor')}
          />

          {/* APERÇU INTERACTIF DE LA STORYMAP */}
          <div style={styles.previewSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 700 }}>
                🗺️ Aperçu interactif du circuit (Vue Élève & Client)
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Interactif • Défilement des slides et déplacement cartographique coordonné
              </span>
            </div>
            <StoryMapContainer data={storyData} />
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    boxSizing: 'border-box',
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '1.25rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  navTabs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.75rem',
  },
  tabButton: {
    padding: '0.65rem 1.4rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    color: '#ffffff',
    fontWeight: 800,
    border: 'none',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  title: {
    margin: '0 0 0.4rem 0',
    color: '#0f172a',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.95rem',
  },
  summaryBar: {
    background: '#ffffff',
    padding: '1rem 1.25rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.85rem',
  },
  controlBox: {
    background: '#ffffff',
    padding: '1.25rem',
    borderRadius: '14px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
  },
  label: {
    display: 'block',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#1e3a8a',
    fontSize: '0.9rem',
  },
  errorText: {
    color: '#dc2626',
    marginTop: '0.75rem',
    fontWeight: 600,
  },
  previewSection: {
    background: '#ffffff',
    padding: '1.25rem',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
  },
};
