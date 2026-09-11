import React, { useState } from 'react';

export interface CustomTag {
  id: string;
  name: string;
  icon: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  description: string;
}

export const DEFAULT_CUSTOM_TAGS: CustomTag[] = [
  {
    id: 'tag-securite',
    name: 'Sécurité & Urgence',
    icon: '🛡️',
    colorBg: '#fee2e2',
    colorBorder: '#fca5a5',
    colorText: '#991b1b',
    description: 'Zone piétonne sécurisée. Numéro d\'urgence : 112. Point de rassemblement identifié.',
  },
  {
    id: 'tag-vip',
    name: 'Accès VIP',
    icon: '✨',
    colorBg: '#fef3c7',
    colorBorder: '#fde68a',
    colorText: '#92400e',
    description: 'Visite privative avec guide certifié. Accès prioritaire réservé au groupe.',
  },
  {
    id: 'tag-gastronomie',
    name: 'Gastronomie & Spécialités',
    icon: '🍷',
    colorBg: '#fef3c7',
    colorBorder: '#fde68a',
    colorText: '#92400e',
    description: 'Spécialités culinaires locales et étapes gourmandes recommandées.',
  },
  {
    id: 'tag-accessibilite',
    name: 'Accessibilité PMR',
    icon: '♿',
    colorBg: '#dbeafe',
    colorBorder: '#bfdbfe',
    colorText: '#1e40af',
    description: 'Accès aménagé aux personnes à mobilité réduite.',
  },
  {
    id: 'tag-eco',
    name: 'Éco-tourisme & Nature',
    icon: '🌱',
    colorBg: '#dcfce7',
    colorBorder: '#86efac',
    colorText: '#166534',
    description: 'Initiative éco-responsable et préservation du patrimoine naturel.',
  },
  {
    id: 'tag-incontournable',
    name: 'Incontournable',
    icon: '⭐',
    colorBg: '#f3e8ff',
    colorBorder: '#e9d5ff',
    colorText: '#6b21a8',
    description: 'Point clé et expérience immanquable du circuit.',
  },
  {
    id: 'tag-conseil',
    name: 'Conseil du Guide',
    icon: '💡',
    colorBg: '#ffedd5',
    colorBorder: '#fed7aa',
    colorText: '#9a3412',
    description: 'Recommandation pratique pour les visiteurs.',
  },
];

