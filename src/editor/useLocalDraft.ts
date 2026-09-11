import { useState, useEffect, useCallback } from 'react';
import { StoryData } from '../types/story';
import { createDefaultStoryData } from './storyDataExport';
import { parseKnightLabJson } from '../utils/jsonToStoryData';
import { parseCsvToStoryData } from '../utils/csvImporter';

const LOCAL_STORAGE_KEY = 'storymap_git_editor_draft_v2';
const LAST_SAVED_KEY = 'storymap_git_editor_last_saved';

export interface UseLocalDraftReturn {
  storyData: StoryData;
  setStoryData: React.Dispatch<React.SetStateAction<StoryData>>;
  lastSaved: string | null;
  saveDraft: (data: StoryData) => void;
  resetDraft: () => void;
  importJsonData: (rawJson: unknown) => void;
  importCsvData: (csvText: string) => void;
  importStoryData: (data: StoryData) => void;
}

export function useLocalDraft(): UseLocalDraftReturn {
  const [storyData, setStoryData] = useState<StoryData>(() => {
    if (typeof window === 'undefined') return createDefaultStoryData();
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parseKnightLabJson(parsed);
      }
    } catch (e) {
      console.warn('StoryMap-GIT: Erreur lors du chargement du brouillon localStorage', e);
    }
    return createDefaultStoryData();
  });

  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SAVED_KEY);
  });

  const saveDraft = useCallback((data: StoryData) => {
    setStoryData(data);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        localStorage.setItem(LAST_SAVED_KEY, now);
        setLastSaved(now);
      } catch (e) {
        console.error('StoryMap-GIT: Échec de sauvegarde dans localStorage', e);
      }
    }
  }, []);

  const resetDraft = useCallback(() => {
    const defaultData = createDefaultStoryData();
    setStoryData(defaultData);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LAST_SAVED_KEY);
      setLastSaved(null);
    }
  }, []);

  const importStoryData = useCallback((data: StoryData) => {
    saveDraft(data);
  }, [saveDraft]);

  const importJsonData = useCallback((rawJson: unknown) => {
    try {
      const parsed = parseKnightLabJson(rawJson);
      saveDraft(parsed);
    } catch (e) {
      console.error('StoryMap-GIT: Impossible d importer le JSON', e);
      throw e;
    }
  }, [saveDraft]);

  const importCsvData = useCallback((csvText: string) => {
    try {
      const parsed = parseCsvToStoryData(csvText);
      saveDraft(parsed);
    } catch (e) {
      console.error('StoryMap-GIT: Impossible d importer le CSV', e);
      throw e;
    }
  }, [saveDraft]);

  // Enregistrement automatique lors des modifications de storyData
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storyData));
          const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          localStorage.setItem(LAST_SAVED_KEY, now);
          setLastSaved(now);
        } catch (e) {
          // Silent catch
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [storyData]);

  return {
    storyData,
    setStoryData,
    lastSaved,
    saveDraft,
    resetDraft,
    importJsonData,
    importCsvData,
    importStoryData,
  };
}
