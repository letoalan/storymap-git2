import React, { useState } from 'react';
import { parseKnightLabJson } from '../utils/jsonToStoryData';
import { StoryMapContainer } from './StoryMapContainer';
import { SlideEditor } from '../editor/SlideEditor';
import { useLocalDraft } from '../editor/useLocalDraft';
import { formatToKnightLabJson } from '../editor/storyDataExport';
import { parseSpreadsheetFile, downloadSampleExcel } from '../utils/csvImporter';
import { StoryData } from '../types/story';

export const StoryConverterUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'studio'>('editor');
  const { storyData, saveDraft, resetDraft, lastSaved, importJsonData } = useLocalDraft();

  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(formatToKnightLabJson(storyData), null, 2));
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transfert de l'éditeur vers le studio
  const handleSendToStudio = (currentStoryData: StoryData) => {
    const formatted = formatToKnightLabJson(currentStoryData);
    setJsonText(JSON.stringify(formatted, null, 2));
    setSelectedFileName('Brouillon Éditeur (sauvegardé)');
    setActiveTab('studio');
  };

  let parsedData = null;

  try {
    const raw = JSON.parse(jsonText);
    parsedData = parseKnightLabJson(raw);
  } catch (e: any) {
    // Keep errorMsg for display
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setErrorMsg(null);

    const isJson = file.name.endsWith('.json');

    try {
      if (isJson) {
        const text = await file.text();
        setJsonText(text);
        const raw = JSON.parse(text);
        importJsonData(raw);
      } else {
        // Tableurs : Excel (.xlsx, .xls) ou CSV (.csv, .tsv)
        const parsed = await parseSpreadsheetFile(file);
        const formatted = formatToKnightLabJson(parsed);
        importJsonData(formatted);
        setJsonText(JSON.stringify(formatted, null, 2));
      }
    } catch (err: any) {
      setErrorMsg(`Erreur lors du traitement du fichier : ${err?.message || err}`);
    } finally {
      e.target.value = '';
    }
  };

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
            ✍️ Créer mon parcours
          </button>
          <button
            type="button"
            onClick={() => {
              // Synchroniser les données courantes lors de la bascule
              const formatted = formatToKnightLabJson(storyData);
              setJsonText(JSON.stringify(formatted, null, 2));
              setActiveTab('studio');
            }}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'studio' ? styles.activeTab : {}),
            }}
          >
            📤 Exporter & Valider
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

      {/* VUE 2 : Studio */}
      {activeTab === 'studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <header style={styles.header}>
            <h1 style={styles.title}>📤 StoryMap-GIT — Studio d'Exportation & Publication</h1>
            <p style={styles.subtitle}>BTS Tourisme GIT (Lycée Paul Éluard, Saint-Junien) • Architecture Serverless RGPD</p>
          </header>

          <div style={styles.controlBox}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={styles.label}>
                📂 Importer un fichier de parcours (JSON StoryMap ou tableau CSV / Excel) :
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label
                  htmlFor="story-file-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.25rem',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📁 Choisir un fichier (Excel, CSV ou JSON)...
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
                    padding: '0.65rem 1rem',
                    background: '#ffffff',
                    color: '#15803d',
                    borderRadius: '10px',
                    border: '1px solid #bbf7d0',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  📥 Modèle Excel (.xlsx)
                </button>

                {selectedFileName && (
                  <span style={{ fontSize: '0.82rem', background: '#dbeafe', color: '#1e40af', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                    📄 Fichier chargé : {selectedFileName}
                  </span>
                )}
              </div>
            </div>

            {errorMsg && <p style={styles.errorText}>❌ {errorMsg}</p>}
          </div>

          <div style={styles.previewSection}>
            <h3 style={styles.previewTitle}>🗺️ Aperçu du Parcours & Mobilités</h3>
            {parsedData ? (
              <StoryMapContainer data={parsedData} />
            ) : (
              <p style={{ color: '#f87171' }}>JSON invalide ou en cours de saisie...</p>
            )}
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
    maxWidth: '1380px',
    margin: '0 auto',
    padding: '1.5rem',
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
    marginBottom: '1rem',
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
  controlBox: {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    marginBottom: '1.5rem',
    border: '1px solid #e2e8f0',
  },
  inputGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#1e3a8a',
    fontSize: '0.9rem',
  },
  fileInput: {
    padding: '0.4rem',
    color: '#334155',
  },
  textarea: {
    width: '100%',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    boxSizing: 'border-box',
  },
  reportBox: {
    padding: '1rem',
    background: '#eff6ff',
    borderRadius: '12px',
    border: '1px solid #bfdbfe',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
  },
  warningText: {
    margin: '0.35rem 0 0 0',
    color: '#b45309',
    fontSize: '0.85rem',
  },
  copyBtn: {
    width: '100%',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s ease',
  },
  errorText: {
    color: '#dc2626',
    marginTop: '0.75rem',
    fontWeight: 600,
  },
  previewSection: {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
  },
  previewTitle: {
    margin: '0 0 1.25rem 0',
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.6rem',
    fontSize: '1.2rem',
    fontWeight: 700,
  },
};
