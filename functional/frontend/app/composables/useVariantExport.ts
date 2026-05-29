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
  const { variant, isDownloadingPdf } = useVariantState();
  const { isAuthenticated, openLoginModal } = useAuth();
  const variantsStore = useVariantsStore();

  /**
   * Print variant using browser print dialog
   */
  const printVariant = (elementId: string = 'variant-content-pdf') => {
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
          <title>Вариант ЕГЭ | ege.kritsky.academy </title>
          <style>
            ${styles}
            @media print {
              body { 
                margin: 0; 
                padding: 20px; 
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
  const saveVariantToProfile = async () => {
    if (!isAuthenticated.value) {
      openLoginModal();
      return false;
    }

    if (!variant.value) return;

    try {
      await variantsStore.saveVariant(variant.value);
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
    printVariant,
    saveVariantToProfile,
    generateShareableLink,
    shareVariant,
    isDownloadingPdf: readonly(isDownloadingPdf),
  };
};
