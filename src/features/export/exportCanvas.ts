import { toPng } from 'html-to-image';
import { CANVAS_H, CANVAS_NODE_ID, CANVAS_W, EXPORT_IGNORE_ATTR } from '../../lib/constants';
import { tableBox } from '../../lib/geometry';
import type { Table } from '../../store/types';
import { slugify } from '../../lib/text';

export async function exportCanvas(eventName: string, tables?: Table[]): Promise<void> {
  const node = document.getElementById(CANVAS_NODE_ID);
  if (!node) return;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const options = {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
    skipFonts: true,
    width: CANVAS_W,
    height: CANVAS_H,
    filter: (domNode: Node) => {
      if (domNode instanceof HTMLElement) {
        if (
          domNode.getAttribute('data-export-ignore') === 'true' ||
          domNode.getAttribute(EXPORT_IGNORE_ATTR) === 'true'
        ) {
          return false;
        }
      }
      return true;
    },
    style: {
      transform: 'none',
      transformOrigin: '0 0',
    },
  };

  let dataUrl = await toPng(node, options);
  if (dataUrl.length < 5000) {
    dataUrl = await toPng(node, options);
  }

  // If tables exist, adapt the export to the area actually used (plus padding)
  if (tables && tables.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const t of tables) {
      const box = tableBox(t.capacity) * (t.scale ?? 1);
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + box);
      maxY = Math.max(maxY, t.y + box);
    }

    const padding = 70;
    let cropX = Math.max(0, minX - padding);
    let cropY = Math.max(0, minY - padding);
    let cropW = Math.min(CANVAS_W, maxX + padding) - cropX;
    let cropH = Math.min(CANVAS_H, maxY + padding) - cropY;

    // Minimum dimensions so a 1-table event isn't an awkwardly small stamp
    const MIN_W = 600;
    const MIN_H = 450;
    if (cropW < MIN_W) {
      const diff = MIN_W - cropW;
      cropX = Math.max(0, Math.min(CANVAS_W - MIN_W, cropX - diff / 2));
      cropW = Math.min(CANVAS_W, MIN_W);
    }
    if (cropH < MIN_H) {
      const diff = MIN_H - cropH;
      cropY = Math.max(0, Math.min(CANVAS_H - MIN_H, cropY - diff / 2));
      cropH = Math.min(CANVAS_H, MIN_H);
    }

    // Only crop if it saves significant empty space
    if (cropW < CANVAS_W * 0.95 || cropH < CANVAS_H * 0.95) {
      try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
        });

        const pixelRatio = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(cropW * pixelRatio);
        canvas.height = Math.round(cropH * pixelRatio);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            Math.round(cropX * pixelRatio),
            Math.round(cropY * pixelRatio),
            Math.round(cropW * pixelRatio),
            Math.round(cropH * pixelRatio),
            0,
            0,
            canvas.width,
            canvas.height,
          );
          dataUrl = canvas.toDataURL('image/png');
        }
      } catch {
        // Fallback to full canvas if cropping encountered an issue
      }
    }
  }

  const filename = `plano-${slugify(eventName)}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
