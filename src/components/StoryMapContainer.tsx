import React, { useState } from 'react';
import { StoryData } from '../types/story';
import { StoryMapView } from './StoryMapView';
import { StorySlide } from './StorySlide';
import { StoryNavigation } from './StoryNavigation';
import { MapStyleType } from '../utils/pmtilesProtocol';

interface StoryMapContainerProps {
  data: StoryData;
  mapStyle?: MapStyleType;
  tilesBaseUrl?: string;
}

export const StoryMapContainer: React.FC<StoryMapContainerProps> = ({
  data,
  mapStyle = 'base',
  tilesBaseUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyleType>(
    data.mapStyle || mapStyle || 'editorial'
  );

  // Synchronisation si le jeu de données change (import ou fichier)
  React.useEffect(() => {
    if (data.mapStyle) {
      setCurrentMapStyle(data.mapStyle);
    }
  }, [data.mapStyle]);

  if (!data.slides || data.slides.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Aucune étape à afficher dans la StoryMap.</p>
      </div>
    );
  }

  const currentSlide = data.slides[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < data.slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const effectiveMapStyle = currentMapStyle || data.mapStyle || mapStyle || 'editorial';

  return (
    <div className="storymap-app-container" style={styles.container}>
      {/* Layout Carte Dominante (65% carte / 35% slide) */}
      <div style={styles.layout}>
        <div style={styles.mapSection}>
          <StoryMapView
            location={currentSlide.location}
            slides={data.slides}
            currentIndex={currentIndex}
            mapStyle={effectiveMapStyle}
            tilesBaseUrl={tilesBaseUrl}
            storyData={{
              ...data,
              mapStyle: effectiveMapStyle,
            }}
            onStyleChange={(newStyle) => {
              setCurrentMapStyle(newStyle);
            }}
            onSelectSlide={setCurrentIndex}
          />
        </div>

        <div style={styles.slideSection}>
          <StorySlide
            slide={currentSlide}
            currentIndex={currentIndex}
            totalSlides={data.slides.length}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      </div>

      <StoryNavigation
        slides={data.slides}
        currentIndex={currentIndex}
        onSelectSlide={setCurrentIndex}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    boxSizing: 'border-box',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '0.75rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '65% 35%',
    gap: '1.25rem',
    minHeight: '700px',
    boxSizing: 'border-box',
  },
  mapSection: {
    minHeight: '660px',
    height: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
  },
  slideSection: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '660px',
  },
};
