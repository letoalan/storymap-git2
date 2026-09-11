import React, { useEffect } from 'react';
import { StorySlide } from '../types/story';

interface StoryNavigationProps {
  slides: StorySlide[];
  currentIndex: number;
  onSelectSlide: (index: number) => void;
}

export const StoryNavigation: React.FC<StoryNavigationProps> = ({
  slides,
  currentIndex,
  onSelectSlide,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectSlide(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < slides.length - 1) {
        onSelectSlide(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, onSelectSlide]);

  return (
    <nav className="story-navigation" style={styles.nav}>
      <div style={styles.dotsList}>
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => onSelectSlide(idx)}
              title={slide.text.headline}
              aria-label={`Étape ${idx + 1}: ${slide.text.headline}`}
              style={{
                ...styles.dot,
                ...(isActive ? styles.dotActive : styles.dotInactive),
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
    marginTop: '0.75rem',
  },
  dotsList: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    padding: '0.25rem',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  dotActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    transform: 'scale(1.15)',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
    fontWeight: 800,
  },
  dotInactive: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #cbd5e1',
  },
};
