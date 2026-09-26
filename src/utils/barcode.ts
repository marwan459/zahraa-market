import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Product } from '../types';

// ============================================================================
// EAN-13 ENCODING TABLES (GS1 STANDARD)
// ============================================================================

// L-code patterns (7 bits per digit)
const L_CODES: string[] = [
  '0001101', // 0
  '0011001', // 1
  '0010011', // 2
  '0111101', // 3
  '0100011', // 4
  '0110001', // 5
  '0101111', // 6
  '0111011', // 7
  '0110111', // 8
  '0001011', // 9
];

// G-code patterns (reverse of R-code)
const G_CODES: string[] = [
  '0100111', // 0
  '0110011', // 1
  '0011011', // 2
  '0100001', // 3
  '0011101', // 4
  '0111001', // 5
  '0000101', // 6
  '0010001', // 7
  '0001001', // 8
  '0010111', // 9
];

// R-code patterns (bitwise NOT of L-code)
const R_CODES: string[] = [
  '1110010', // 0
  '1100110', // 1
  '1101100', // 2
  '1000010', // 3
  '1011100', // 4
  '1001110', // 5
  '1010000', // 6
  '1000100', // 7
  '1001000', // 8
  '1110100', // 9
];

// Parity table for first digit (determines L/G pattern for left 6 digits)
const PARITY_PATTERNS: string[] = [
  'LLLLLL', // 0
  'LLGLGG', // 1
  'LLGGLG', // 2
  'LLGGGL', // 3
  'LGLLGG', // 4
  'LGGLLG', // 5
  'LGGGLL', // 6
  'LGLGLG', // 7
  'LGLGGL', // 8
  'LGGLGL', // 9
];

/**
 * Calculates standard GS1 modulo-10 check digit for a 12-digit string
 */
export function calculateEan13CheckDigit(digits12: string): number {
  const clean = digits12.replace(/\D/g, '');
  if (clean.length < 12) {
    throw new Error('Need at least 12 digits to calculate EAN-13 check digit');
  }

  let sumOdd = 0; // Digits at 1, 3, 5, 7, 9, 11 (0-indexed: 0, 2, 4, 6, 8, 10)
  let sumEven = 0; // Digits at 2, 4, 6, 8, 10, 12 (0-indexed: 1, 3, 5, 7, 9, 11)

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    if (i % 2 === 0) {
      sumOdd += digit;
    } else {
      sumEven += digit;
    }
  }

  const total = sumOdd + sumEven * 3;
  const mod = total % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates sequential valid EAN-13 barcode starting with 2000000
 * E.g. index 1 => 2000000000015
 */
export function generateEan13Barcode(index: number): string {
  const seq = String(index).padStart(5, '0');
  const first12 = `2000000${seq}`;
  const check = calculateEan13CheckDigit(first12);
  return `${first12}${check}`;
}

/**
 * Validates whether a barcode is a 13-digit valid EAN-13
 */
export function isValidEan13(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  const clean = barcode.trim();
  if (clean.length !== 13 || !/^\d{13}$/.test(clean)) return false;

  const first12 = clean.slice(0, 12);
  const expectedCheck = calculateEan13CheckDigit(first12);
  const actualCheck = parseInt(clean[12], 10);
  return expectedCheck === actualCheck;
}

/**
 * Converts a 13-digit EAN-13 into an array of 95 boolean module states (true = black bar, false = white space)
 */
