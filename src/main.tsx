import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { parseKnightLabJson } from './utils/jsonToStoryData';
import { StoryMapContainer } from './components/StoryMapContainer';
import { StoryConverterUI } from './components/StoryConverterUI';
import { LandingPage } from './components/LandingPage';
import { MapStyleType } from './utils/pmtilesProtocol';
import taorminaSample from '../examples/taormina.json';

export interface RenderOptions {
  mapStyle?: MapStyleType;
  tilesBaseUrl?: string;
  showBento?: boolean;
}

export function renderStoryMap(containerId: string, rawJson?: unknown, options: RenderOptions = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`StoryMap-GIT: Conteneur #${containerId} introuvable`);
    return;
  }

  const jsonToParse = rawJson || taorminaSample;
  const storyData = parseKnightLabJson(jsonToParse);

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <div className="storymap-git-wrapper">
        <StoryMapContainer
          data={storyData}
          mapStyle={options.mapStyle || storyData.mapStyle || 'editorial'}
          tilesBaseUrl={options.tilesBaseUrl}
        />
      </div>
    </React.StrictMode>
  );
}

/**
 * App Shell — Gère la navigation entre la landing page et l'application.
 * Affiche la landing page au premier chargement, puis bascule vers
 * le Studio/Éditeur lorsque l'étudiant clique sur « Commencer ».
 */
const AppShell: React.FC = () => {
  const [page, setPage] = useState<'landing' | 'app'>('landing');

  if (page === 'landing') {
    return <LandingPage onEnterApp={() => setPage('app')} />;
  }

  return <StoryConverterUI />;
};

// Dev preview studio lors de l'exécution npm run dev
if (typeof document !== 'undefined') {
  const defaultContainer = document.getElementById('storymap-git-root');
  if (defaultContainer) {
    const root = ReactDOM.createRoot(defaultContainer);
    root.render(
      <React.StrictMode>
        <AppShell />
      </React.StrictMode>
    );
  }
}

