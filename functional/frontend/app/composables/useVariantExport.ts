/**
 * Composable for variant export functionality
 * Handles PDF generation, printing, and sharing
 * Based on React implementation from adminka/src/lib/pdfDownload.ts
 */
import type { GeneratedVariant } from '@/types/generatedVariant';

// CDN URLs for PDF libraries
const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';

// Type definitions for dynamically loaded libraries
type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    backgroundColor?: string | null;
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
    windowHeight?: number;
    onclone?: (clonedDoc: Document) => void;
  },
) => Promise<HTMLCanvasElement>;

type JsPdfInstance = {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  addImage: (
    imageData: string,
    format: 'PNG' | 'JPEG',
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  addPage: () => void;
  save: (fileName: string) => void;
};

type JsPdfCtor = new (
  orientation: 'p' | 'l',
  unit: 'mm' | 'pt' | 'px',
  format: 'a4' | [number, number],
) => JsPdfInstance;

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
    jspdf?: {
      jsPDF?: JsPdfCtor;
    };
  }
}

// Script loading cache
const scriptLoadingMap = new Map<string, Promise<void>>();

const loadScriptOnce = (src: string): Promise<void> => {
  const existingPromise = scriptLoadingMap.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Скачивание PDF доступно только в браузере.'));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`Не удалось загрузить ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.loaded = 'false';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      reject(new Error(`Не удалось загрузить ${src}`));
    }, { once: true });

    document.head.appendChild(script);
  });

  scriptLoadingMap.set(src, promise);
  return promise;
};

const loadPdfLibs = async () => {
  await loadScriptOnce(HTML2CANVAS_CDN);
  await loadScriptOnce(JSPDF_CDN);

  const html2canvas = window.html2canvas;
  const jsPDF = window.jspdf?.jsPDF;

  if (!html2canvas || !jsPDF) {
    throw new Error('Не удалось инициализировать библиотеки для PDF.');
  }

  return { html2canvas, jsPDF };
};

const sanitizeFileName = (value: string): string => {
  const trimmed = value.trim() || 'variant';
  const normalized = trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
  return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
};

const hideElements = (root: HTMLElement, selectors: string[]) => {
  const snapshot: Array<{ element: HTMLElement; display: string; visibility: string }> = [];
  selectors.forEach((selector) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      snapshot.push({
        element,
        display: element.style.display,
        visibility: element.style.visibility,
      });
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    });
  });
  return snapshot;
};

const restoreHiddenElements = (snapshot: Array<{ element: HTMLElement; display: string; visibility: string }>) => {
  snapshot.forEach((item) => {
    item.element.style.display = item.display;
    item.element.style.visibility = item.visibility;
  });
};

