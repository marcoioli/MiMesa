import { toPng } from 'html-to-image';
import { CANVAS_NODE_ID, EXPORT_IGNORE_ATTR } from '../../lib/constants';
import { slugify } from '../../lib/text';

export async function exportCanvas(eventName: string): Promise<void> {
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
    width: 1600,
    height: 1200,
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
    // Documented one-shot retry when dataUrl is empty or corrupt
    dataUrl = await toPng(node, options);
  }

  const filename = `plano-${slugify(eventName)}.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
