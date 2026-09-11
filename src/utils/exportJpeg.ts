import maplibregl from 'maplibre-gl';
import { StoryData } from '../types/story';

/**
 * Capture le canevas de la carte MapLibre et compose une image JPEG haute définition
 * avec cartouche d'information (titre du parcours, nombre d'étapes, date, échelle).
 */
export async function exportMapAsJpeg(
  map: maplibregl.Map,
  storyData?: StoryData,
  fileName: string = 'parcours-storymap.jpg'
): Promise<void> {
  if (!map) return;

  // S'assurer que le rendu actuel de la carte et des tuiles est complet (sans perturber la caméra actuelle)
  await new Promise<void>((resolve) => {
    if (map.loaded() && map.areTilesLoaded()) {
      resolve();
    } else {
      map.once('idle', () => resolve());
    }
  });

  const mapCanvas = map.getCanvas();
  const width = mapCanvas.width;
  const height = mapCanvas.height;

  // Créer un canvas virtuel de composition
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Dessiner la carte WebGL telle qu'elle est rendue (contenant déjà les tuiles et les calques de tracé multicolores)
  ctx.drawImage(mapCanvas, 0, 0, width, height);

  // Calcul du ratio d'échelle réel entre la résolution du buffer WebGL et les coordonnées CSS de MapLibre
  const cssWidth = mapCanvas.clientWidth || width;
  const scale = width / cssWidth;

  const slides = storyData?.slides || [];

  // 2. Dessiner les pastilles d'étapes et étiquettes avec détection intelligente des collisions
  // Calcul préliminaire des coordonnées écran
  interface ProjectedStep {
    idx: number;
    x: number;
    y: number;
    slide: typeof slides[0];
    placeName: string;
    hasLabel: boolean;
    labelYDirection: 'bottom' | 'top'; // placement de l'étiquette au-dessus ou en-dessous
  }

  const projectedSteps: ProjectedStep[] = [];
  const baseRadius = 15 * scale;

  slides.forEach((slide, idx) => {
    if (!slide.location || slide.location.lat === 0 || slide.location.lon === 0) return;
    const point = map.project([slide.location.lon, slide.location.lat]);
    const x = point.x * scale;
    const y = point.y * scale;

    // Ignorer si hors champ
    if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;

    const placeName = slide.text?.headline;
    const hasLabel = Boolean(
      placeName &&
      placeName !== `Étape ${idx + 1}` &&
      placeName !== 'Nouvelle Slide' &&
      placeName !== 'Étape sans titre'
    );

    projectedSteps.push({
      idx,
      x,
      y,
      slide,
      placeName: placeName || '',
      hasLabel,
      labelYDirection: 'bottom',
    });
  });

  // Résolution des collisions : si deux étapes proches ont des étiquettes sous elles,
  // faire basculer la plus haute (ou paire/impaire) au-dessus
  for (let i = 0; i < projectedSteps.length; i++) {
    for (let j = i + 1; j < projectedSteps.length; j++) {
      const p1 = projectedSteps[i];
      const p2 = projectedSteps[j];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      // Si la distance est inférieure à ~55px écran
      if (dist < 55 * scale) {
        if (p1.y <= p2.y) {
          p1.labelYDirection = 'top';
          p2.labelYDirection = 'bottom';
        } else {
          p1.labelYDirection = 'bottom';
          p2.labelYDirection = 'top';
        }
      }
    }
  }

  // 2.a Dessin des pastilles
  projectedSteps.forEach((step) => {
    const { x, y, idx } = step;
    const stepNumber = String(idx + 1);

    ctx.save();
    // Ombre portée sous la pastille
    ctx.shadowColor = 'rgba(15, 23, 42, 0.4)';
    ctx.shadowBlur = 7 * scale;
    ctx.shadowOffsetY = 2.5 * scale;

    // Disque (Rouge départ pour étape 1, Bleu royal pour les autres)
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = idx === 0 ? '#dc2626' : '#2563eb';
    ctx.fill();

    // Bordure blanche franche
    ctx.lineWidth = 2.2 * scale;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // Numéro de l'étape centré
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stepNumber, x, y + 0.5 * scale);
  });

  // 2.b Dessin des étiquettes de lieu
  projectedSteps.forEach((step) => {
    if (!step.hasLabel) return;
    const { x, y, placeName, labelYDirection } = step;

    ctx.save();
    ctx.font = `bold ${Math.round(10.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    const labelText = truncateText(ctx, placeName, 150 * scale);
    const textMetrics = ctx.measureText(labelText);
    const labelW = textMetrics.width + 12 * scale;
    const labelH = 18 * scale;
    const labelX = Math.max(8 * scale, Math.min(width - labelW - 8 * scale, x - labelW / 2));

    // Détermination de la position Y selon la direction anti-collision
    const labelY = labelYDirection === 'top'
      ? y - baseRadius - labelH - 3 * scale
      : y + baseRadius + 3 * scale;

    // Ombre douce sur l'étiquette
    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 1.5 * scale;

    // Fond blanc
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, labelX, labelY, labelW, labelH, 4 * scale);
    ctx.fill();
    ctx.restore();

    // Bordure étiquette
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1 * scale;
    roundRect(ctx, labelX, labelY, labelW, labelH, 4 * scale);
    ctx.stroke();

    // Texte du nom
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(10.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, labelX + labelW / 2, labelY + labelH / 2);
    ctx.restore();
  });

  // 3. Cartouche d'information en haut à gauche (avec marge de sécurité absolue garantie)
  const title = storyData?.slides?.[0]?.text?.headline || 'Circuit Touristique Interactif';
  const slideCount = storyData?.slides?.length || 0;

  const safeMargin = 18 * scale;
  const cartoucheWidth = Math.min(width * 0.42, 340 * scale);
  const cartoucheHeight = 64 * scale;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetY = 3 * scale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  roundRect(ctx, safeMargin, safeMargin, cartoucheWidth, cartoucheHeight, 10 * scale);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2 * scale;
  roundRect(ctx, safeMargin, safeMargin, cartoucheWidth, cartoucheHeight, 10 * scale);
  ctx.stroke();

  // Titre dans le cartouche
  ctx.fillStyle = '#1e3a8a';
  ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, title, cartoucheWidth - 28 * scale), safeMargin + 14 * scale, safeMargin + 13 * scale);

  // Sous-titre
  ctx.fillStyle = '#64748b';
  ctx.font = `500 ${Math.round(10.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(`${slideCount} étapes • Circuit & Guidage`, safeMargin + 14 * scale, safeMargin + 37 * scale);
  ctx.restore();

  // 4. Légende des mobilités en haut à droite (calée avec marge de sécurité exacte)
  const legendItems = [
    { label: 'À pied', color: '#0284c7' },
    { label: 'Vélo', color: '#10b981' },
    { label: 'Transport', color: '#8b5cf6' },
  ];
  const legHeight = 30 * scale;
  const legWidth = 230 * scale;
  const legX = width - legWidth - safeMargin;
  const legY = safeMargin;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  roundRect(ctx, legX, legY, legWidth, legHeight, 8 * scale);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1 * scale;
  roundRect(ctx, legX, legY, legWidth, legHeight, 8 * scale);
  ctx.stroke();

  let itemCursorX = legX + 10 * scale;
  const centerY = legY + legHeight / 2;

  legendItems.forEach((item) => {
    // Tiret coloré
    ctx.fillStyle = item.color;
    roundRect(ctx, itemCursorX, centerY - 2 * scale, 14 * scale, 4 * scale, 2 * scale);
    ctx.fill();

    // Texte
    ctx.fillStyle = '#1e293b';
    ctx.font = `600 ${Math.round(9.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, itemCursorX + 18 * scale, centerY);

    itemCursorX += 70 * scale;
  });
  ctx.restore();

  // 5. Mention légale / copyright discrète au coin inférieur droit
  const legalText = 'StoryMap Tourisme & Mobilités • OpenStreetMap & MapLibre';
  ctx.save();
  ctx.font = `500 ${Math.round(9.5 * scale)}px sans-serif`;
  const legalMetrics = ctx.measureText(legalText);
  const legalBoxW = legalMetrics.width + 16 * scale;
  const legalBoxH = 20 * scale;
  const legalBoxX = width - legalBoxW - safeMargin;
  const legalBoxY = height - legalBoxH - safeMargin;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  roundRect(ctx, legalBoxX, legalBoxY, legalBoxW, legalBoxH, 5 * scale);
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1 * scale;
  roundRect(ctx, legalBoxX, legalBoxY, legalBoxW, legalBoxH, 5 * scale);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(legalText, legalBoxX + 8 * scale, legalBoxY + legalBoxH / 2);
  ctx.restore();

  // 4. Export JPEG haute qualité
  exportCanvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    'image/jpeg',
    0.95
  );
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