export function getEan13Modules(barcode: string): { modules: boolean[]; isGuard: boolean[] } {
  let clean = barcode.replace(/\D/g, '');
  if (clean.length === 12) {
    clean += calculateEan13CheckDigit(clean);
  } else if (clean.length !== 13) {
    clean = '2000000000015'; // Fallback
  }

  const firstDigit = parseInt(clean[0], 10);
  const leftDigits = clean.slice(1, 7);
  const rightDigits = clean.slice(7, 13);
  const parity = PARITY_PATTERNS[firstDigit] || 'LLLLLL';

  const modules: boolean[] = [];
  const isGuard: boolean[] = [];

  // Helper to append bits
  const appendBits = (bitStr: string, guard: boolean) => {
    for (let i = 0; i < bitStr.length; i++) {
      modules.push(bitStr[i] === '1');
      isGuard.push(guard);
    }
  };

  // 1. Start marker: 101
  appendBits('101', true);

  // 2. Left 6 digits (using L or G codes according to first digit parity)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(leftDigits[i], 10);
    const codeType = parity[i];
    const pattern = codeType === 'G' ? G_CODES[digit] : L_CODES[digit];
    appendBits(pattern, false);
  }

  // 3. Center marker: 01010
  appendBits('01010', true);

  // 4. Right 6 digits (always R codes)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(rightDigits[i], 10);
    const pattern = R_CODES[digit];
    appendBits(pattern, false);
  }

  // 5. Stop marker: 101
  appendBits('101', true);

  return { modules, isGuard };
}

/**
 * Draws standard crisp EAN-13 barcode on HTML Canvas
 */