export const useVariantExport = () => {
  const toast = useToast();
  const { isDownloadingPdf } = useVariantState();
  const variantsStore = useVariantsStore();
  const { isAuthenticated, openLoginModal } = useAuth();

  /**
   * Generate PDF from variant using html2canvas and jsPDF
   * Uses CDN-loaded libraries for better compatibility
   */
  const downloadVariantPdf = async (elementId: string = 'variant-content') => {
    if (!import.meta.client) return;

    isDownloadingPdf.value = true;

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Элемент с id="${elementId}" не найден. Убедитесь, что вариант загружен.`);
      }

      // Load PDF libraries from CDN
      const { html2canvas, jsPDF } = await loadPdfLibs();

      // Hide elements that shouldn't appear in PDF
      const hiddenSnapshot = hideElements(element, ['.no-print', '[data-no-print]']);

      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,
          onclone: (clonedDoc) => {
            // Fix oklch() colors that html2canvas doesn't support
            const elements = clonedDoc.getElementsByTagName('*');
            const cvs = clonedDoc.createElement('canvas');
            cvs.width = 1;
            cvs.height = 1;
            const ctx = cvs.getContext('2d');
            if (!ctx) return;

            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              if (!el.style) continue;

              const computedStyle = window.getComputedStyle(el);
              
              const fixColor = (color: string) => {
                if (!color || !color.includes('oklch')) return color;
                try {
                  ctx.fillStyle = color;
                  return ctx.fillStyle;
                } catch {
                  return color;
                }
              };

              const styleProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor'];
              styleProps.forEach(prop => {
                const val = computedStyle.getPropertyValue(prop);
                if (val && val.includes('oklch')) {
                  el.style.setProperty(prop, fixColor(val), 'important');
                }
              });
            }
          }
        });

        // Create PDF with proper pagination
        const pdf = new jsPDF('p', 'mm', 'a4');
        const marginMm = 8;
        const pageWidthMm = pdf.internal.pageSize.getWidth();
        const pageHeightMm = pdf.internal.pageSize.getHeight();
        const contentWidthMm = pageWidthMm - marginMm * 2;
        const contentHeightMm = pageHeightMm - marginMm * 2;

        const pixelsPerMm = canvas.width / contentWidthMm;
        const pageHeightPx = Math.floor(contentHeightMm * pixelsPerMm);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx;
        const context = pageCanvas.getContext('2d');

        if (!context) {
          throw new Error('Не удалось подготовить холст для PDF.');
        }

        let renderedOffsetPx = 0;
        let pageIndex = 0;

        while (renderedOffsetPx < canvas.height) {
          const remainingPx = canvas.height - renderedOffsetPx;
          const sliceHeightPx = Math.min(pageHeightPx, remainingPx);

          pageCanvas.height = sliceHeightPx;
          context.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          context.drawImage(
            canvas,
            0,
            renderedOffsetPx,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            pageCanvas.width,
            sliceHeightPx,
          );

          const imageData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const imageHeightMm = sliceHeightPx / pixelsPerMm;

          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(imageData, 'JPEG', marginMm, marginMm, contentWidthMm, imageHeightMm);

          renderedOffsetPx += sliceHeightPx;
          pageIndex += 1;
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(sanitizeFileName(`variant_${timestamp}`));

        toast.add({
          title: 'PDF скачан',
          description: 'Вариант успешно сохранен в PDF',
          color: 'success',
          icon: 'i-lucide-download',
        });
      } finally {
        restoreHiddenElements(hiddenSnapshot);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.add({
        title: 'Ошибка',
        description: (error as Error).message || 'Не удалось создать PDF',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
    } finally {
      isDownloadingPdf.value = false;
    }
  };

  /**
   * Print variant using browser print dialog
   */
  const printVariant = (elementId: string = 'variant-content') => {
    if (!import.meta.client) return;

    const element = document.getElementById(elementId);
    if (!element) {
      toast.add({
        title: 'Ошибка',
        description: `Элемент с id="${elementId}" не найден`,
        color: 'error',
      });
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.',
        color: 'error',
      });
      return;
    }

    // Get styles from current page
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Вариант ЕГЭ</title>
          <style>
            ${styles}
            @media print {
              body { 
                margin: 0; 
                padding: 20px;
                font-family: 'Times New Roman', serif;
              }
              .no-print, [data-no-print] { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  /**
   * Save variant to user profile
   */
  const saveVariantToProfile = async (variant: GeneratedVariant) => {
    if (!isAuthenticated.value) {
      openLoginModal();
      return false;
    }

    try {
      await variantsStore.saveVariant(variant);
      toast.add({
        title: 'Сохранено',
        description: 'Вариант сохранен в ваш профиль',
        color: 'success',
        icon: 'i-lucide-bookmark-check',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'Ошибка',
        description: 'Не удалось сохранить вариант',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
      return false;
    }
  };

  /**
   * Generate shareable link for variant
   */
  const generateShareableLink = async (variantId?: number) => {
    if (!import.meta.client) return null;

    // Generate a unique ID for the variant
    const shareId = variantId || `temp_${Date.now()}`;
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/variant/${shareId}`;

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      toast.add({
        title: 'Ссылка скопирована',
        description: 'Ссылка на вариант скопирована в буфер обмена',
        color: 'success',
        icon: 'i-lucide-link',
      });
      return shareLink;
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      toast.add({
        title: 'Ссылка создана',
        description: shareLink,
        color: 'info',
        icon: 'i-lucide-link',
      });
      return shareLink;
    }
  };

  /**
   * Share variant via Web Share API (mobile)
   */
  const shareVariant = async (variant: GeneratedVariant, variantId?: number) => {
    if (!import.meta.client) return;

    const title = variant.work?.title
      ? `Вариант ЕГЭ: ${variant.work.title}`
      : 'Вариант ЕГЭ по литературе';

    const shareId = variantId || `temp_${Date.now()}`;
    const shareUrl = `${window.location.origin}/variant/${shareId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: 'Посмотрите этот вариант ЕГЭ по литературе',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        await generateShareableLink(variantId);
      }
    } else {
      // Fallback to clipboard
      await generateShareableLink(variantId);
    }
  };

  return {
    downloadVariantPdf,
    printVariant,
    saveVariantToProfile,
    generateShareableLink,
    shareVariant,
    isDownloadingPdf: readonly(isDownloadingPdf),
  };
};
