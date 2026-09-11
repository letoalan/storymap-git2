import React, { useRef, useEffect, useState } from 'react';
import { CustomTag, loadSavedTags, TagEditorModal } from './TagEditorModal';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FONT_FAMILIES = [
  { name: 'Police par défaut', value: 'inherit' },
  { name: 'Sans-Serif (Moderne)', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia (Élégant)', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Monospace (Code)', value: '"Courier New", Courier, monospace' },
  { name: 'Facile à lire (Comic / Dyslexique)', value: '"Comic Sans MS", "Comic Neue", cursive, sans-serif' },
];

const FONT_SIZES = [
  { label: '12px (Très petit)', value: '12px' },
  { label: '14px (Petit)', value: '14px' },
  { label: '16px (Normal)', value: '16px' },
  { label: '18px (Moyen)', value: '18px' },
  { label: '20px (Grand)', value: '20px' },
  { label: '24px (Très grand)', value: '24px' },
  { label: '28px (Titre)', value: '28px' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Jaune', color: '#fef08a', border: '#fde047' },
  { name: 'Vert', color: '#bbf7d0', border: '#86efac' },
  { name: 'Bleu', color: '#bfdbfe', border: '#93c5fd' },
  { name: 'Rose', color: '#fbcfe8', border: '#f9a8d4' },
  { name: 'Orange', color: '#fed7aa', border: '#fdba74' },
  { name: 'Effacer', color: 'transparent', border: '#cbd5e1' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Rédigez la description narrative de l'étape...",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [selectedFont, setSelectedFont] = useState('inherit');
  const [selectedSize, setSelectedSize] = useState('16px');

  // Charger les balises sauvegardées au montage
  useEffect(() => {
    setCustomTags(loadSavedTags());
  }, []);

  // Synchroniser le contenu HTML sans réinitialiser le curseur pendant la frappe
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Application de la taille de police en PX
  const applyFontSize = (sizePx: string) => {
    setSelectedSize(sizePx);
    if (!editorRef.current) return;
    editorRef.current.focus();

    document.execCommand('fontSize', false, '7');

    const fontEls = editorRef.current.querySelectorAll('font[size="7"]');
    fontEls.forEach((fontEl) => {
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.innerHTML = fontEl.innerHTML;
      fontEl.parentNode?.replaceChild(span, fontEl);
    });

    handleInput();
  };

  // Application de la police de caractères
  const applyFontFamily = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (fontFamily === 'inherit') {
      document.execCommand('removeFormat', false, undefined);
    } else {
      document.execCommand('fontName', false, fontFamily);
    }

    handleInput();
  };

  // Surlignage du texte sélectionné
  const applyHighlight = (color: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (color === 'transparent') {
      document.execCommand('hiliteColor', false, 'transparent');
      document.execCommand('backColor', false, 'transparent');
    } else {
      if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }
    }

    setShowHighlightPicker(false);
    handleInput();
  };

  // Insertion d'une balise personnalisée dans le texte WYSIWYG
  const insertCustomTag = (tag: CustomTag) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const snippetHtml = `<p style="background: ${tag.colorBg}; border-left: 4px solid ${tag.colorBorder}; padding: 0.6rem 0.8rem; border-radius: 6px; margin: 0.5rem 0; color: ${tag.colorText};"><strong>${tag.icon} ${tag.name} :</strong> ${tag.description || 'Information...'}</p>`;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = snippetHtml;
      const fragment = document.createDocumentFragment();
      let node: Node | null;
      let lastNode: Node | null = null;

      while ((node = tempDiv.firstChild)) {
        lastNode = fragment.appendChild(node);
      }

      range.insertNode(fragment);

      if (lastNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      editorRef.current.innerHTML += snippetHtml;
    }

    setShowTagMenu(false);
    handleInput();
  };

  return (
    <>
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          background: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box',
          flex: 1,
          minHeight: '220px',
        }}
      >
        {/* Barre d'outils WYSIWYG */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.5rem 0.65rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            boxSizing: 'border-box',
          }}
        >
          {/* Groupe 1 : Choix de la police */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <select
              value={selectedFont}
              onChange={(e) => applyFontFamily(e.target.value)}
              title="Changer la police de caractères"
              style={{
                padding: '0.25rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.78rem',
                color: '#1e293b',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: '130px',
              }}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Groupe 2 : Taille de police */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <select
              value={selectedSize}
              onChange={(e) => applyFontSize(e.target.value)}
              title="Changer la taille du texte"
              style={{
                padding: '0.25rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.78rem',
                color: '#1e293b',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 0.15rem' }} />

          {/* Groupe 3 : Style de texte (Gras, Italique, Souligné) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <button
              type="button"
              onClick={() => execCmd('bold')}
              title="Gras (Ctrl+B)"
              style={toolbarBtnStyle}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              title="Italique (Ctrl+I)"
              style={toolbarBtnStyle}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              title="Souligné (Ctrl+U)"
              style={toolbarBtnStyle}
            >
              <u>U</u>
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 0.15rem' }} />

          {/* Groupe 4 : Surlignage */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowTagMenu(false);
              }}
              title="Surligner le texte sélectionné"
              style={{
                ...toolbarBtnStyle,
                background: showHighlightPicker ? '#e2e8f0' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>🖍️</span>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>▾</span>
            </button>

            {showHighlightPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  zIndex: 100,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.35rem',
                  width: '120px',
                }}
              >
                {HIGHLIGHT_COLORS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => applyHighlight(item.color)}
                    title={`Surligner en ${item.name}`}
                    style={{
                      width: '100%',
                      height: '24px',
                      borderRadius: '4px',
                      border: `1.5px solid ${item.border}`,
                      background: item.color,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#334155',
                      fontWeight: 700,
                    }}
                  >
                    {item.color === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 0.15rem' }} />

          {/* Groupe 5 : Alignement & Listes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <button
              type="button"
              onClick={() => execCmd('justifyLeft')}
              title="Aligner à gauche"
              style={toolbarBtnStyle}
            >
              ⬅️
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyCenter')}
              title="Centrer"
              style={toolbarBtnStyle}
            >
              ↔️
            </button>
            <button
              type="button"
              onClick={() => execCmd('justifyRight')}
              title="Aligner à droite"
              style={toolbarBtnStyle}
            >
              ➡️
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              title="Liste à puces"
              style={toolbarBtnStyle}
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              title="Liste numérotée"
              style={toolbarBtnStyle}
            >
              1. List
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 0.15rem' }} />

          {/* Groupe 6 : Raccourcis directs & Menu Balises Personnalisées */}
          <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() =>
                insertCustomTag({
                  id: 'tag-securite',
                  name: 'Sécurité & Urgence',
                  icon: '🛡️',
                  colorBg: '#fee2e2',
                  colorBorder: '#fca5a5',
                  colorText: '#991b1b',
                  description: 'Zone piétonne sécurisée. Numéro d\'urgence : 112. Point de rassemblement identifié.',
                })
              }
              title="Ajouter l'encadré Sécurité & Urgence"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              🛡️ Sécurité
            </button>
            <button
              type="button"
              onClick={() =>
                insertCustomTag({
                  id: 'tag-vip',
                  name: 'Accès VIP',
                  icon: '✨',
                  colorBg: '#fef3c7',
                  colorBorder: '#fde68a',
                  colorText: '#92400e',
                  description: 'Visite privative avec guide certifié. Accès prioritaire réservé au groupe.',
                })
              }
              title="Ajouter l'encadré Accès VIP"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              ✨ VIP
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTagMenu(!showTagMenu);
                setShowHighlightPicker(false);
              }}
              title="Insérer une autre balise personnalisée"
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.6rem',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              🏷️ Balises ▾
            </button>

            {showTagMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 100,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  minWidth: '230px',
                  maxWidth: '300px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.2rem 0.4rem',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    background: '#ffffff',
                    zIndex: 2,
                  }}
                >
                  Insérer une balise
                </div>

                {/* Conteneur défilant pour la liste des balises */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem',
                  }}
                >
                  {customTags.length > 0 ? (
                    customTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => insertCustomTag(tag)}
                        style={{
                          padding: '0.4rem 0.55rem',
                          borderRadius: '6px',
                          border: `1px solid ${tag.colorBorder}`,
                          background: tag.colorBg,
                          color: tag.colorText,
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'transform 0.1s ease',
                          flexShrink: 0,
                        }}
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.name}</span>
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.4rem' }}>
                      Aucune balise créée.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowTagMenu(false);
                    setIsTagModalOpen(true);
                  }}
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px dashed #2563eb',
                    background: '#f8fafc',
                    color: '#2563eb',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    position: 'sticky',
                    bottom: 0,
                  }}
                >
                  ⚙️ Éditeur de balises...
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zone d'édition WYSIWYG (contentEditable) */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{
            minHeight: '160px',
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem',
            fontSize: '0.88rem',
            lineHeight: '1.55',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            background: '#ffffff',
          }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Modale d'Éditeur de Balises */}
      <TagEditorModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={customTags}
        onTagsChange={(newTags) => setCustomTags(newTags)}
      />
    </>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.45rem',
  borderRadius: '5px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '26px',
  height: '26px',
  boxSizing: 'border-box',
  transition: 'all 0.15s ease',
};