export function drawBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  barcode: string,
  options?: {
    width?: number;
    height?: number;
    showText?: boolean;
    fontSize?: number;
    bgColor?: string;
    barColor?: string;
  }
): void {
  const width = options?.width || 260;
  const height = options?.height || 100;
  const showText = options?.showText ?? true;
  const bgColor = options?.bgColor || '#ffffff';
  const barColor = options?.barColor || '#000000';

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const { modules, isGuard } = getEan13Modules(barcode);

  // Layout calculation
  // Total 95 modules + quiet zones (9 left, 9 right = 113 modules total)
  const totalModules = 113;
  const moduleWidth = width / totalModules;
  const leftOffset = 9 * moduleWidth;

  const textHeight = showText ? Math.max(14, Math.floor(height * 0.22)) : 0;
  const barHeightNormal = height - textHeight - 4;
  const barHeightGuard = height - (showText ? Math.floor(textHeight * 0.4) : 4);

  // Draw Bars
  ctx.fillStyle = barColor;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) {
      const x = leftOffset + i * moduleWidth;
      const bHeight = isGuard[i] ? barHeightGuard : barHeightNormal;
      ctx.fillRect(x, 2, Math.max(1, moduleWidth + 0.1), bHeight);
    }
  }

  // Draw Text below
  if (showText) {
    let clean = barcode.replace(/\D/g, '');
    if (clean.length < 13) clean = clean.padEnd(13, '0');

    ctx.fillStyle = barColor;
    ctx.font = `bold ${Math.max(11, Math.floor(textHeight * 0.85))}px "Cairo", "Segoe UI", Arial, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // First digit (outside left guard)
    const firstDigit = clean[0];
    const left6 = clean.slice(1, 7);
    const right6 = clean.slice(7, 13);

    // First digit printed to left of start guard
    ctx.fillText(firstDigit, leftOffset - 4 * moduleWidth, height - 2);

    // Left 6 digits centered between start and center guard
    const leftCenter = leftOffset + (3 + 21) * moduleWidth;
    ctx.fillText(left6, leftCenter, height - 2);

    // Right 6 digits centered between center and stop guard
    const rightCenter = leftOffset + (3 + 42 + 5 + 21) * moduleWidth;
    ctx.fillText(right6, rightCenter, height - 2);
  }
}

/**
 * Returns a PNG data URL of just the EAN-13 barcode
 */
export function generateBarcodeDataUrl(
  barcode: string,
  width = 300,
  height = 110
): string {
  const canvas = document.createElement('canvas');
  drawBarcodeToCanvas(canvas, barcode, { width, height, showText: true });
  return canvas.toDataURL('image/png');
}

/**
 * Draws standard 40mm x 25mm barcode thermal sticker label to Canvas
 * Used for instant browser preview, printing, PDF export, and PNG zip export!
 */
export function drawProductLabelToCanvas(
  canvas: HTMLCanvasElement,
  product: Product,
  options?: { scale?: number }
): void {
  // At scale 10: 400px x 250px (exact 40mm x 25mm at 254 DPI)
  const scale = options?.scale || 10;
  const width = Math.round(40 * scale); // 400
  const height = Math.round(25 * scale); // 250

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Solid white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border guide (thin, crisp)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 1. Header: Store Name & Category
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(15 * (scale / 10))}px "Cairo", Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.direction = 'rtl';
  ctx.fillText('سوبر ماركت الزهراء', width - 12, 10);

  // Price box (bold on top left)
  ctx.textAlign = 'left';
  ctx.direction = 'ltr';
  ctx.font = `900 ${Math.round(17 * (scale / 10))}px "Cairo", Arial, sans-serif`;
  ctx.fillText(`${product.price} ج.م`, 12, 9);

  // 2. Product Name (Arabic, centered or RTL)
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = `bold ${Math.round(15 * (scale / 10))}px "Cairo", Arial, sans-serif`;
  let name = product.nameAr || product.name;
  if (name.length > 28) {
    name = name.slice(0, 26) + '...';
  }
  ctx.fillText(name, width / 2, 36);

  // 3. Subcategory / unit (small subtitle)
  ctx.font = `500 ${Math.round(11 * (scale / 10))}px "Cairo", Arial, sans-serif`;
  const subInfo = [product.subcategoryAr || '', product.unitAr ? `(${product.unitAr})` : ''].filter(Boolean).join(' ');
  if (subInfo) {
    ctx.fillText(subInfo, width / 2, 58);
  }

  // 4. Barcode Drawing in the bottom half
  const barcodeY = Math.round(78 * (scale / 10));
  const barcodeHeight = Math.round(135 * (scale / 10));
  const barcodeWidth = Math.round(330 * (scale / 10));
  const barcodeX = Math.round((width - barcodeWidth) / 2);

  const barcodeCanvas = document.createElement('canvas');
  drawBarcodeToCanvas(barcodeCanvas, product.barcode || '2000000000015', {
    width: barcodeWidth,
    height: barcodeHeight,
    showText: true,
  });

  ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
}

/**
 * Exports products catalog to clean, formatted Excel file (.xlsx)
 * Matching required columns:
 * - اسم المنتج بالعربي
 * - اسم المنتج بالإنجليزي
 * - السعر
 * - الحجم/العبوة
 * - القسم
 * - Barcode
 */
export function exportProductsToExcel(
  products: Product[],
  filename = 'سوبرماركت_الزهراء_كتالوج_الباركود.xlsx'
): void {
  // Sort by category then product name for convenience
  const sorted = [...products].sort((a, b) => {
    if (a.categoryId !== b.categoryId) {
      return a.categoryId.localeCompare(b.categoryId);
    }
    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });

  const rows = sorted.map((p, index) => ({
    'م (العدد)': index + 1,
    'اسم المنتج بالعربي': p.nameAr,
    'اسم المنتج بالإنجليزي': p.name || '',
    'السعر': p.price,
    'الحجم/العبوة': p.unitAr || p.unit || '',
    'القسم': p.subcategoryAr || p.categoryId,
    'Barcode': p.barcode || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set explicit column widths
  worksheet['!cols'] = [
    { wch: 10 }, // م (العدد)
    { wch: 38 }, // اسم المنتج بالعربي
    { wch: 32 }, // اسم المنتج بالإنجليزي
    { wch: 12 }, // السعر
    { wch: 16 }, // الحجم/العبوة
    { wch: 22 }, // القسم
    { wch: 18 }, // Barcode
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات والباركود');

  // Trigger browser download
  XLSX.writeFile(workbook, filename);
}

/**
 * Generates a ZIP file containing high-resolution PNG images for each barcode
 */
export async function generateBarcodeZipBlob(
  products: Product[],
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('barcodes_png') || zip;
  const labelsFolder = zip.folder('labels_40x25mm') || zip;

  const total = products.length;
  const canvas = document.createElement('canvas');
  const labelCanvas = document.createElement('canvas');

  for (let i = 0; i < total; i++) {
    const product = products[i];
    const barcode = product.barcode || generateEan13Barcode(i + 1);

    // 1. Pure Barcode Image
    drawBarcodeToCanvas(canvas, barcode, {
      width: 400,
      height: 160,
      showText: true,
    });
    const barcodeDataUrl = canvas.toDataURL('image/png');
    const base64Barcode = barcodeDataUrl.split(',')[1];

    // Clean safe filename
    const safeName = (product.nameAr || product.name || 'product')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 30);
    const barcodeFileName = `${barcode}_${safeName}.png`;
    folder.file(barcodeFileName, base64Barcode, { base64: true });

    // 2. Full 40x25mm Label Image
    drawProductLabelToCanvas(labelCanvas, product, { scale: 12 });
    const labelDataUrl = labelCanvas.toDataURL('image/png');
    const base64Label = labelDataUrl.split(',')[1];
    labelsFolder.file(`label_${barcode}_${safeName}.png`, base64Label, { base64: true });

    if (onProgress && (i % 25 === 0 || i === total - 1)) {
      const pct = Math.round(((i + 1) / total) * 100);
      onProgress(pct, i + 1, total);
      // Yield thread for smooth UI
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Also include a readme inside the zip
  zip.file(
    'README.txt',
    `سوبر ماركت الزهراء - ملصقات وصور الباركود EAN-13
عدد المنتجات: ${total}
مقاس الملصق: 40x25mm
جميع الأرقام تبدأ بـ 2000000 مع رقم التحقق Check Digit المعتمد عالمياً.
متوافقة مع جميع أجهزة قراءة الباركود وطابعات الملصقات الحرارية.`
  );

  return zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(metadata.percent, total, total);
    }
  });
}

/**
 * Generates ready-to-print PDF for 40x25mm barcode labels
 * Standard format for thermal barcode printers (1 label per page, 40mm x 25mm)
 */
export async function generateLabelsPdf(
  products: Product[],
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<Blob> {
  // Sort products by category first, then name
  const sorted = [...products].sort((a, b) => {
    if (a.categoryId !== b.categoryId) {
      return a.categoryId.localeCompare(b.categoryId);
    }
    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [40, 25],
  });

  const canvas = document.createElement('canvas');
  const total = sorted.length;

  for (let i = 0; i < total; i++) {
    if (i > 0) {
      doc.addPage([40, 25], 'landscape');
    }

    const product = sorted[i];
    drawProductLabelToCanvas(canvas, product, { scale: 12 });
    const imgData = canvas.toDataURL('image/png');

    doc.addImage(imgData, 'PNG', 0, 0, 40, 25, undefined, 'FAST');

    if (onProgress && (i % 25 === 0 || i === total - 1)) {
      const pct = Math.round(((i + 1) / total) * 100);
      onProgress(pct, i + 1, total);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return doc.output('blob');
}

/**
 * Direct browser printing of single product or list of products as 40x25mm labels
 */
export function printProductLabelsInBrowser(products: Product[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }

  const canvas = document.createElement('canvas');
  const labelImagesHtml = products
    .map((product) => {
      drawProductLabelToCanvas(canvas, product, { scale: 12 });
      const dataUrl = canvas.toDataURL('image/png');
      return `
      <div class="label-page">
        <img src="${dataUrl}" alt="${product.nameAr}" />
      </div>`;
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>طباعة ملصقات الباركود - سوبر ماركت الزهراء</title>
      <style>
        @page {
          size: 40mm 25mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: #fff;
        }
        .label-page {
          width: 40mm;
          height: 25mm;
          page-break-after: always;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .label-page img {
          width: 40mm;
          height: 25mm;
          display: block;
          object-fit: contain;
        }
        @media screen {
          body {
            background: #f1f5f9;
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }
          .label-page {
            border: 1px solid #cbd5e1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background: white;
          }
        }
      </style>
    </head>
    <body>
      ${labelImagesHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