const PRESET_COLOR_THEMES = [
  { label: 'Jaune / Ambre', bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
  { label: 'Bleu', bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' },
  { label: 'Vert Émeraude', bg: '#dcfce7', border: '#86efac', text: '#166534' },
  { label: 'Violet', bg: '#f3e8ff', border: '#e9d5ff', text: '#6b21a8' },
  { label: 'Orange', bg: '#ffedd5', border: '#fed7aa', text: '#9a3412' },
  { label: 'Rouge', bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  { label: 'Gris Neutre', bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' },
];

const LOCAL_STORAGE_KEY = 'storymap_custom_tags_v3';

export function loadSavedTags(): CustomTag[] {
  try {
    const raw =
      localStorage.getItem(LOCAL_STORAGE_KEY) ||
      localStorage.getItem('storymap_custom_tags_v2') ||
      localStorage.getItem('storymap_custom_tags_v1');
    if (raw) {
      const parsed: CustomTag[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantir que la balise Sécurité & Urgence existe et est à jour
        const updated = parsed.map((t) => {
          if (t.id === 'tag-securite' || t.name.toLowerCase().includes('sécurité') || t.name.toLowerCase().includes('securite')) {
            return {
              ...t,
              id: 'tag-securite',
              name: 'Sécurité & Urgence',
              icon: '🛡️',
              colorBg: '#fee2e2',
              colorBorder: '#fca5a5',
              colorText: '#991b1b',
            };
          }
          return t;
        });

        const ids = new Set(updated.map((t) => t.id));
        const missingDefaults = DEFAULT_CUSTOM_TAGS.filter((t) => !ids.has(t.id));
        const merged = missingDefaults.length > 0 ? [...missingDefaults, ...updated] : updated;

        saveTags(merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('Erreur chargement balises personnalisées:', e);
  }
  return DEFAULT_CUSTOM_TAGS;
}

export function saveTags(tags: CustomTag[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tags));
  } catch (e) {
    console.warn('Erreur sauvegarde balises personnalisées:', e);
  }
}

interface TagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: CustomTag[];
  onTagsChange: (newTags: CustomTag[]) => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  onClose,
  tags,
  onTagsChange,
}) => {
  const [editingTag, setEditingTag] = useState<Partial<CustomTag> | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Re-initialiser le formulaire d'édition
  const startCreateNew = () => {
    setIsCreating(true);
    setEditingTag({
      name: '',
      icon: '🏷️',
      colorBg: '#dbeafe',
      colorBorder: '#bfdbfe',
      colorText: '#1e40af',
      description: '',
    });
  };

  const startEdit = (tag: CustomTag) => {
    setIsCreating(false);
    setEditingTag({ ...tag });
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editingTag.name?.trim()) return;

    let updatedList: CustomTag[];
    if (isCreating || !editingTag.id) {
      const newTag: CustomTag = {
        id: `tag-${Date.now()}`,
        name: editingTag.name.trim(),
        icon: editingTag.icon || '🏷️',
        colorBg: editingTag.colorBg || '#dbeafe',
        colorBorder: editingTag.colorBorder || '#bfdbfe',
        colorText: editingTag.colorText || '#1e40af',
        description: editingTag.description || '',
      };
      updatedList = [...tags, newTag];
    } else {
      updatedList = tags.map((t) => (t.id === editingTag.id ? (editingTag as CustomTag) : t));
    }

    onTagsChange(updatedList);
    saveTags(updatedList);
    setEditingTag(null);
    setIsCreating(false);
  };

  const handleDeleteTag = (idToDelete: string) => {
    if (window.confirm('Supprimer cette balise ?')) {
      const updatedList = tags.filter((t) => t.id !== idToDelete);
      onTagsChange(updatedList);
      saveTags(updatedList);
      if (editingTag?.id === idToDelete) {
        setEditingTag(null);
      }
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Réinitialiser toutes les balises avec la liste par défaut ?')) {
      onTagsChange(DEFAULT_CUSTOM_TAGS);
      saveTags(DEFAULT_CUSTOM_TAGS);
      setEditingTag(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              ⚙️ Éditeur de Balises Personnalisées
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
              Créez, modifiez et organisez les balises réutilisables pour vos étapes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            padding: '1.25rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Colonne Gauche : Liste des Balises */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>
                Balises actuelles ({tags.length})
              </strong>
              <button
                type="button"
                onClick={startCreateNew}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                + Nouvelle balise
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tags.map((tag) => {
                const isSelected = editingTag?.id === tag.id;
                return (
                  <div
                    key={tag.id}
                    onClick={() => startEdit(tag)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#2563eb' : tag.colorBorder}`,
                      background: isSelected ? '#eff6ff' : tag.colorBg,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{tag.icon}</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.82rem', color: tag.colorText }}>
                          {tag.name}
                        </strong>
                        {tag.description && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                            {tag.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag.id);
                      }}
                      title="Supprimer la balise"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0.2rem',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                marginTop: 'auto',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.4rem',
                color: '#475569',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Réinitialiser les balises par défaut
            </button>
          </div>

          {/* Colonne Droite : Formulaire de Création / Édition */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {editingTag ? (
              <form onSubmit={handleSaveTag} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 800 }}>
                  {isCreating ? '➕ Nouvelle Balise' : '✏️ Modifier la Balise'}
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Nom de la balise *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTag.name || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    placeholder="Ex : Spécialités locales"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Émoji / Icône
                  </label>
                  <input
                    type="text"
                    value={editingTag.icon || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, icon: e.target.value })}
                    placeholder="Ex : 🍷, 📍, ♿"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Thème de couleur
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                    {PRESET_COLOR_THEMES.map((theme, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setEditingTag({
                            ...editingTag,
                            colorBg: theme.bg,
                            colorBorder: theme.border,
                            colorText: theme.text,
                          })
                        }
                        title={theme.label}
                        style={{
                          height: '28px',
                          borderRadius: '6px',
                          background: theme.bg,
                          border: `2px solid ${editingTag.colorBg === theme.bg ? '#1d4ed8' : theme.border}`,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Description ou consigne (Optionnelle)
                  </label>
                  <textarea
                    rows={3}
                    value={editingTag.description || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                    placeholder="Détail inséré automatiquement dans le texte..."
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Aperçu du Badge */}
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Aperçu rendu visuel :
                  </span>
                  <div
                    style={{
                      background: editingTag.colorBg || '#f1f5f9',
                      borderLeft: `4px solid ${editingTag.colorBorder || '#cbd5e1'}`,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      color: editingTag.colorText || '#0f172a',
                      fontSize: '0.82rem',
                    }}
                  >
                    <strong>
                      {editingTag.icon || '🏷️'} {editingTag.name || 'Nom balise'} :
                    </strong>{' '}
                    {editingTag.description || 'Texte descriptif de la balise...'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    💾 Enregistrer la balise
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🏷️</span>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Sélectionnez une balise à gauche pour la modifier ou cliquez sur <strong>+ Nouvelle balise</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.8rem 1.5rem',
            background: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#1e3a8a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Fermer et appliquer
          </button>
        </div>
      </div>
    </div>
  );
};
