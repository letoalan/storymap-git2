import React, { useState } from 'react';
import { StorySlideMedia } from '../types/story';

interface MediaUploaderProps {
  media?: StorySlideMedia;
  onChange: (media?: StorySlideMedia) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ media, onChange }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'url'>('url');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange({
        url: dataUrl,
        caption: media?.caption || '',
        credit: media?.credit || 'Fichier local élève',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'url' ? '2px solid #3182ce' : 'none',
            color: activeTab === 'url' ? '#3182ce' : '#718096',
            fontWeight: activeTab === 'url' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          🌐 Lien Web / URL Image
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'local' ? '2px solid #3182ce' : 'none',
            color: activeTab === 'local' ? '#3182ce' : '#718096',
            fontWeight: activeTab === 'local' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          📁 Image Locale (Base64 Autonome)
        </button>
      </div>

      {activeTab === 'url' ? (
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>
            URL de l'image (Wikimedia, Unsplash, etc.)
          </label>
          <input
            type="url"
            placeholder="https://upload.wikimedia.org/..."
            value={media?.url || ''}
            onChange={(e) =>
              onChange({
                url: e.target.value,
                caption: media?.caption || '',
                credit: media?.credit || '',
              })
            }
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? '#3182ce' : '#cbd5e0'}`,
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            background: isDragOver ? '#ebf8ff' : '#f7fafc',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>
            Glissez une image ici ou{' '}
            <label style={{ color: '#3182ce', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
              parcourez vos fichiers
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#a0aec0' }}>
            L image sera convertie en Base64 et sauvegardée directement dans le JSON.
          </p>
        </div>
      )}

      {/* Aperçu d image */}
      {media?.url && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f7fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #edf2f7' }}>
          <img
            src={media.url}
            alt={media.caption || 'Aperçu'}
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e0' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"><text x="5" y="15" font-size="10">Erreur Img</text></svg>';
            }}
          />
          <div style={{ flex: 1, fontSize: '0.75rem', color: '#4a5568', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ fontWeight: 600, display: 'block' }}>Aperçu de l image sélectionnée</span>
            <span style={{ whiteSpace: 'nowrap' }}>{media.url.substring(0, 45)}...</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            style={{
              background: '#fed7d7',
              color: '#9b2c2c',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Supprimer
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Légende (Caption)</label>
          <input
            type="text"
            placeholder="Ex : Vue panoramique du théâtre"
            value={media?.caption || ''}
            onChange={(e) =>
              onChange({
                url: media?.url || '',
                caption: e.target.value,
                credit: media?.credit || '',
              })
            }
            style={{
              width: '100%',
              padding: '0.35rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4a5568' }}>Crédit / Auteur</label>
          <input
            type="text"
            placeholder="Ex : Photo Domaine Public / Éluard Tourisme"
            value={media?.credit || ''}
            onChange={(e) =>
              onChange({
                url: media?.url || '',
                caption: media?.caption || '',
                credit: e.target.value,
              })
            }
            style={{
              width: '100%',
              padding: '0.35rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e0',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>
    </div>
  );
};
